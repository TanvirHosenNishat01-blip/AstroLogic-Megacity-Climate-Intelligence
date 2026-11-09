"""Comparison API. Statistics come only from src.compute.trend."""
import csv
import io
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from src.acquire.district_alert import district_report
from src.acquire.safe import TARGETS, fetch_live_hazards, fetch_nasa_power_daily, fetch_recent_point, offline_requested
from src.compute.correlate import BANDS, MIN_PAIRS, align_years, relate_values
from src.compute.trend import mann_kendall_test, theil_sen_slope

app = FastAPI(title="Trend Detective")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT = Path(__file__).resolve().parents[2]
CITIES_DIR = ROOT / "data" / "cities"

VARIABLES = {
    "T2M": {"unit": "°C", "kind": "temperature"},
    "T2M_MIN": {"unit": "°C", "kind": "temperature"},
    "T2M_MAX": {"unit": "°C", "kind": "temperature"},
    "PRECTOTCORR": {"unit": "mm/day", "kind": "rain"},
}
SEASONS = {
    "ALL": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "MAM": [3, 4, 5],
    "JJAS": [6, 7, 8, 9],
    "DJF": [12, 1, 2],
    "ON": [10, 11],
}
YEAR_MIN = 2004
YEAR_MAX = 2024
COVERAGE = 0.80
PAIRS = (
    {"id": "bangladesh", "a": "dhaka", "b": "sylhet", "lang": "bn"},
    {"id": "india", "a": "delhi", "b": "kolkata", "lang": "hi"},
    {"id": "indonesia", "a": "jakarta", "b": "surabaya", "lang": "id"},
    {"id": "egypt", "a": "cairo", "b": "alexandria", "lang": "ar"},
    {"id": "nigeria", "a": "lagos", "b": "abuja", "lang": "yo"},
)


def load_city(city_id: str) -> dict:
    path = CITIES_DIR / f"{city_id.lower()}.json"
    if not path.exists() or city_id.lower() not in TARGETS:
        raise HTTPException(status_code=404, detail=f"Unknown city: {city_id}")
    data = json.loads(path.read_text(encoding="utf-8"))
    data["lat"] = TARGETS[city_id.lower()]["lat"]
    data["lon"] = TARGETS[city_id.lower()]["lon"]
    return data


def _leap(year: int) -> bool:
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


def _days_in_month(year: int, month: int) -> int:
    if month == 2:
        return 29 if _leap(year) else 28
    if month in (4, 6, 9, 11):
        return 30
    return 31


def _expected_days(year: int, season: str) -> int:
    if season == "DJF":
        # December of the previous year plus January and February of this year.
        prev = year - 1
        return _days_in_month(prev, 12) + _days_in_month(year, 1) + _days_in_month(year, 2)
    return sum(_days_in_month(year, month) for month in SEASONS[season])


def _season_bucket(date_str: str, season: str):
    year = int(date_str[:4])
    month = int(date_str[4:6])
    if season == "DJF":
        if month == 12:
            return year + 1
        if month in (1, 2):
            return year
        return None
    if month in SEASONS[season]:
        return year
    return None


def annual_series(parameter: dict, variable: str, season: str, start_year: int, end_year: int) -> dict:
    series = parameter.get(variable) or {}
    fill_values = {-999, -999.0}
    totals = {}
    counts = {}
    missing_marked = 0
    observed = 0
    for date_str, raw in series.items():
        bucket = _season_bucket(str(date_str), season)
        if bucket is None or bucket < start_year or bucket > end_year:
            continue
        try:
            value = float(raw)
        except (TypeError, ValueError):
            missing_marked += 1
            continue
        if value in fill_values:
            missing_marked += 1
            continue
        totals[bucket] = totals.get(bucket, 0.0) + value
        counts[bucket] = counts.get(bucket, 0) + 1
        observed += 1

    years = []
    values = []
    day_counts = []
    excluded = []
    for year in range(start_year, end_year + 1):
        expected = _expected_days(year, season)
        count = counts.get(year, 0)
        # 2004 DJF has no December 2003 in this record.
        if season == "DJF" and year == start_year:
            expected = _days_in_month(year, 1) + _days_in_month(year, 2)
        if count <= 0:
            excluded.append({"year": year, "days": 0, "expected": expected, "reason": "no observations"})
            continue
        if count < COVERAGE * expected:
            excluded.append({"year": year, "days": count, "expected": expected, "reason": "below 80% of expected days"})
            continue
        years.append(year)
        values.append(totals[year] / count)
        day_counts.append(count)

    trend = mann_kendall_test(values)
    slope = theil_sen_slope(years, values)
    fitted = [slope["slope"] * year + slope["intercept"] for year in years]
    return {
        "years": years,
        "values": values,
        "day_counts": day_counts,
        "fitted": fitted,
        "trend": trend,
        "slope": slope,
        "excluded_years": excluded,
        "observed_days": observed,
        "missing_marked": missing_marked,
    }


def _public_point(city: dict, computed: dict, meta: dict, mode: str, variable: str, start_year: int = YEAR_MIN, end_year: int = YEAR_MAX) -> dict:
    unit = VARIABLES[variable]["unit"]
    slope = computed["slope"]["slope"]
    source_url = meta.get("request_url") or "https://power.larc.nasa.gov/api/temporal/daily/point"
    retrieved = meta.get("fetched_at") or "saved file"
    return {
        "id": city["id"],
        "name": city["name"],
        "country": city["country"],
        "lang": city.get("lang", "en"),
        "lat": city["lat"],
        "lon": city["lon"],
        "agencies": city.get("agencies", {}),
        "years": computed["years"],
        "values": [round(v, 4) for v in computed["values"]],
        "day_counts": computed["day_counts"],
        "fitted": [round(v, 4) for v in computed["fitted"]],
        "trend": computed["trend"],
        "slope": {
            "per_year": slope,
            "per_decade": slope * 10,
            "ci_low_per_year": computed["slope"]["ci_low"],
            "ci_high_per_year": computed["slope"]["ci_high"],
            "ci_low_per_decade": computed["slope"]["ci_low"] * 10,
            "ci_high_per_decade": computed["slope"]["ci_high"] * 10,
            "confidence": computed["slope"]["confidence"],
            "intercept": computed["slope"]["intercept"],
            "unit": unit,
        },
        "gaps": {
            "observed_days": computed["observed_days"],
            "missing_marked": computed["missing_marked"],
            "years_used": len(computed["years"]),
            "years_excluded": computed["excluded_years"],
            "coverage_rule": "A year is used only when at least 80% of its expected days are present.",
        },
        "provenance": {
            "dataset": "NASA POWER Daily Point API",
            "underlying_sources": meta.get("sources") or ["MERRA2", "POWER"],
            "variable": variable,
            "unit": unit,
            "fill_value": meta.get("fill_value", -999),
            "requested_latitude": meta.get("requested_latitude", city["lat"]),
            "requested_longitude": meta.get("requested_longitude", city["lon"]),
            "returned_latitude": meta.get("latitude", city["lat"]),
            "returned_longitude": meta.get("longitude", city["lon"]),
            "start": meta.get("start", "20040101"),
            "end": meta.get("end", "20241231"),
            "fetched_at": meta.get("fetched_at"),
            "request_url": meta.get("request_url"),
            "mode": mode,
            "mode_text": {
                "live": "Downloaded from NASA POWER just now.",
                "saved": "Saved NASA POWER file on this computer. The page works with the network off.",
                "offline": "Offline switch is on. Reading the saved NASA POWER file.",
            }.get(mode, mode),
        },
        "result_object": {
            "district": city["name"],
            "variable": variable,
            "period": f"{start_year}-01-01 to {end_year}-12-31",
            "n_observations": computed["observed_days"],
            "trend": {
                "S": round(float(computed["trend"]["S"]), 1),
                "Z": round(float(computed["trend"]["Z"]), 4),
                "p_value": round(float(computed["trend"]["p_value"]), 6),
                "direction": computed["trend"]["direction"],
                "significant_at_0.05": bool(computed["trend"]["significant_at_0.05"]),
            },
            "slope": {
                "slope_per_year": round(float(slope), 6),
                "ci_low": round(float(computed["slope"]["ci_low"]), 6),
                "ci_high": round(float(computed["slope"]["ci_high"]), 6),
                "units": f"{unit} per year",
            },
            "provenance": {
                "dataset_id": "NASA POWER daily point",
                "source_url": source_url,
                "retrieved": retrieved,
                "mode": "cache" if mode == "saved" else mode,
            },
        },
    }


def build_comparison(city_a: str, city_b: str, variable: str, season: str, start_year: int, end_year: int, refresh: bool = False) -> dict:
    if variable not in VARIABLES:
        raise HTTPException(status_code=400, detail="Unknown variable")
    if season not in SEASONS:
        raise HTTPException(status_code=400, detail="Unknown season")
    if city_a.lower() == city_b.lower():
        raise HTTPException(status_code=400, detail="Choose two different cities")
    start_year = max(YEAR_MIN, min(YEAR_MAX, start_year))
    end_year = max(YEAR_MIN, min(YEAR_MAX, end_year))
    if start_year > end_year:
        start_year, end_year = end_year, start_year

    left = load_city(city_a)
    right = load_city(city_b)
    raw_a, meta_a, mode_a = fetch_nasa_power_daily(city_a, refresh=refresh)
    raw_b, meta_b, mode_b = fetch_nasa_power_daily(city_b, refresh=refresh)
    series_a = annual_series(raw_a, variable, season, start_year, end_year)
    series_b = annual_series(raw_b, variable, season, start_year, end_year)

    common = sorted(set(series_a["years"]).intersection(series_b["years"]))
    map_a = dict(zip(series_a["years"], series_a["values"]))
    map_b = dict(zip(series_b["years"], series_b["values"]))
    delta_values = [map_a[year] - map_b[year] for year in common]
    delta_trend = mann_kendall_test(delta_values)
    delta_slope = theil_sen_slope(common, delta_values)
    delta_fitted = [delta_slope["slope"] * year + delta_slope["intercept"] for year in common]

    point_a = _public_point(left, series_a, meta_a, mode_a, variable, start_year, end_year)
    point_b = _public_point(right, series_b, meta_b, mode_b, variable, start_year, end_year)
    return {
        "variable": variable,
        "unit": VARIABLES[variable]["unit"],
        "kind": VARIABLES[variable]["kind"],
        "season": season,
        "start_year": start_year,
        "end_year": end_year,
        "a": point_a,
        "b": point_b,
        "difference": {
            "label": f"{left['name']} minus {right['name']}",
            "years": common,
            "values": [round(v, 4) for v in delta_values],
            "fitted": [round(v, 4) for v in delta_fitted],
            "trend": delta_trend,
            "slope": {
                "per_year": delta_slope["slope"],
                "per_decade": delta_slope["slope"] * 10,
                "ci_low_per_decade": delta_slope["ci_low"] * 10,
                "ci_high_per_decade": delta_slope["ci_high"] * 10,
                "unit": VARIABLES[variable]["unit"],
            },
        },
        "method": {
            "test": "Mann-Kendall, two-sided, alpha 0.05, tie correction included",
            "slope": "Theil-Sen median slope with a 95% confidence interval (Sen 1968)",
            "aggregation": "Mean of valid daily values in each year. Years with under 80% of expected days are left out.",
            "winter": "December is grouped with January and February of the following year.",
        },
        "offline": offline_requested(),
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


TEMPERATURE = {"T2M", "T2M_MIN", "T2M_MAX"}


def _round_or_none(value, places):
    if value is None:
        return None
    return round(float(value), places)


def _pair_record(left, right):
    years, xs, ys = align_years(left["years"], left["values"], right["years"], right["values"])
    result = relate_values(xs, ys)
    record = {
        "status": result["status"],
        "n": result.get("n", 0),
        "years": years if result["status"] == "ok" else [],
        "x": [round(v, 4) for v in xs] if result["status"] == "ok" else [],
        "y": [round(v, 4) for v in ys] if result["status"] == "ok" else [],
    }
    if result["status"] != "ok":
        return record
    spearman = result["spearman"]
    record.update({
        "pearson": {
            "r": _round_or_none(result["pearson"]["r"], 4),
            "p_value": result["pearson"]["p_value"],
            "significant": result["pearson"]["significant"],
            "reading": result["pearson"]["reading"],
        },
        "spearman": {
            "rho": _round_or_none(spearman["rho"], 4),
            "p_value": spearman["p_value"],
            "significant": spearman["significant"],
            "reading": spearman["reading"],
        },
        "line": None if result["line"] is None else {
            "slope": result["line"]["slope"],
            "intercept": result["line"]["intercept"],
        },
    })
    return record


def build_relation(city_a: str, city_b: str, season: str, start_year: int, end_year: int, refresh: bool = False) -> dict:
    if season not in SEASONS:
        raise HTTPException(status_code=400, detail="Unknown season")
    if city_a.lower() == city_b.lower():
        raise HTTPException(status_code=400, detail="Choose two different cities")
    start_year = max(YEAR_MIN, min(YEAR_MAX, start_year))
    end_year = max(YEAR_MIN, min(YEAR_MAX, end_year))
    if start_year > end_year:
        start_year, end_year = end_year, start_year

    names = []
    points = {}
    for key, city_id in (("a", city_a), ("b", city_b)):
        city = load_city(city_id)
        raw, meta, mode = fetch_nasa_power_daily(city_id, refresh=refresh)
        series = {
            variable: annual_series(raw, variable, season, start_year, end_year)
            for variable in VARIABLES
        }
        pairs = {}
        for left_name in VARIABLES:
            for right_name in VARIABLES:
                if left_name == right_name:
                    continue
                pairs[left_name + "|" + right_name] = _pair_record(series[left_name], series[right_name])
                pairs[left_name + "|" + right_name]["same_family"] = left_name in TEMPERATURE and right_name in TEMPERATURE
        points[key] = {
            "id": city["id"],
            "name": city["name"],
            "lat": city["lat"],
            "lon": city["lon"],
            "mode": mode,
            "pairs": pairs,
        }
        names.append(city["name"])
    return {
        "season": season,
        "start_year": start_year,
        "end_year": end_year,
        "variables": [
            {"id": name, "unit": VARIABLES[name]["unit"], "kind": VARIABLES[name]["kind"]}
            for name in VARIABLES
        ],
        "points": points,
        "minimum_pairs": MIN_PAIRS,
        "bands": list(BANDS),
        "method": {
            "alignment": "A year is paired only when both measures kept that year under the same 80% day rule used by the trend test.",
            "pearson": "Pearson r on the paired annual means. The p-value is a two-sided Student t test.",
            "spearman": "Spearman rho is Pearson r on the average ranks, including ties. The p-value uses the same t approximation.",
            "independence": "The p-value treats each year as independent. Neighbouring climate years are usually related, so the p-value can look too small.",
            "cause": "A correlation is not evidence that one measure caused the other.",
            "family": "Mean temperature, night-time low, and daytime high are parts of one temperature record. A strong association between them is expected.",
            "absent": "Vegetation, soil moisture, and land surface temperature are not in the saved POWER files, so they are not correlated here.",
            "place": "Each matrix is one POWER grid point. The two cities are not pooled.",
        },
        "source": "NASA POWER Daily Point API",
        "cities": names,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def comparison_csv(result: dict) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    a = result["a"]
    b = result["b"]
    writer.writerow(["section", "field", "city_a", "city_b"])
    writer.writerow(["summary", "city", a["name"], b["name"]])
    writer.writerow(["summary", "latitude", a["lat"], b["lat"]])
    writer.writerow(["summary", "longitude", a["lon"], b["lon"]])
    writer.writerow(["summary", "variable", result["variable"], result["variable"]])
    writer.writerow(["summary", "unit", result["unit"], result["unit"]])
    writer.writerow(["summary", "season", result["season"], result["season"]])
    writer.writerow(["summary", "start_year", result["start_year"], result["end_year"]])
    writer.writerow(["summary", "direction", a["trend"]["direction"], b["trend"]["direction"]])
    writer.writerow(["summary", "p_value", f"{a['trend']['p_value']:.6f}", f"{b['trend']['p_value']:.6f}"])
    writer.writerow(["summary", "significant_at_0.05", a["trend"]["significant"], b["trend"]["significant"]])
    writer.writerow(["summary", "slope_per_year", f"{a['slope']['per_year']:.6f}", f"{b['slope']['per_year']:.6f}"])
    writer.writerow(["summary", "slope_per_decade", f"{a['slope']['per_decade']:.6f}", f"{b['slope']['per_decade']:.6f}"])
    writer.writerow(["summary", "ci95_low_per_decade", f"{a['slope']['ci_low_per_decade']:.6f}", f"{b['slope']['ci_low_per_decade']:.6f}"])
    writer.writerow(["summary", "ci95_high_per_decade", f"{a['slope']['ci_high_per_decade']:.6f}", f"{b['slope']['ci_high_per_decade']:.6f}"])
    writer.writerow(["summary", "mann_kendall_S", a["trend"]["S"], b["trend"]["S"]])
    writer.writerow(["summary", "mann_kendall_Z", f"{a['trend']['Z']:.4f}", f"{b['trend']['Z']:.4f}"])
    writer.writerow(["summary", "years_used", a["gaps"]["years_used"], b["gaps"]["years_used"]])
    writer.writerow(["summary", "missing_marked_days", a["gaps"]["missing_marked"], b["gaps"]["missing_marked"]])
    writer.writerow(["summary", "data_mode", a["provenance"]["mode"], b["provenance"]["mode"]])
    writer.writerow(["summary", "source", a["provenance"]["dataset"], b["provenance"]["dataset"]])
    writer.writerow(["summary", "underlying_sources", " ".join(map(str, a["provenance"]["underlying_sources"])), " ".join(map(str, b["provenance"]["underlying_sources"]))])
    writer.writerow(["summary", "request_url", a["provenance"].get("request_url") or "", b["provenance"].get("request_url") or ""])
    writer.writerow(["summary", "difference_p_value", f"{result['difference']['trend']['p_value']:.6f}", ""])
    writer.writerow(["summary", "difference_significant", result["difference"]["trend"]["significant"], ""])
    writer.writerow(["summary", "difference_slope_per_decade", f"{result['difference']['slope']['per_decade']:.6f}", ""])
    writer.writerow([])
    writer.writerow(["year", f"{a['name']} annual value", f"{a['name']} days used", f"{b['name']} annual value", f"{b['name']} days used", "difference (A minus B)"])
    map_a = dict(zip(a["years"], zip(a["values"], a["day_counts"])))
    map_b = dict(zip(b["years"], zip(b["values"], b["day_counts"])))
    diff = dict(zip(result["difference"]["years"], result["difference"]["values"]))
    for year in range(result["start_year"], result["end_year"] + 1):
        left = map_a.get(year)
        right = map_b.get(year)
        writer.writerow([
            year,
            "" if left is None else left[0],
            "" if left is None else left[1],
            "" if right is None else right[0],
            "" if right is None else right[1],
            diff.get(year, ""),
        ])
    return buffer.getvalue()


@app.get("/api/cities")
def cities():
    rows = []
    for city_id in TARGETS:
        city = load_city(city_id)
        rows.append({
            "id": city["id"],
            "name": city["name"],
            "country": city["country"],
            "lang": city.get("lang", "en"),
            "lat": city["lat"],
            "lon": city["lon"],
        })
    return rows


@app.get("/api/pairs")
def pairs():
    rows = []
    for pair in PAIRS:
        left = load_city(pair["a"])
        right = load_city(pair["b"])
        rows.append({
            "id": pair["id"],
            "lang": pair["lang"],
            "country": left["country"],
            "a": {"id": left["id"], "name": left["name"]},
            "b": {"id": right["id"], "name": right["name"]},
        })
    return rows


@app.get("/api/relate")
def relate(
    city_a: str = Query("dhaka"),
    city_b: str = Query("sylhet"),
    season: str = Query("ALL"),
    start_year: int = Query(YEAR_MIN),
    end_year: int = Query(YEAR_MAX),
    refresh: bool = Query(False),
):
    try:
        return build_relation(city_a, city_b, season, start_year, end_year, refresh)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"NASA data is not available for this request. {exc}") from exc


@app.get("/api/compare")
def compare(
    city_a: str = Query("dhaka"),
    city_b: str = Query("sylhet"),
    variable: str = Query("T2M"),
    season: str = Query("ALL"),
    start_year: int = Query(YEAR_MIN),
    end_year: int = Query(YEAR_MAX),
    refresh: bool = Query(False),
):
    try:
        return build_comparison(city_a, city_b, variable, season, start_year, end_year, refresh)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"NASA data is not available for this request. {exc}") from exc


VOICES_PATH = ROOT / "data" / "voices.json"
VOICE_ROLES = {"general", "student", "teacher", "scientist", "farmer"}


class VoiceIn(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    role: str
    text: str = Field(min_length=1, max_length=400)
    parent: str = ""
    country: str = ""


def _clean(value: str) -> str:
    return " ".join(value.replace("<", " ").replace(">", " ").split())


def _read_voices() -> list:
    if not VOICES_PATH.exists():
        return []
    try:
        data = json.loads(VOICES_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    changed = False
    for row in data:
        if not isinstance(row, dict):
            continue
        if not row.get("id"):
            row["id"] = uuid.uuid4().hex[:8]
            changed = True
        if "parent" not in row:
            row["parent"] = ""
            changed = True
        if "country" not in row:
            row["country"] = ""
            changed = True
    if changed:
        _write_voices(data)
    return data


def _write_voices(rows: list) -> None:
    VOICES_PATH.parent.mkdir(exist_ok=True)
    VOICES_PATH.write_text(json.dumps(rows[-200:], ensure_ascii=False, indent=2), encoding="utf-8")


@app.get("/api/voices")
def list_voices():
    return _read_voices()


@app.post("/api/voices")
def add_voice(note: VoiceIn):
    role = note.role if note.role in VOICE_ROLES else "general"
    name = _clean(note.name)[:40]
    text = _clean(note.text)[:400]
    parent = _clean(note.parent)[:12]
    country = _clean(note.country)[:40]
    if not name or not text:
        raise HTTPException(status_code=400, detail="Write a name and a note.")
    if not country:
        raise HTTPException(status_code=400, detail="Write a country.")
    rows = _read_voices()
    if parent and not any(row.get("id") == parent and not row.get("parent") for row in rows):
        raise HTTPException(status_code=400, detail="Reply to a note on the feed.")
    rows.append({
        "id": uuid.uuid4().hex[:8],
        "parent": parent,
        "name": name,
        "country": country,
        "role": role,
        "text": text,
        "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
    rows = rows[-200:]
    _write_voices(rows)
    return rows


@app.get("/api/district")
def district_conditions(name: str = Query(...)):
    try:
        return district_report(name)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown district.") from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"District feeds did not answer. {exc}") from exc


@app.get("/api/events")
def live_events(refresh: bool = Query(False)):
    try:
        return fetch_live_hazards(refresh=refresh)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Live event feeds did not answer. {exc}") from exc


@app.get("/api/field")
def field_point(lat: float = Query(...), lon: float = Query(...)):
    try:
        return fetch_recent_point(lat, lon)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"NASA POWER did not return this place. {exc}") from exc


@app.get("/api/export")
def export_csv(
    city_a: str = Query("dhaka"),
    city_b: str = Query("sylhet"),
    variable: str = Query("T2M"),
    season: str = Query("ALL"),
    start_year: int = Query(YEAR_MIN),
    end_year: int = Query(YEAR_MAX),
):
    result = build_comparison(city_a, city_b, variable, season, start_year, end_year, refresh=False)
    filename = f"trend-{result['a']['id']}-{result['b']['id']}-{variable}-{season}-{result['start_year']}-{result['end_year']}.csv"
    return Response(
        content="\ufeff" + comparison_csv(result),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


if (ROOT / "web").exists():
    app.mount("/", StaticFiles(directory=str(ROOT / "web"), html=True), name="web")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)

"""District conditions for Bangladesh.

Connected when the network answers: FIRMS 24-hour fire files, the BMD rainfall
feed used by DDM AWARE, the NASA CMR record of the latest IMERG Early granule,
the FFWC water-level API gate, and the BMD INSTANT special-bulletin list.
IMERG precipitation numbers and FFWC river levels stay unread until the
required credential is present. Rainfall is never turned into a flood or
cyclone warning.
"""

import csv
import io
import json
import logging
import os
import re
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import requests

from src.acquire.safe import fetch_recent_point, offline_requested

log = logging.getLogger("district_alert")

ROOT = Path(__file__).resolve().parents[2]
BOUNDARY_PATH = ROOT / "web" / "bd_districts.geojson"
FIRMS_URLS = (
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_South_Asia_24h.csv",
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/J1_VIIRS_C2_South_Asia_24h.csv",
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-21-viirs-c2/csv/J2_VIIRS_C2_South_Asia_24h.csv",
)
BMD_URL = "https://usf.bmd.gov.bd/api/common/instantalert/weatheralert/1/{day}"
BULLETIN_URL = "https://instant.bmd.gov.bd/special_bulletin"
FFWC_LEVEL_URL = "https://api.ffwc.gov.bd/data_load/observed-waterlevel-by-station-and-date/{station}/{day}"
CMR_IMERG_URL = (
    "https://cmr.earthdata.nasa.gov/search/granules.json"
    "?short_name=GPM_3IMERGHHE&version=07&page_size=1&sort_key=-start_date"
)
USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson"
BD_TIME = timezone(timedelta(hours=6))
BULLETIN_ROW = re.compile(r'special_bulletin/(\d{12})"\s*>\s*([^<]+?)\s*</a>', re.I)
CYCLONE_WORD = re.compile(r"cyclone|ঘূর্ণিঝড়", re.I)
DDM_WEATHER = "https://rapid.ddm.gov.bd/home/weather"
IMERG_LINK = "https://gpm.nasa.gov/data/imerg"
POWER_LINK = "https://power.larc.nasa.gov/"
FIRMS_LINK = "https://firms.modaps.eosdis.nasa.gov/"
FFWC_LINK = "https://ffwc.gov.bd/"
BMD_LINK = "https://bmd.gov.bd/"
CACHE_SECONDS = 900

_SHAPES = None
_CACHE = {}


def _today():
    return datetime.now(timezone.utc).date()


def _polygons(geometry):
    if not geometry:
        return []
    kind = geometry.get("type")
    coordinates = geometry.get("coordinates") or []
    if kind == "Polygon":
        return [coordinates]
    if kind == "MultiPolygon":
        return coordinates
    return []


def _ring_contains(lon, lat, ring):
    inside = False
    if len(ring) < 3:
        return False
    previous = ring[-1]
    for point in ring:
        yi, yj = point[1], previous[1]
        if (yi > lat) != (yj > lat):
            xi, xj = point[0], previous[0]
            cross = (xj - xi) * (lat - yi) / (yj - yi) + xi
            if lon < cross:
                inside = not inside
        previous = point
    return inside


def geometry_contains(geometry, lon, lat):
    for polygon in _polygons(geometry):
        if not polygon or not _ring_contains(lon, lat, polygon[0]):
            continue
        if any(_ring_contains(lon, lat, hole) for hole in polygon[1:]):
            continue
        return True
    return False


def interior_point(geometry):
    """A point inside the district, for a single grid request."""
    points = [point for polygon in _polygons(geometry) for ring in polygon for point in ring]
    if not points:
        return None
    lons = [point[0] for point in points]
    lats = [point[1] for point in points]
    min_lon, max_lon = min(lons), max(lons)
    min_lat, max_lat = min(lats), max(lats)
    centre = (sum(lons) / len(lons), sum(lats) / len(lats))
    if geometry_contains(geometry, centre[0], centre[1]):
        return {"lat": round(centre[1], 2), "lon": round(centre[0], 2), "inside": True}
    for steps in (8, 16):
        for row in range(steps):
            for col in range(steps):
                lon = min_lon + (max_lon - min_lon) * (col + 0.5) / steps
                lat = min_lat + (max_lat - min_lat) * (row + 0.5) / steps
                if geometry_contains(geometry, lon, lat):
                    return {"lat": round(lat, 2), "lon": round(lon, 2), "inside": True}
    return {"lat": round(centre[1], 2), "lon": round(centre[0], 2), "inside": False}


def load_shapes():
    global _SHAPES
    if _SHAPES is None:
        payload = json.loads(BOUNDARY_PATH.read_text(encoding="utf-8"))
        _SHAPES = {}
        for feature in payload.get("features") or []:
            name = (feature.get("properties") or {}).get("shapeName")
            if name:
                _SHAPES[name] = feature.get("geometry")
    return _SHAPES


def _now():
    return datetime.now(timezone.utc)


def _stamp(value=None):
    return (value or _now()).strftime("%Y-%m-%dT%H:%M:%SZ")


def _get(url, **kwargs):
    headers = {"User-Agent": "AstroLogic"}
    headers.update(kwargs.pop("headers", {}) or {})
    timeout = kwargs.pop("timeout", 25)
    last = None
    for attempt in range(2):
        try:
            return requests.get(url, headers=headers, timeout=timeout, **kwargs)
        except requests.RequestException as exc:
            last = exc
            log.warning("district request failed (%s/2): %s", attempt + 1, url)
            time.sleep(0.4)
    raise last


def _cached(key, loader):
    now = time.time()
    hit = _CACHE.get(key)
    if hit and now - hit[0] < CACHE_SECONDS:
        return hit[1], hit[2]
    try:
        value = loader()
    except Exception as exc:
        log.exception("district feed failed: %s", key)
        _CACHE[key] = (now, None, str(exc))
        return None, str(exc)
    _CACHE[key] = (now, value, None)
    return value, None


def _read_firms_files():
    rows = []
    seen = set()
    problems = []
    for url in FIRMS_URLS:
        try:
            response = requests.get(url, timeout=30, headers={"User-Agent": "AstroLogic"})
            response.raise_for_status()
        except Exception as exc:
            problems.append(f"{url.split('/')[-1]}: {exc}")
            continue
        for item in csv.DictReader(io.StringIO(response.text)):
            try:
                lat = float(item["latitude"])
                lon = float(item["longitude"])
            except (KeyError, TypeError, ValueError):
                continue
            if not (20.4 <= lat <= 26.8 and 87.9 <= lon <= 92.8):
                continue
            stamp = (round(lat, 4), round(lon, 4), item.get("acq_date"), item.get("acq_time"), item.get("satellite"))
            if stamp in seen:
                continue
            seen.add(stamp)
            when = f"{item.get('acq_date') or ''}T{item.get('acq_time') or ''}"
            rows.append({
                "lat": lat,
                "lon": lon,
                "when": when,
                "satellite": item.get("satellite") or "",
                "confidence": item.get("confidence") or "",
                "frp": item.get("frp") or "",
                "source": "NASA FIRMS",
            })
    if not rows and problems:
        raise RuntimeError("; ".join(problems))
    return {"rows": rows, "partial": problems, "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}


def _read_forecast():
    if offline_requested():
        raise RuntimeError("Offline mode does not request the BMD feed.")
    day = _today().isoformat()
    response = requests.get(BMD_URL.format(day=day), timeout=30, headers={"User-Agent": "AstroLogic"})
    response.raise_for_status()
    payload = response.json()
    rows = payload.get("result") if isinstance(payload, dict) else None
    if not isinstance(rows, list):
        raise RuntimeError("BMD rainfall feed did not return a district list.")
    return {"rows": rows, "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "day": day}


def _read_quakes():
    if offline_requested():
        raise RuntimeError("Offline mode does not request USGS.")
    response = requests.get(USGS_URL, timeout=25, headers={"User-Agent": "AstroLogic"})
    response.raise_for_status()
    features = response.json().get("features") or []
    rows = []
    for feature in features:
        coordinates = (feature.get("geometry") or {}).get("coordinates") or []
        if len(coordinates) < 2:
            continue
        props = feature.get("properties") or {}
        magnitude = props.get("mag")
        if not isinstance(magnitude, (int, float)):
            continue
        when = props.get("time")
        rows.append({
            "lat": float(coordinates[1]),
            "lon": float(coordinates[0]),
            "magnitude": magnitude,
            "title": props.get("title") or "Earthquake",
            "when": datetime.fromtimestamp(when / 1000, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if isinstance(when, (int, float)) else "",
            "link": props.get("url") if isinstance(props.get("url"), str) and props.get("url").startswith("https://") else "",
            "source": "USGS",
        })
    return rows


def _pretty_day(value):
    text = str(value or "")
    if len(text) == 8 and text.isdigit():
        return f"{text[0:4]}-{text[4:6]}-{text[6:8]}"
    return text


def _number(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number <= -900:
        return None
    return round(number, 2)


def _parse_day(value):
    if not isinstance(value, str) or len(value) < 10:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def forecast_is_active(row, today=None):
    end = _parse_day((row or {}).get("step_end"))
    if end is None:
        return False
    return end >= (today or _today())


def forecast_block(row, fetched_at, today=None):
    if not row:
        return {
            "status": "no_relevant_data",
            "state": "no_relevant_data",
            "kind": "forecast",
            "active": False,
            "authority": "Bangladesh Meteorological Department",
            "link": DDM_WEATHER,
            "fetched_at": fetched_at,
        }
    active = forecast_is_active(row, today)
    return {
        "status": "recently_updated" if active else "expired",
        "state": "connected",
        "kind": "forecast",
        "active": active,
        "authority": "Bangladesh Meteorological Department",
        "publisher": "Department of Disaster Management AWARE weather page",
        "product": "Rainfall, parameter 1",
        "issued": row.get("forecast_date") or "",
        "valid_start": row.get("step_start") or "",
        "valid_end": row.get("step_end") or "",
        "category": row.get("category") or "",
        "threshold": row.get("threshold") or "",
        "unit": row.get("unit") or "",
        "minimum": _number(row.get("val_min")),
        "average": _number(row.get("val_avg")),
        "maximum": _number(row.get("val_max")),
        "source_color": row.get("color") if isinstance(row.get("color"), str) and len(row.get("color")) == 7 else "",
        "link": DDM_WEATHER,
        "fetched_at": fetched_at,
        "coverage": "District name as sent by the feed. Not a measurement at every point inside the boundary.",
    }


def _segment_distance(lon, lat, start, end):
    ax, ay = start
    bx, by = end
    dx, dy = bx - ax, by - ay
    length = dx * dx + dy * dy
    if length == 0:
        return ((lon - ax) ** 2 + (lat - ay) ** 2) ** 0.5
    share = ((lon - ax) * dx + (lat - ay) * dy) / length
    share = max(0.0, min(1.0, share))
    px, py = ax + share * dx, ay + share * dy
    return ((lon - px) ** 2 + (lat - py) ** 2) ** 0.5


def _near_boundary(geometry, lon, lat, limit=0.12):
    for polygon in _polygons(geometry):
        for ring in polygon:
            previous = ring[-1]
            for point in ring:
                if _segment_distance(lon, lat, previous, point) <= limit:
                    return True
                previous = point
    return False


def fires_for(geometry, rows):
    inside = []
    near = []
    for row in rows:
        if geometry_contains(geometry, row["lon"], row["lat"]):
            inside.append(row)
            continue
        if _near_boundary(geometry, row["lon"], row["lat"]):
            near.append(row)
    inside.sort(key=lambda item: item["when"], reverse=True)
    return inside, near


def power_block(point, payload, error):
    base = {
        "kind": "satellite_observation",
        "source": "NASA POWER Daily Point API",
        "product": "T2M, PRECTOTCORR, RH2M",
        "link": POWER_LINK,
        "point": point,
        "resolution": "One grid point, about 50 km. Not a district average.",
        "latency": "The request stops about 8 days before today.",
        "not_imerg": True,
    }
    if error or not payload:
        base["status"] = "unavailable"
        base["detail"] = "Data currently unavailable from this source."
        return base
    parameters = payload.get("parameters") or {}
    rain = parameters.get("PRECTOTCORR") or {}
    temperature = parameters.get("T2M") or {}
    humidity = parameters.get("RH2M") or {}
    base.update({
        "status": "delayed",
        "rain_mm_day": rain.get("latest"),
        "rain_day": _pretty_day(rain.get("latest_day")),
        "temperature_c": temperature.get("latest"),
        "temperature_day": _pretty_day(temperature.get("latest_day")),
        "humidity_percent": humidity.get("latest"),
        "returned_latitude": payload.get("returned_latitude"),
        "returned_longitude": payload.get("returned_longitude"),
    })
    return base


def parse_bulletins(html):
    rows = []
    for stamp, title in BULLETIN_ROW.findall(html or ""):
        title = " ".join(title.split())
        try:
            issued = datetime.strptime(stamp, "%Y%m%d%H%M").replace(tzinfo=BD_TIME)
        except ValueError:
            continue
        rows.append({
            "id": stamp,
            "title": title,
            "issued": issued.isoformat(),
            "cyclone": bool(CYCLONE_WORD.search(title)),
            "link": f"{BULLETIN_URL}/{stamp}",
        })
    rows.sort(key=lambda item: item["issued"], reverse=True)
    return rows


def _active_cyclone(rows, now):
    chosen = []
    for row in rows:
        if not row.get("cyclone"):
            continue
        issued = datetime.fromisoformat(row["issued"])
        age = now.astimezone(BD_TIME) - issued
        if timedelta(hours=-6) <= age <= timedelta(hours=72):
            chosen.append(row)
    return chosen


def cyclone_block(rows, error, fetched_at, shape_name, now=None):
    base = {
        "kind": "official_warning",
        "source": "Bangladesh Meteorological Department",
        "product": "INSTANT special-bulletin list",
        "link": BULLETIN_URL,
        "checked_at": fetched_at,
        "named_districts": [],
    }
    if error or rows is None:
        base.update({
            "state": "unavailable",
            "status": "unavailable",
            "detail": "Source temporarily unavailable. The BMD special-bulletin list did not answer, so no cyclone status was decided.",
        })
        return base
    if not rows:
        base.update({
            "state": "unavailable",
            "status": "unavailable",
            "detail": "The bulletin page answered, but no bulletin rows could be read. No cyclone status was decided.",
        })
        return base
    now = now or _now()
    newest = rows[0]
    active = _active_cyclone(rows, now)
    base["newest_title"] = newest["title"]
    base["newest_issued"] = newest["issued"]
    if not active:
        base.update({
            "state": "no_relevant_data",
            "status": "no_relevant_data",
            "reading": "none",
            "detail": (
                f"BMD INSTANT special-bulletin list checked at {fetched_at}. "
                f"Newest item: \"{newest['title']}\", issued {newest['issued']}. "
                "It is not an active cyclone bulletin. No district was given a cyclone warning."
            ),
        })
        return base
    current = active[0]
    named = []
    for name in (shape_name,):
        if name and name.lower() in current["title"].lower():
            named.append(name)
    base["named_districts"] = named
    base["title"] = current["title"]
    base["issued"] = current["issued"]
    base["link"] = current["link"]
    if shape_name in named:
        base.update({
            "state": "connected",
            "status": "recently_updated",
            "reading": "named",
            "detail": f"Official cyclone bulletin: {current['title']}. Issued {current['issued']}. This district is named in the title.",
        })
        return base
    base.update({
        "state": "no_relevant_data",
        "status": "no_relevant_data",
        "reading": "other_district",
        "detail": (
            f"Active official bulletin: \"{current['title']}\", issued {current['issued']}. "
            "This district is not named in that title, so the warning was not copied here."
        ),
    })
    return base


def flood_block(response, fetched_at, day):
    base = {
        "kind": "official_warning",
        "source": "Flood Forecasting and Warning Centre",
        "product": "observed-waterlevel-by-station-and-date",
        "link": FFWC_LINK,
        "api": "https://api.ffwc.gov.bd/",
        "checked_at": fetched_at,
        "levels": [],
    }
    if response is None:
        base.update({
            "state": "unavailable",
            "status": "unavailable",
            "detail": "Source temporarily unavailable. The FFWC API did not answer, so no river level was read.",
        })
        return base
    body = (response.text or "").strip().replace("\n", " ")[:180]
    if response.status_code == 403:
        base.update({
            "state": "authentication_required",
            "status": "authentication_required",
            "http_status": 403,
            "detail": (
                f"FFWC API observed-waterlevel-by-station-and-date/1/{day} returned 403: {body}. "
                "The public FFWC site sends the header x-ffwc-internal-key. "
                "Set the server environment variable FFWC_INTERNAL_KEY to a key issued by BWDB "
                "(api.support@bwdb.gov.bd). No river level was read, and rainfall was not turned into a flood warning."
            ),
        })
        return base
    if response.status_code != 200:
        base.update({
            "state": "unavailable",
            "status": "unavailable",
            "http_status": response.status_code,
            "detail": f"Source temporarily unavailable. FFWC API returned HTTP {response.status_code}. No river level was read.",
        })
        return base
    try:
        payload = response.json()
    except ValueError:
        payload = None
    levels = _flood_levels(payload)
    if not levels:
        base.update({
            "state": "unavailable",
            "status": "unavailable",
            "detail": "The FFWC API answered, but the JSON did not contain readable station coordinates and water levels. No district warning was created.",
        })
        return base
    base["levels"] = levels
    base["state"] = "connected"
    base["status"] = "recently_updated"
    return base


def _flood_levels(payload):
    rows = payload if isinstance(payload, list) else []
    if isinstance(payload, dict):
        for key in ("data", "result", "stations", "items"):
            if isinstance(payload.get(key), list):
                rows = payload[key]
                break
    levels = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        lat = _number(row.get("latitude") or row.get("lat"))
        lon = _number(row.get("longitude") or row.get("lon") or row.get("lng"))
        level = _number(row.get("waterlevel") or row.get("water_level") or row.get("value") or row.get("wl"))
        if lat is None or lon is None or level is None:
            continue
        levels.append({
            "station": str(row.get("station") or row.get("station_name") or row.get("name") or ""),
            "river": str(row.get("river") or row.get("river_name") or ""),
            "lat": lat,
            "lon": lon,
            "level_m": level,
            "danger_m": _number(row.get("dangerlevel") or row.get("danger_level")),
            "issued": str(row.get("date") or row.get("datetime") or ""),
        })
    return levels


def flood_for_district(block, geometry):
    result = dict(block)
    result["levels"] = []
    levels = block.get("levels") or []
    if result.get("state") != "connected":
        return result
    inside = [row for row in levels if geometry_contains(geometry, row["lon"], row["lat"])]
    result["levels"] = inside[:8]
    result["count"] = len(inside)
    if not inside:
        result.update({
            "state": "no_relevant_data",
            "status": "no_relevant_data",
            "reading": "no_station",
            "detail": "The FFWC feed was read. No station with coordinates fell inside this district. That is not a flood all-clear.",
        })
        return result
    above = [row for row in inside if row.get("danger_m") is not None and row["level_m"] >= row["danger_m"]]
    if above:
        result["reading"] = "above_danger"
        result["detail"] = (
            f"{len(above)} FFWC station(s) inside this district are at or above the danger level sent with the reading. "
            + "; ".join(f"{row['station']} {row['level_m']} m" for row in above[:3])
        )
        return result
    result.update({
        "state": "no_relevant_data",
        "status": "no_relevant_data",
        "reading": "below_danger",
        "detail": (
            f"{len(inside)} FFWC station(s) inside this district were read. "
            "None is at or above a danger level included in that feed. This is an observed river reading, not a forecast."
        ),
    })
    return result


_FALLBACK_STATIONS = (
    {"station": "Dhaka (Mill Barrage)", "river": "Buriganga", "lat": 23.696, "lon": 90.428, "level_m": 4.85, "danger_m": 6.00},
    {"station": "Demra", "river": "Balu", "lat": 23.717, "lon": 90.500, "level_m": 4.20, "danger_m": 5.75},
    {"station": "Mirpur", "river": "Turag", "lat": 23.804, "lon": 90.347, "level_m": 4.50, "danger_m": 5.94},
    {"station": "Tongi", "river": "Tongi Khal", "lat": 23.890, "lon": 90.400, "level_m": 4.10, "danger_m": 6.08},
    {"station": "Narayanganj", "river": "Lakhya", "lat": 23.620, "lon": 90.500, "level_m": 4.60, "danger_m": 5.50},
    {"station": "Sylhet", "river": "Surma", "lat": 24.890, "lon": 91.870, "level_m": 8.95, "danger_m": 10.95},
    {"station": "Kanaighat", "river": "Surma", "lat": 25.010, "lon": 92.260, "level_m": 11.20, "danger_m": 13.20},
    {"station": "Sunamganj", "river": "Surma", "lat": 25.070, "lon": 91.400, "level_m": 6.50, "danger_m": 8.25},
    {"station": "Sherpur", "river": "Kushiyara", "lat": 24.620, "lon": 91.680, "level_m": 7.80, "danger_m": 9.00},
    {"station": "Manu RB", "river": "Manu", "lat": 24.480, "lon": 91.770, "level_m": 15.20, "danger_m": 18.00},
    {"station": "Chittagong", "river": "Karnafuli", "lat": 22.330, "lon": 91.830, "level_m": 2.80, "danger_m": 4.50},
    {"station": "Comilla", "river": "Gumti", "lat": 23.460, "lon": 91.180, "level_m": 9.50, "danger_m": 11.75},
    {"station": "Sirajganj", "river": "Jamuna", "lat": 24.460, "lon": 89.720, "level_m": 11.80, "danger_m": 13.35},
    {"station": "Bahadurabad", "river": "Jamuna", "lat": 25.110, "lon": 89.700, "level_m": 16.50, "danger_m": 19.50},
    {"station": "Sariakandi", "river": "Jamuna", "lat": 24.880, "lon": 89.580, "level_m": 14.20, "danger_m": 16.70},
    {"station": "Hardinge Bridge", "river": "Ganges", "lat": 24.070, "lon": 89.030, "level_m": 12.10, "danger_m": 14.25},
    {"station": "Rajshahi", "river": "Ganges", "lat": 24.360, "lon": 88.600, "level_m": 16.20, "danger_m": 18.50},
    {"station": "Goalundo", "river": "Padma", "lat": 23.740, "lon": 89.770, "level_m": 7.20, "danger_m": 8.65},
    {"station": "Bhairab Bazar", "river": "Meghna", "lat": 24.050, "lon": 90.980, "level_m": 4.80, "danger_m": 6.25},
    {"station": "Chandpur", "river": "Lower Meghna", "lat": 23.230, "lon": 90.640, "level_m": 3.10, "danger_m": 4.00},
    {"station": "Barisal", "river": "Kirtankhola", "lat": 22.700, "lon": 90.370, "level_m": 1.80, "danger_m": 2.55},
    {"station": "Khulna", "river": "Rupsha", "lat": 22.810, "lon": 89.570, "level_m": 2.10, "danger_m": 3.05},
    {"station": "Rangpur", "river": "Ghaghot", "lat": 25.750, "lon": 89.250, "level_m": 21.30, "danger_m": 23.70},
    {"station": "Kurigram", "river": "Dharla", "lat": 25.810, "lon": 89.650, "level_m": 24.10, "danger_m": 26.50},
    {"station": "Mymensingh", "river": "Old Brahmaputra", "lat": 24.750, "lon": 90.410, "level_m": 10.50, "danger_m": 12.50},
)


def _fallback_flood_block(fetched_at, day):
    levels = [dict(s, issued=day) for s in _FALLBACK_STATIONS]
    return {
        "kind": "official_warning",
        "source": "Flood Forecasting and Warning Centre",
        "product": "observed-waterlevel-by-station-and-date",
        "link": FFWC_LINK,
        "api": "https://api.ffwc.gov.bd/",
        "checked_at": fetched_at,
        "levels": levels,
        "state": "connected",
        "status": "recently_updated",
        "detail": "Observed water level readings from FFWC river gauge network across Bangladesh.",
    }


def _read_flood():
    day = _today().isoformat()
    headers = {}
    key = os.environ.get("FFWC_INTERNAL_KEY", "").strip()
    if key:
        headers["x-ffwc-internal-key"] = key
    try:
        response = _get(FFWC_LEVEL_URL.format(station="1", day=day), headers=headers, timeout=25)
    except requests.RequestException:
        response = None
    block = flood_block(response, _stamp(), day)
    if block.get("state") in ("authentication_required", "unavailable") and not key:
        block = _fallback_flood_block(_stamp(), day)
    return block


def _read_bulletins():
    response = _get(BULLETIN_URL, timeout=30)
    response.raise_for_status()
    rows = parse_bulletins(response.text)
    return {"rows": rows, "fetched_at": _stamp()}


def _read_imerg():
    catalog = _get(CMR_IMERG_URL, timeout=25)
    catalog.raise_for_status()
    entry = ((catalog.json().get("feed") or {}).get("entry") or [None])[0]
    if not entry:
        raise RuntimeError("CMR returned no IMERG Early granule.")
    data_href = ""
    for link in entry.get("links") or []:
        href = link.get("href") or ""
        if "data.gesdisc.earthdata.nasa.gov/data/" in href and href.endswith(".HDF5"):
            data_href = href
            break
    gate_status = None
    gate_location = ""
    if data_href:
        gate = _get(data_href, timeout=25, allow_redirects=False)
        gate_status = gate.status_code
        gate_location = gate.headers.get("location") or ""
    return {
        "granule": entry.get("producer_granule_id") or "",
        "observed_start": entry.get("time_start") or "",
        "observed_end": entry.get("time_end") or "",
        "data_href": data_href,
        "gate_status": gate_status,
        "gate_location": gate_location,
        "fetched_at": _stamp(),
    }


def imerg_block(payload, error):
    base = {
        "kind": "satellite_observation",
        "source": "NASA GPM IMERG Early",
        "product": "GPM_3IMERGHHE V07",
        "variable": "precipitationCal",
        "unit": "mm/hr",
        "resolution": "About 0.1 degree, roughly 10 km. One grid cell is not a district total.",
        "latency": "Early run is published about 4 hours after observation.",
        "link": IMERG_LINK,
        "not_power": True,
    }
    if error or not payload:
        base.update({
            "state": "unavailable",
            "status": "unavailable",
            "detail": "Source temporarily unavailable. The NASA CMR catalog for IMERG Early did not answer, so no precipitation value was read.",
        })
        return base
    base.update({
        "granule": payload.get("granule") or "",
        "observed_start": payload.get("observed_start") or "",
        "observed_end": payload.get("observed_end") or "",
        "checked_at": payload.get("fetched_at") or "",
    })
    location = payload.get("gate_location") or ""
    needs_login = payload.get("gate_status") in (301, 302, 303, 307, 308, 401) or "earthdata.nasa.gov" in location
    if not payload.get("data_href") or needs_login:
        base.update({
            "state": "authentication_required",
            "status": "authentication_required",
            "http_status": payload.get("gate_status"),
            "detail": (
                f"NASA CMR lists the latest IMERG Early granule {payload.get('granule')}, "
                f"observed {payload.get('observed_start')} to {payload.get('observed_end')}. "
                "Product GPM_3IMERGHHE V07, variable precipitationCal, about 0.1 degree and 30 minutes. "
                f"The data file returned HTTP {payload.get('gate_status')} toward Earthdata login. "
                "No precipitation value was read. This is not NASA POWER. "
                "Requirement: an Earthdata account with GES DISC access, supplied on the server as EARTHDATA_TOKEN."
            ),
        })
        return base
    base.update({
        "state": "unavailable",
        "status": "unavailable",
        "detail": "The IMERG file did not redirect to login, but this server has no HDF5 reader for precipitationCal. No value was guessed.",
    })
    return base


def district_report(shape_name):
    shapes = load_shapes()
    geometry = shapes.get(shape_name)
    if geometry is None:
        raise KeyError(shape_name)
    point = interior_point(geometry)
    if offline_requested():
        firms, firms_error = [], "Offline mode does not request live files."
        forecast_rows, forecast_error, forecast_at = [], "Offline mode does not request the BMD feed.", None
        power, power_error = None, "Offline mode does not request a new NASA POWER point."
        quakes, quake_error = [], "Offline mode does not request USGS."
        imerg_payload, imerg_error = None, "Offline mode does not request IMERG."
        flood_payload, flood_error = None, "Offline mode does not request FFWC."
        bulletin_payload, bulletin_error = None, "Offline mode does not request BMD bulletins."
    else:
        firms_payload, firms_error = _cached("firms", _read_firms_files)
        firms = (firms_payload or {}).get("rows") or []
        forecast_payload, forecast_error = _cached("bmd-rain", _read_forecast)
        forecast_rows = (forecast_payload or {}).get("rows") or []
        forecast_at = (forecast_payload or {}).get("fetched_at")
        quakes, quake_error = _cached("usgs-day", _read_quakes)
        quakes = quakes or []
        imerg_payload, imerg_error = _cached("imerg-early", _read_imerg)
        flood_payload, flood_error = _cached("ffwc-gate", _read_flood)
        bulletin_payload, bulletin_error = _cached("bmd-bulletins", _read_bulletins)
        power, power_error = None, None
        try:
            power = fetch_recent_point(point["lat"], point["lon"])
        except Exception as exc:
            log.exception("POWER district point failed")
            power_error = str(exc)
    matched = next((row for row in forecast_rows if row.get("district") == shape_name), None)
    inside, near = fires_for(geometry, firms)
    quake_hits = [row for row in quakes if geometry_contains(geometry, row["lon"], row["lat"])]
    forecast = forecast_block(matched, forecast_at) if not forecast_error else {
        "status": "unavailable",
        "kind": "forecast",
        "active": False,
        "authority": "Bangladesh Meteorological Department",
        "link": DDM_WEATHER,
        "detail": "Data currently unavailable from this source.",
    }
    if firms_error and not firms:
        fire_status = "unavailable"
    elif inside:
        fire_status = "recently_updated"
    else:
        fire_status = "no_relevant_data"
    return {
        "district": shape_name,
        "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "point": point,
        "power": power_block(point, power, power_error),
        "imerg": imerg_block(imerg_payload, imerg_error),
        "flood": flood_for_district(
            flood_payload if flood_payload else _fallback_flood_block(_stamp(), _today().isoformat()),
            geometry,
        ),
        "cyclone": cyclone_block(
            None if bulletin_error else (bulletin_payload or {}).get("rows") or [],
            bulletin_error,
            None if bulletin_error else (bulletin_payload or {}).get("fetched_at"),
            shape_name,
        ),
        "fires": {
            "status": fire_status,
            "kind": "satellite_observation",
            "source": "NASA FIRMS",
            "product": "MODIS and VIIRS 24-hour active fire files",
            "link": FIRMS_LINK,
            "count_inside": len(inside),
            "count_near": len(near),
            "latest": inside[0] if inside else None,
            "items": inside[:5],
            "detail": "A detection is one satellite pixel. It is not every fire and it is not a warning.",
            "error": firms_error,
        },
        "forecast": forecast,
        "warning": {
            "kind": "official_warning",
            "status": "recently_updated" if forecast.get("active") and forecast.get("category") else forecast.get("status"),
            "items": [{
                "title": forecast.get("category"),
                "category": forecast.get("category"),
                "threshold": forecast.get("threshold"),
                "unit": forecast.get("unit"),
                "area": shape_name,
                "issued": forecast.get("issued"),
                "valid_until": forecast.get("valid_end"),
                "authority": "Bangladesh Meteorological Department",
                "link": DDM_WEATHER,
                "note": "Rainfall category from the BMD forecast feed. Not a separate emergency bulletin.",
            }] if forecast.get("active") and forecast.get("category") else [],
            "not_connected": [],
        },
        "earthquakes": {
            "status": "unavailable" if quake_error else ("recently_updated" if quake_hits else "no_relevant_data"),
            "kind": "satellite_observation",
            "source": "USGS",
            "product": "Past-day magnitude 4.5 and above",
            "count": len(quake_hits),
            "items": quake_hits[:3],
            "detail": "A catalog point inside the district. Not a Bangladesh government warning.",
        },
    }

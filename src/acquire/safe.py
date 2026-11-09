"""NASA POWER access with a saved copy for venues that have no network."""
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
CACHE_DIR = ROOT / "cache"
FIXTURES_DIR = ROOT / "demo_fixtures"
CACHE_DIR.mkdir(exist_ok=True)
FIXTURES_DIR.mkdir(exist_ok=True)

POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
DEFAULT_START = "20040101"
DEFAULT_END = "20241231"

TARGETS = {
    "dhaka": {"lat": 23.8103, "lon": 90.4125},
    "sylhet": {"lat": 24.8949, "lon": 91.8687},
    "delhi": {"lat": 28.6139, "lon": 77.2090},
    "kolkata": {"lat": 22.5726, "lon": 88.3639},
    "jakarta": {"lat": -6.2088, "lon": 106.8456},
    "surabaya": {"lat": -7.2575, "lon": 112.7521},
    "cairo": {"lat": 30.0444, "lon": 31.2357},
    "alexandria": {"lat": 31.2001, "lon": 29.9187},
    "lagos": {"lat": 6.5244, "lon": 3.3792},
    "abuja": {"lat": 9.0765, "lon": 7.3986},
}


def offline_requested() -> bool:
    return os.getenv("OFFLINE", "0") == "1"


def _unwrap(payload: dict) -> tuple[dict, dict]:
    if "parameter" in payload and "meta" in payload:
        return payload["parameter"], payload["meta"]
    if "T2M" in payload:
        return payload, {}
    if "properties" in payload:
        return payload["properties"].get("parameter", {}), payload.get("header", {})
    raise ValueError("Unrecognised NASA POWER file")


def _read(path: Path) -> tuple[dict, dict]:
    return _unwrap(json.loads(path.read_text(encoding="utf-8")))


def _local_paths(location_key: str) -> tuple[Path, Path]:
    name = location_key.lower().strip()
    return CACHE_DIR / f"power_{name}.json", FIXTURES_DIR / f"power_{name}.json"


def load_saved(location_key: str):
    """Return (parameter, meta, mode) from disk, or None."""
    cache_path, fixture_path = _local_paths(location_key)
    if cache_path.exists():
        parameter, meta = _read(cache_path)
        return parameter, meta, "saved"
    if fixture_path.exists():
        parameter, meta = _read(fixture_path)
        return parameter, meta, "saved"
    return None


def _live(location_key: str, start: str, end: str):
    coords = TARGETS[location_key.lower().strip()]
    params = {
        "parameters": "T2M,T2M_MIN,T2M_MAX,PRECTOTCORR",
        "community": "AG",
        "latitude": coords["lat"],
        "longitude": coords["lon"],
        "start": start,
        "end": end,
        "format": "JSON",
    }
    response = requests.get(POWER_URL, params=params, timeout=90)
    response.raise_for_status()
    payload = response.json()
    parameter = payload["properties"]["parameter"]
    geometry = payload.get("geometry", {}).get("coordinates", [None, None, None])
    header = payload.get("header", {})
    units = {}
    for key, info in (payload.get("parameters") or {}).items():
        if isinstance(info, dict) and "units" in info:
            units[key] = info["units"]
    from datetime import datetime, timezone

    meta = {
        "source": "NASA POWER Daily Point API",
        "title": header.get("title"),
        "sources": header.get("sources"),
        "fill_value": header.get("fill_value", -999),
        "units": units,
        "requested_latitude": coords["lat"],
        "requested_longitude": coords["lon"],
        "latitude": geometry[1],
        "longitude": geometry[0],
        "elevation_m": geometry[2] if len(geometry) > 2 else None,
        "start": start,
        "end": end,
        "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "request_url": response.url,
    }
    saved = {"meta": meta, "parameter": parameter}
    text = json.dumps(saved)
    cache_path, fixture_path = _local_paths(location_key)
    cache_path.write_text(text, encoding="utf-8")
    fixture_path.write_text(text, encoding="utf-8")
    return parameter, meta, "live"


def fetch_recent_point(lat: float, lon: float) -> dict:
    """Ask NASA POWER for one grid point over the latest published days.

    This is not cached with the ten study cities. A venue with the offline
    switch on cannot invent a worldwide reading.
    """
    from datetime import datetime, timedelta, timezone

    if offline_requested():
        raise RuntimeError("Offline mode is on. A new place needs a live NASA request.")
    lat = round(float(lat), 2)
    lon = round(float(lon), 2)
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise ValueError("That point is outside the Earth.")
    end = datetime.now(timezone.utc).date() - timedelta(days=8)
    start = end - timedelta(days=27)
    start_s = start.strftime("%Y%m%d")
    end_s = end.strftime("%Y%m%d")
    folder = CACHE_DIR / "points"
    folder.mkdir(exist_ok=True)
    path = folder / f"{lat:.2f}_{lon:.2f}_{start_s}.json"
    if path.exists():
        saved = json.loads(path.read_text(encoding="utf-8"))
        saved["mode"] = "saved"
        return saved
    params = {
        "parameters": "T2M,T2M_MAX,PRECTOTCORR,RH2M",
        "community": "AG",
        "latitude": lat,
        "longitude": lon,
        "start": start_s,
        "end": end_s,
        "format": "JSON",
    }
    response = requests.get(POWER_URL, params=params, timeout=90)
    response.raise_for_status()
    payload = response.json()
    parameter = payload["properties"]["parameter"]
    geometry = payload.get("geometry", {}).get("coordinates", [None, None])
    summary = {}
    for name in ("T2M", "T2M_MAX", "PRECTOTCORR", "RH2M"):
        series = parameter.get(name) or {}
        values = []
        last = None
        last_day = None
        for day, raw in series.items():
            try:
                value = float(raw)
            except (TypeError, ValueError):
                continue
            if value <= -900:
                continue
            values.append(value)
            if last_day is None or str(day) > str(last_day):
                last_day = str(day)
                last = value
        summary[name] = {
            "latest": None if last is None else round(last, 2),
            "latest_day": last_day,
            "mean": None if not values else round(sum(values) / len(values), 2),
            "days": len(values),
        }
    result = {
        "requested_latitude": lat,
        "requested_longitude": lon,
        "returned_latitude": geometry[1] if len(geometry) > 1 else None,
        "returned_longitude": geometry[0] if geometry else None,
        "start": start_s,
        "end": end_s,
        "mode": "live",
        "dataset": "NASA POWER Daily Point API",
        "request_url": response.url,
        "parameters": summary,
    }
    path.write_text(json.dumps(result), encoding="utf-8")
    return result


def fetch_nasa_power_daily(location_key: str, start=DEFAULT_START, end=DEFAULT_END, refresh: bool = False):
    """Use the saved NASA file unless a live refresh is asked for.

    A venue with no internet still gets the saved series. A failed live
    request falls back to that same file instead of stopping the page.
    """
    name = location_key.lower().strip()
    if name not in TARGETS:
        raise KeyError(f"Unknown city: {location_key}")

    if offline_requested():
        saved = load_saved(name)
        if saved is None:
            raise RuntimeError(f"No saved NASA POWER file for {name}")
        parameter, meta, _mode = saved
        return parameter, meta, "offline"

    if refresh:
        try:
            return _live(name, start, end)
        except Exception:
            saved = load_saved(name)
            if saved is None:
                raise
            parameter, meta, _mode = saved
            return parameter, meta, "saved"

    saved = load_saved(name)
    if saved is not None:
        parameter, meta, mode = saved
        return parameter, meta, mode

    return _live(name, start, end)


EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events"
USGS_DAY_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson"
EONET_KEEP = {"severeStorms", "floods", "wildfires", "volcanoes", "landslides", "drought", "tempExtremes"}
_HAZARD_CACHE = {"at": 0.0, "payload": None}


def _iso_from_ms(value) -> str:
    return datetime.fromtimestamp(value / 1000, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _point(coordinates):
    if not isinstance(coordinates, list) or len(coordinates) < 2:
        return None, None
    lon, lat = coordinates[0], coordinates[1]
    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
        return None, None
    return round(float(lat), 2), round(float(lon), 2)


def fetch_live_hazards(refresh: bool = False) -> dict:
    """Open NASA EONET hazards, plus the USGS day catalog for earthquakes.

    EONET's earthquake category has no open events in the current request.
    USGS points stay labeled USGS. Offline mode does not invent a feed.
    """
    if offline_requested():
        raise RuntimeError("Offline mode does not request live events.")
    now = time.time()
    cached = _HAZARD_CACHE["payload"]
    if cached and not refresh and now - _HAZARD_CACHE["at"] < 600:
        return cached

    problems = []
    eonet_events = []
    usgs_features = []
    try:
        response = requests.get(EONET_URL, params={"status": "open", "limit": 200}, timeout=45)
        response.raise_for_status()
        eonet_events = response.json().get("events") or []
    except Exception as exc:
        problems.append(f"NASA EONET did not answer. {exc}")
    try:
        response = requests.get(USGS_DAY_URL, timeout=45)
        response.raise_for_status()
        usgs_features = response.json().get("features") or []
    except Exception as exc:
        problems.append(f"USGS did not answer. {exc}")
    if not eonet_events and not usgs_features:
        raise RuntimeError(" ".join(problems) or "No live event feed answered.")

    rows = []
    for event in eonet_events:
        categories = event.get("categories") or []
        category = categories[0].get("id") if categories else ""
        if category not in EONET_KEEP:
            continue
        geometry = event.get("geometry") or []
        latest = geometry[-1] if geometry else {}
        latitude, longitude = _point(latest.get("coordinates"))
        sources = event.get("sources") or []
        source_url = sources[0].get("url") if sources and isinstance(sources[0], dict) else ""
        magnitude = latest.get("magnitudeValue")
        unit = latest.get("magnitudeUnit") or ""
        rows.append({
            "id": event.get("id") or "",
            "title": event.get("title") or category,
            "category": category,
            "source": "NASA EONET",
            "source_url": source_url if isinstance(source_url, str) and source_url.startswith("https://") else "",
            "date": latest.get("date") or "",
            "latitude": latitude,
            "longitude": longitude,
            "magnitude": magnitude if isinstance(magnitude, (int, float)) else None,
            "magnitude_unit": unit,
        })
    for feature in usgs_features:
        props = feature.get("properties") or {}
        latitude, longitude = _point((feature.get("geometry") or {}).get("coordinates"))
        url = props.get("url") or ""
        when = props.get("time")
        rows.append({
            "id": feature.get("id") or "",
            "title": props.get("title") or "Earthquake",
            "category": "earthquakes",
            "source": "USGS",
            "source_url": url if isinstance(url, str) and url.startswith("https://") else "",
            "date": _iso_from_ms(when) if isinstance(when, (int, float)) else "",
            "latitude": latitude,
            "longitude": longitude,
            "magnitude": props.get("mag") if isinstance(props.get("mag"), (int, float)) else None,
            "magnitude_unit": "M",
        })

    fires = sorted((row for row in rows if row["category"] == "wildfires"), key=lambda row: row["date"], reverse=True)[:8]
    rest = [row for row in rows if row["category"] != "wildfires"]
    payload = {
        "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "partial": problems,
        "events": sorted(rest + fires, key=lambda row: row["date"], reverse=True),
    }
    _HAZARD_CACHE["at"] = now
    _HAZARD_CACHE["payload"] = payload
    return payload

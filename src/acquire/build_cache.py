"""Download NASA POWER daily series for each study city and save them locally."""
import json
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / "cache"
FIXTURES = ROOT / "demo_fixtures"
CACHE.mkdir(exist_ok=True)
FIXTURES.mkdir(exist_ok=True)

CITIES = {
    "dhaka": (23.8103, 90.4125),
    "sylhet": (24.8949, 91.8687),
    "delhi": (28.6139, 77.2090),
    "kolkata": (22.5726, 88.3639),
    "jakarta": (-6.2088, 106.8456),
    "surabaya": (-7.2575, 112.7521),
    "cairo": (30.0444, 31.2357),
    "alexandria": (31.2001, 29.9187),
    "lagos": (6.5244, 3.3792),
    "abuja": (9.0765, 7.3986),
}
START = "20040101"
END = "20241231"
URL = "https://power.larc.nasa.gov/api/temporal/daily/point"


def download(name: str, lat: float, lon: float) -> None:
    params = {
        "parameters": "T2M,T2M_MIN,T2M_MAX,PRECTOTCORR",
        "community": "AG",
        "latitude": lat,
        "longitude": lon,
        "start": START,
        "end": END,
        "format": "JSON",
    }
    response = requests.get(URL, params=params, timeout=180)
    response.raise_for_status()
    payload = response.json()
    parameter = payload["properties"]["parameter"]
    header = payload.get("header", {})
    geometry = payload.get("geometry", {}).get("coordinates", [None, None, None])
    units = {}
    for key, info in (payload.get("parameters") or {}).items():
        if isinstance(info, dict) and "units" in info:
            units[key] = info["units"]
    saved = {
        "meta": {
            "source": "NASA POWER Daily Point API",
            "api": header.get("api") or {"source": URL},
            "title": header.get("title"),
            "sources": header.get("sources"),
            "fill_value": header.get("fill_value", -999),
            "units": units,
            "requested_latitude": lat,
            "requested_longitude": lon,
            "latitude": geometry[1],
            "longitude": geometry[0],
            "elevation_m": geometry[2] if len(geometry) > 2 else None,
            "start": START,
            "end": END,
            "fetched_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "request_url": response.url,
        },
        "parameter": parameter,
    }
    text = json.dumps(saved)
    (CACHE / f"power_{name}.json").write_text(text, encoding="utf-8")
    (FIXTURES / f"power_{name}.json").write_text(text, encoding="utf-8")
    sample = parameter["T2M"]
    first_key = sorted(sample)[0]
    print(f"{name}: days={len(sample)} first={first_key}:{sample[first_key]} lat={geometry[1]} lon={geometry[0]}", flush=True)


if __name__ == "__main__":
    for city, (lat, lon) in CITIES.items():
        print(f"downloading {city}...", flush=True)
        download(city, lat, lon)
    print("done", flush=True)

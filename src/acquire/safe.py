import os
import json
import pathlib
import requests

# Directory setup for offline caching and demo fixtures
CACHE_DIR = pathlib.Path("cache")
CACHE_DIR.mkdir(exist_ok=True)
FIXTURES_DIR = pathlib.Path("demo_fixtures")
FIXTURES_DIR.mkdir(exist_ok=True)

# Environment flag for offline-first demo mode
OFFLINE = os.getenv("OFFLINE") == "1"

# Target coordinates for urban core and baseline rural control
TARGETS = {
    "dhaka": {"lat": 23.8103, "lon": 90.4125},
    "sylhet": {"lat": 24.8949, "lon": 91.8687}
}

def fetch_nasa_power_daily(location_key: str, start="20040101", end="20241231"):
    """
    Fetch daily metrics from NASA POWER API.
    Uses pure JSON storage to bypass Windows DLL load restrictions.
    """
    coords = TARGETS.get(location_key.lower())
    if not coords:
        raise ValueError(f"Unknown location identifier: {location_key}")

    json_cache = CACHE_DIR / f"power_{location_key}.json"
    fixture_cache = FIXTURES_DIR / f"power_{location_key}.json"

    # Prioritize local fixtures in offline mode
    if OFFLINE or fixture_cache.exists():
        if fixture_cache.exists():
            return json.loads(fixture_cache.read_text()), "fixture"
        elif json_cache.exists():
            return json.loads(json_cache.read_text()), "cache"

    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "parameters": "T2M,T2M_MIN,T2M_MAX,PRECTOTCORR",
        "community": "AG",
        "latitude": coords["lat"],
        "longitude": coords["lon"],
        "start": start,
        "end": end,
        "format": "JSON"
    }

    try:
        response = requests.get(url, params=params, timeout=60)
        response.raise_for_status()
        raw_data = response.json()["properties"]["parameter"]

        # Save to both local cache and version-controlled fixtures as pure JSON
        json_cache.write_text(json.dumps(raw_data))
        fixture_cache.write_text(json.dumps(raw_data))
        return raw_data, "live"
    except Exception as e:
        if json_cache.exists():
            return json.loads(json_cache.read_text()), "cache"
        if fixture_cache.exists():
            return json.loads(fixture_cache.read_text()), "fixture"
        raise RuntimeError(f"NASA POWER API request failed: {e}")

if __name__ == "__main__":
    for loc in TARGETS.keys():
        print(f"Fetching NASA POWER data for {loc.capitalize()}...")
        data, mode = fetch_nasa_power_daily(loc)
        count = len(data.get("T2M", {}))
        print(f"Success: {loc} ({count} days stored, mode: {mode})")

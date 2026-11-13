# NASA & National Earth Observation Data Provenance Guide

**Project Name:** Megacity Climate Intelligence (MCI)  
**Team Name:** Team AstroLogic  
**Challenge:** Be an Earth System Trend Detective! (2026)  
**Document:** Earth Observation Data Provenance (`docs/DATA_SOURCES.md`)  

---

## 🛰️ 1. NASA Earth Observation Datasets

MCI operates exclusively on publicly accessible, open-science Earth observation datasets provided by NASA. In compliance with NASA Open Data policies, none of these endpoints require private, proprietary, or paid API keys.

---

### 1.1 NASA POWER (Prediction Of Worldwide Energy Resources)
* **Operating Entity:** NASA Langley Research Center (LaRC) / NASA Earth Science Applied Sciences Program
* **Endpoint URL:** `https://power.larc.nasa.gov/api/temporal/daily/point`
* **Access Model:** Public REST API (No API key required)
* **Temporal Coverage:** 2001-01-01 to 2025-12-31 (24+ years continuous, >9,130 observations per coordinate)
* **Parameters Retrieved:**
  - `T2M`: Temperature at 2 Meters (°C) — Daily Mean Air Temperature
  - `T2M_MIN`: Minimum Temperature at 2 Meters (°C) — Night-time Low
  - `T2M_MAX`: Maximum Temperature at 2 Meters (°C) — Daytime High
  - `PRECTOTCORR`: Corrected Total Precipitation (mm/day)
  - `ALLSKY_SFC_SW_DWN`: All Sky Surface Shortwave Downward Irradiance (MJ/m²/day)
* **Role in MCI:** Powers the core non-parametric Mann-Kendall and Theil-Sen statistical engine across 5 global megacity pairs (10 cities) and 64 districts of Bangladesh.
* **Data Quality Rule:** 80% annual completeness rule. Years with >20% missing daily records are excluded from decadal trend regression.

---

### 1.2 NASA GIBS (Global Imagery Browse Services)
* **Operating Entity:** NASA Earth Observing System Data and Information System (EOSDIS)
* **Endpoint URL:** `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/...`
* **Access Model:** Public WMTS / Tile Service (Open Access)
* **Satellite Instruments:** MODIS (Terra & Aqua), VIIRS (Suomi NPP & NOAA-20)
* **Layers Utilized:**
  - `BlueMarble_NextGeneration` (Global True Color Earth Basemap)
  - `MODIS_Terra_CorrectedReflectance_TrueColor` (Near-Real-Time Surface Reflectance)
* **Role in MCI:** Provides high-resolution global cartographic basemaps and interactive visual context for spatial heatmaps and district boundaries.

---

### 1.3 NASA FIRMS (Fire Information for Resource Management System)
* **Operating Entity:** NASA Earthdata EOSDIS / Goddard Space Flight Center (GSFC)
* **Endpoint URL:** `https://firms.modaps.eosdis.nasa.gov`
* **Access Model:** Public Web Mapping Service (WMS) & Open Telemetry
* **Sensors:** MODIS (1km resolution) and VIIRS (375m high-resolution active fire detection)
* **Role in MCI:** Tracks near-real-time satellite thermal anomalies and active fire detections to cross-validate regional extreme heat events and agricultural burning.

---

### 1.4 NASA EONET (Earth Observatory Natural Event Tracker v3)
* **Operating Entity:** NASA Goddard Space Flight Center (GSFC)
* **Endpoint URL:** `https://eonet.gsfc.nasa.gov/api/v3/events`
* **Access Model:** Public JSON REST API (Open Access)
* **Categories Monitored:** Severe Storms, Tropical Cyclones, Floods, Wildfires, Volcanic Activity
* **Role in MCI:** Dynamically feeds real-time natural hazard events into the Live Hazard Dashboard, enabling city planners to contrast long-term climate baselines with acute disaster events.

---

### 1.5 NASA Earthdata Search (EOSDIS Core System)
* **Operating Entity:** NASA Earth Science Data and Information System (ESDIS) Project
* **Portal URL:** `https://earthdata.nasa.gov`
* **Role in MCI:** Provides reference standards for Land Surface Temperature (LST), atmospheric moisture profiles, and geographic bounding metadata.

---

### 1.6 NASA Visible Earth (Blue Marble Collection)
* **Operating Entity:** NASA Goddard Space Flight Center (GSFC)
* **Resource URL:** `https://visibleearth.nasa.gov/collection/1484/blue-marble`
* **Role in MCI:** High-fidelity planetary texture maps used in the 3D rotating WebGL globe on the Home dashboard.

---

## 🏛️ 2. Partner & Ground-Truth Calibration Sources

To validate satellite-derived observations against ground reality, MCI incorporates published feeds from authorized national and international agencies:

| Provider | Agency / Entity | Data Type & Purpose | Link |
| :--- | :--- | :--- | :--- |
| **USGS** | U.S. Geological Survey | Real-time global seismic feed (`earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`) | [USGS Earthquake Hazards](https://earthquake.usgs.gov) |
| **BMD** | Bangladesh Meteorological Department | Official 5-day district rainfall forecasts, heavy rain alerts, and cyclone bulletins | [BMD Portal](https://bmd.gov.bd) |
| **FFWC** | Flood Forecasting and Warning Centre (BWDB) | River water levels, danger level thresholds, and 5-day flood forecasts across river basins | [FFWC Portal](https://ffwc.gov.bd) |
| **geoBoundaries** | Runfola et al. / William & Mary | Open administrative boundary geometries for all 64 districts of Bangladesh (Level 2) | [geoBoundaries.org](https://www.geoboundaries.org) |

---

## 🛡️ 3. Provenance & Offline Cache Architecture

1. **Pre-Bundled Fixtures (`demo_fixtures/`):**  
   Twenty-four years (2001–2025) of NASA POWER records for all 10 benchmark cities are pre-cached in JSON format, guaranteeing instant 100% functionality during field inspections or connectivity loss.
2. **Transparent Provenance Drawer:**  
   Every analytical result rendered on the MCI UI includes an inspectable Provenance Drawer containing:
   - `dataset_id`: Specific NASA archive identifier
   - `source_url`: Verifiable REST endpoint URL
   - `n_observations`: Total valid daily observation count ($N > 9,130$)
   - `retrieved`: ISO 8601 UTC timestamp of retrieval
   - `mode`: Live network fetch vs. verified local cache

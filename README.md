
```markdown
# Megacity Climate Intelligence (MCI): Global Multi-Megacity Climate Intelligence & Urban Heat Shield Platform🌍🔬
### An Offline-First Earth System Trend Engine for Megacity Thermal Attribution

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![NASA Data](https://img.shields.io/badge/NASA%20Data-POWER%20%7C%20MODIS%20%7C%20VIIRS-orange.svg)](https://power.larc.nasa.gov/)
[![Event](https://img.shields.io/badge/NASA%20Space%20Apps-2026-brightgreen.svg)](https://www.spaceappschallenge.org/)
[![Status](https://img.shields.io/badge/Build-Offline--Ready-success.svg)](#setup--offline-verification)

> **Official Entry for NASA International Space Apps Challenge 2026**  
> **Challenge:** Be an Earth System Trend Detective!  
> **Team:** AstroLogic (Dhaka, Bangladesh Local Event)  
> **Target Domain:** Climate Informatics, Urban Heat Dynamics, and Deterministic Time-Series Analysis

---

## Executive Summary

Urban centers face accelerating thermal stress driven by the compounding effects of broad planetary warming and aggressive, localized land-surface modifications. In densely populated global megacities, empirical climate assessments are frequently compromised by arbitrary smoothing, uncalibrated visualizations, or generative AI hallucinations.

**Megacity Climate Intelligence (MCI) is an advanced, offline-ready climate platform designed to monitor and reduce extreme urban heat across major global cities. Using decades of NASA POWER daily weather data, the platform applies statistical tests (Mann-Kendall and Theil-Sen) to separate local city heat from regional climate changes. Beyond basic charts, MCI features a Population-Weighted Heat Exposure Index (PHEI) for vulnerable slum dwellers, a 2035 urban cooling simulator, an emergency SMS early warning system, and multi-agency municipal resilience roadmaps. Built with no login walls and full English-Bangla language support, MCI easily scales across Dhaka, Delhi, Jakarta, Cairo, and Lagos using simple JSON configurations.

---

## Key Differentiators & Scientific Novelty

- **Deterministic Mathematics (Zero AI Hallucination):** Runs pure Python implementations of the non-parametric Mann-Kendall test ($S$, $Z$, $p$-value) and Theil-Sen slope estimation to compute monotonic trend velocity resilient to observational anomalies.
- **Multi-Megacity Scope:** Fully modular configuration supporting immediate deployment across Dhaka, Delhi, Jakarta, Cairo, and Lagos.
- **Nocturnal Anomaly Trapping:** Evaluates multi-decade daily minimum surface air temperatures ($T2M\_MIN$) to track dangerous shifts in nocturnal thermal retention and tropical night occurrences.
- **Population-Weighted Heat Exposure Index (PHEI):** Computes a composite risk index (0–100) combining satellite thermal anomalies with population density and high-vulnerability tin-roof informal settlements.
- **C40 2035 Mitigation Simulator:** Enables city planners to simulate counterfactual heat mitigation trajectories (e.g., cool roof retrofits, canopy expansion) through 2035.
- **Zero-Bandwidth Citizen Alerts:** Automates life-saving cell-broadcast SMS warnings and links to toll-free municipal emergency hotlines (*16100#) for informal workers lacking smartphones or internet.
- **Full Data Provenance:** Features an interactive Provenance Drawer mapping every output directly back to source NASA POWER records and statistical execution modes (`live`, `cache`, `fixture`).

---

## NASA & Partner Datasets

- **NASA POWER Daily Point API:** Multi-decade daily temporal continuity (2004–2025) capturing $T2M$, $T2M\_MIN$, $T2M\_MAX$, and precipitation ($PRECTOTCORR$).
- **NASA MODIS / VIIRS Continuity:** Day/night Land Surface Temperature (MOD11A1 / VNP11A1) and vegetation indices (MOD13A2 / VNP13A2).
- **NASA GIBS:** Geospatial basemap overlays for high-contrast contextual visualization.

---

## System Architecture

```text
       [ NASA POWER Daily API & Local JSON Blueprints ]
                              │
                              ▼
            [ Offline-Ready Data Cache / Parquet ]
                              │
                              ▼
     [ Deterministic Science Engine: src/compute (Mann-Kendall & Theil-Sen) ]
                              │
                              ▼
        [ FastAPI Backend Core: /api/cities, /api/compare ]
                              │
                              ▼
  [ Interactive Web Dashboard: Leaflet.js • Chart.js • Bilingual Toggle ]
                              │
  ┌───────────────────────────┼───────────────────────────┐
  ▼                           ▼                           ▼
[ PHEI Risk Score ]   [ C40 Simulator ]    [ Zero-Bandwidth SMS Alerts ]

```

---

## Directory Structure

```text
AstroLogic-Megacity-Climate-Intelligence/
├── .env.example                                      # Environment variables template
├── .gitignore                                        # Git untracked and cache exclusion rules
├── AGENTS.md                                         # Runtime agent boundary and execution protocols
├── AstroLogic 240 Second  Presentation Slide With Live Demo Video.pdf # 240s pitch deck & demo video link
├── LICENSE                                           # Apache-2.0 Open Source License
├── README.md                                         # Core project specification and system documentation
├── cache/                                            # Primary offline NASA POWER climate telemetry cache
│   ├── power_cairo.json                              # Offline climate cache for Cairo
│   ├── power_delhi.json                              # Offline climate cache for Delhi
│   ├── power_dhaka.json                              # Offline climate cache for Dhaka
│   ├── power_jakarta.json                            # Offline climate cache for Jakarta
│   ├── power_lagos.json                              # Offline climate cache for Lagos
│   └── power_sylhet.json                             # Offline climate cache for Sylhet
├── data/
│   └── cities/                                       # Target megacity profiles (coordinates & metadata)
│       ├── cairo.json
│       ├── delhi.json
│       ├── dhaka.json
│       ├── jakarta.json
│       └── lagos.json
├── demo_fixtures/                                    # Isolated mock fixtures & zero-network test suite
│   ├── power_cairo.json
│   ├── power_delhi.json
│   ├── power_dhaka.json
│   ├── power_jakarta.json
│   ├── power_lagos.json
│   ├── power_sylhet.json
│   └── sample_power.json
├── docs/
│   └── AI_USE.md                                     # NASA Space Apps AI usage disclosure ledger
├── src/                                              # Backend application source code
│   ├── acquire/
│   │   ├── __init__.py
│   │   └── safe.py                                   # Resilient offline-first telemetry ingestion engine
│   ├── agents/
│   │   ├── __init__.py
│   │   └── loop.py                                   # Autonomous climate reasoning engine
│   ├── api/
│   │   ├── __init__.py
│   │   └── main.py                                   # FastAPI high-performance REST API backend
│   └── compute/
│       ├── __init__.py
│       └── trend.py                                  # Mann-Kendall & Theil-Sen statistical calculation engine
└── web/                                              # Offline-first interactive frontend dashboard
    ├── index.html                                    # Responsive bilingual dashboard layout
    ├── style.css                                     # Dark-mode GIS visual theme stylesheet
    ├── app.js                                        # Core client controller & reactivity logic
    ├── chart.umd.min.js                              # Bundled Chart.js library (zero CDN dependency)
    ├── leaflet.js                                    # Bundled Leaflet GIS mapping engine
    ├── leaflet.css                                   # Leaflet GIS stylesheet
    ├── countries.geojson                             # Global boundary geometry layer
    └── world_data.js                                 # Megacity spatial coordinates & baseline datasets

```

---

## Setup & Offline Verification

### 1. Environment Setup

```bash
git clone [https://github.com/TanvirHosenNishat01-blip/AstroLogic-Megacity-Climate-Intelligence.git](https://github.com/TanvirHosenNishat01-blip/AstroLogic-Megacity-Climate-Intelligence.git)
cd AstroLogic-Megacity-Climate-Intelligence
python -m venv venv
source venv/bin/activate       # On Windows Git Bash: source venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env

```

### 2. Launch in Deterministic Offline Mode

```bash
export OFFLINE=1               # On Windows Git Bash: export OFFLINE=1
uvicorn src.api.main:app --reload --port 8000

```

Open `http://127.0.0.1:8000` in your web browser. All statistical metrics, time-series curves, spatial pins, and provenance drawers operate strictly from local offline fixtures without external network dependencies.

---

## 👥 Team AstroLogic & Project Roles

## 👥 Team AstroLogic & Core Responsibilities

| Member | Institution | Role & Technical Domain Focus |
| :--- | :--- | :--- |
| **Tanvir Hosen Nishat** | AIUB | **Team Lead • Scientific Engine & Offline Architecture Lead**<br>• **Deterministic Statistical Engine (`src/compute/trend.py`):** Pure Python Mann-Kendall test ($S$, $Z$, $p$-value) and Theil-Sen slope estimation for monotonic trend detection with zero AI hallucination.<br>• **Offline-First Core Architecture:** Built the zero-network runtime engine, resilient caching pipeline (`src/acquire/safe.py`), and local telemetry data stores (`cache/`, `demo_fixtures/`).<br>• **Backend Core & Systems:** FastAPI REST API implementation, end-to-end system integration, and version control governance. |
| **Md. Abu Naif Siam** | BRACU | **Civic Tech & Presentation Lead**<br>• Zero-Bandwidth citizen SMS cell-broadcast architecture and municipal hotline (*16100#) protocol.<br>• 240-second pitch deck video narration, visual storytelling, and NASA AI disclosure ledger (`docs/AI_USE.md`). |
| **MD. Farhan** | NSU | **Frontend & UI/UX Engineer**<br>• Interactive bilingual dashboard layout and responsive GIS styling (`web/style.css`).<br>• Map layer controls (`Leaflet.js`) and dynamic climatological curve rendering (`Chart.js`). |
| **Ishtiaque Mahmud Sakif** | AIUB | **Data Ingestion & City Profiles Specialist**<br>• NASA POWER telemetry scraping, normalization, and JSON schema formulation.<br>• Curated megacity baseline profiles (`data/cities/`) and spatial boundary geometries (`web/countries.geojson`). |
| **Mansura Jannat Monima** | AIUB | **Climate Impact & Vulnerability Modeler**<br>• Mathematical design of the Population-Weighted Heat Exposure Index (PHEI).<br>• C40 2035 urban mitigation simulation trajectories and informal tin-roof settlement vulnerability logic. |
| **Hosni Rabbani** | BRACU | **Earth Observation & Remote Sensing Analyst**<br>• NASA satellite dataset alignment (MODIS/VIIRS LST & GIBS overlays).<br>• Multi-decade climatological baseline benchmarking (2004–2025) and nocturnal thermal retention ($T2M\_MIN$) validation. |
---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

```

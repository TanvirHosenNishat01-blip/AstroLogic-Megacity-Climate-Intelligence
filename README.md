```markdown
# Megacity Climate Intelligence (MCI) / ClimaDhaka 🌍🔬
### An Offline-First Earth System Trend Engine for Megacity Thermal Attribution

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![NASA Data](https://img.shields.io/badge/NASA%20Data-POWER%20%7C%20MODIS%20%7C%20VIIRS-orange.svg)](https://power.larc.nasa.gov/)
[![Event](https://img.shields.io/badge/NASA%20Space%20Apps-2026-brightgreen.svg)](https://www.spaceappschallenge.org/)
[![Status](https://img.shields.io/badge/Build-Offline--Ready-success.svg)](#offline-verification)

> **Official Entry for NASA International Space Apps Challenge 2026**  
> **Challenge:** Be an Earth System Trend Detective!  
> **Team:** AstroLogic (Dhaka, Bangladesh Local Event)  
> **Target Domain:** Climate Informatics, Urban Heat Dynamics, and Deterministic Time-Series Analysis

---

## Executive Summary

Urban centers face accelerating thermal stress driven by the compounding effects of broad planetary warming and aggressive, localized land-surface modifications. In densely populated global megacities, empirical climate assessments are frequently compromised by arbitrary smoothing, uncalibrated visualizations, or generative AI hallucinations.

**Megacity Climate Intelligence (MCI)** (globally deployed as **ClimaDhaka**) provides a deterministic analytical pipeline evaluating over two decades of historical NASA Earth observation records. The platform isolates anthropogenic Urban Heat Island (UHI) signatures from background regional climate baselines by evaluating paired rural reference controls (such as Dhaka versus Sylhet). Designed for resilience, the platform maintains a strict boundary between verified statistical calculations and generative narratives, ensuring data provenance and zero-network offline functionality.

---

## Key Differentiators & Scientific Novelty

* **Deterministic Mathematics (Zero AI Hallucination):** Runs pure Python implementations of the non-parametric Mann-Kendall test ($S$, $Z$, $p$-value) and Theil-Sen slope estimation to compute monotonic trend velocity resilient to observational anomalies.
* **Multi-Megacity Scope:** Fully modular configuration supporting immediate deployment across Dhaka, Delhi, Jakarta, Cairo, and Lagos.
* **Nocturnal Anomaly Trapping:** Evaluates multi-decade daily minimum surface air temperatures ($T2M\_MIN$) to track dangerous shifts in nocturnal thermal retention and tropical night occurrences.
* **Population-Weighted Heat Exposure Index (PHEI):** Computes a composite risk index (0–100) combining satellite thermal anomalies with population density and high-vulnerability tin-roof informal settlements.
* **C40 2035 Mitigation Simulator:** Enables city planners to simulate counterfactual heat mitigation trajectories (e.g., cool roof retrofits, canopy expansion) through 2035.
* **Zero-Bandwidth Citizen Alerts:** Automates life-saving cell-broadcast SMS warnings and links to toll-free municipal emergency hotlines (*16100#) for informal workers lacking smartphones or internet.
* **Full Data Provenance:** Features an interactive Provenance Drawer mapping every output directly back to source NASA POWER records and statistical execution modes (`live`, `cache`, `fixture`).

---

## NASA & Partner Datasets

* **NASA POWER Daily Point API:** Multi-decade daily temporal continuity (2004–2025) capturing $T2M$, $T2M\_MIN$, $T2M\_MAX$, and precipitation ($PRECTOTCORR$).
* **NASA MODIS / VIIRS Continuity:** Day/night Land Surface Temperature (MOD11A1 / VNP11A1) and vegetation indices (MOD13A2 / VNP13A2).
* **NASA GIBS:** Geospatial basemap overlays for high-contrast contextual visualization.

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
---

## Setup & Offline Verification

### 1. Environment Setup

```bash
git clone [https://github.com/TanvirHosenNishat01-blip/AstroLogic-Megacity-Climate-Intelligence.git](https://github.com/TanvirHosenNishat01-blip/AstroLogic-Megacity-Climate-Intelligence.git)
cd AstroLogic-Megacity-Climate-Intelligence
python -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate
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

## Team AstroLogic

* **Tanvir Hosen Nishat** — Team Leader (American International University-Bangladesh)
* **Hosni Rabbani** — Member (BRAC University)
* **Mansura Jannat Monima** — Member (American International University-Bangladesh)
* **Md. Abu Naif Siam** — Member (BRAC University)
* **MD. Farhan** — Member (North South University)
* **Ishtiaque Mahmud Sakif** — Member (American International University-Bangladesh)

```

```

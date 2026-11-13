# AGENTS.md — Autonomous Climate Agent & Developer Guide

**Project:** Megacity Climate Intelligence (MCI)  
**Challenge:** NASA International Space Apps Challenge 2026 — *Be an Earth System Trend Detective!*  
**Team:** Team AstroLogic (BRACU • NSU • AIUB)  
**Location:** Dhaka · NASA-2026-0084  

---

## 🧭 1. Overview & Architectural Philosophy

`AGENTS.md` defines the architectural contract, operational boundaries, and developer protocols for autonomous agent workflows (`src/agents/loop.py`) operating within **Megacity Climate Intelligence (MCI)**.

MCI is built upon an unyielding scientific principle:
> **Zero AI in Numerical Claims.** Autonomous agents orchestrate telemetry retrieval, trigger automated validations, and format outputs, but **NEVER calculate, predict, interpolate, or fabricate numerical climate claims**. All statistical deductions stem exclusively from peer-reviewed, deterministic mathematical algorithms implemented in `src/compute/`.

---

## ⚙️ 2. Autonomous Agent Execution Pipeline

The automated agent pipeline follows a 4-phase deterministic lifecycle:

```
[Phase 1: Ingest]  --->  [Phase 2: Compute]  --->  [Phase 3: Calibrate]  --->  [Phase 4: Synthesize]
NASA POWER Daily        Mann-Kendall (Z, p)       NASA FIRMS & EONET        4 Persona Modes
9,131+ Observations     Theil-Sen Slope (95% CI)  BMD / FFWC / USGS         6 Native Languages
80% Completeness        Gilbert-Sen Bounds        Ground-Truth Sync         Challenge 02 JSON
```

### Phase 1: Telemetry Acquisition & Boundary Guards (`src/acquire/safe.py`)
- Agents fetch daily time-series records (2001–2025) across five parameters: `T2M`, `T2M_MIN`, `T2M_MAX`, `PRECTOTCORR`, and `ALLSKY_SFC_SW_DWN`.
- **The 80% Completeness Rule:** A calendar year is automatically excluded from regression if missing >20% of expected daily observations.
- **Offline Guard:** If `$env:OFFLINE="1"` is set or the network is unreachable, agents immediately fall back to verified local fixtures in `demo_fixtures/` rather than throwing fatal timeouts or fabricating data.

### Phase 2: Deterministic Statistical Validation (`src/compute/trend.py`)
- **Non-Parametric Trend Test:** Evaluates the Mann-Kendall $S$-statistic, variance $V(S)$ with tie-correction, and standard normal test statistic $Z$.
- **Two-Sided Significance:** Calculates exact $p$-values via Acklam's inverse normal approximation. An alpha threshold of $\alpha = 0.05$ determines statistical significance.
- **Theil-Sen Median Slope:** Computes pairwise median slopes across all valid observation years with Gilbert-Sen 95% confidence intervals (`ci_low`, `ci_high`).
- **Bivariate Correlation:** Computes simultaneous Pearson ($r$) and Spearman ($\rho$) rank correlations with Student's $t$ two-sided probabilities (`src/compute/correlate.py`).

### Phase 3: Cross-Sensor Ground Calibration (`src/acquire/district_alert.py`)
- Thermal anomalies from **NASA FIRMS** (MODIS/VIIRS) are cross-referenced with regional heatwave records.
- Real-time natural disaster alerts are integrated via **NASA EONET v3**.
- Ground-truth meteorological validation is synchronized with the **Bangladesh Meteorological Department (BMD)** and river danger levels from the **Flood Forecasting and Warning Centre (FFWC)**.

### Phase 4: Multi-Persona Synthesis & Audit Export
- Formats analytical outputs into the official **Challenge 02 JSON Result Object**:
  ```json
  {
    "district": "Sylhet",
    "variable": "T2M",
    "period": "2001-01-01 to 2025-12-31",
    "n_observations": 9131,
    "trend": {
      "S": 41230,
      "Z": 1.96,
      "p_value": 0.0497,
      "direction": "increasing",
      "significant_at_0.05": true
    },
    "slope": {
      "slope_per_year": 0.038,
      "ci_low": 0.012,
      "ci_high": 0.064,
      "units": "degC per year"
    },
    "provenance": {
      "dataset_id": "NASA POWER Daily Point API",
      "source_url": "https://power.larc.nasa.gov/api/temporal/daily/point",
      "retrieved": "2026-11-13T08:00:00Z",
      "mode": "cache"
    }
  }
  ```

---

## 🛡️ 3. Safety Protocols & Developer Constraints

All autonomous agents and human developers contributing to MCI must adhere to the following hard rules:

1. **No Predictive Guesswork:** Never allow an agent to forecast future years beyond the empirical observational record (2001–2025).
2. **Honest Inconclusiveness:** If a location yields $p \ge 0.05$ (such as Dhaka temperature at $p = 0.1941$), the agent MUST explicitly declare the trend as **statistically non-significant**. No smoothing or curve-fitting to force significance is permitted.
3. **Open Provenance:** Every API endpoint must expose its sample size ($N$), data gaps, formula references, and NASA source URLs in the Provenance Drawer.
4. **Offline Resilience:** All code modifications must pass the offline test suite (`set OFFLINE=1 && python -m unittest discover -s tests`).
5. **No Data Leakage:** Ensure `.env` tokens, internal BWDB keys, and private developer credentials are never committed to source control or exposed in client responses.

---

## 🧪 4. Automated Testing Suite

Developers and agents must verify all changes against the 29 automated test cases:

```bash
# Run complete test suite:
python -m unittest discover -s tests -v
```

*Requirements: 100% passing tests, zero runtime regressions, execution time under 0.5s.*

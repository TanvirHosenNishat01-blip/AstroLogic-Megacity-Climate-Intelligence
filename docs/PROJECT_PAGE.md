# NASA Space Apps Challenge 2026 — Official Project Page Submission

**Project Title:** Megacity Climate Intelligence (MCI)  
**Challenge:** Be an Earth System Trend Detective!  
**Track:** Earth Science & Data Analysis (Advanced)  
**Team:** Team AstroLogic (Dhaka, Bangladesh)  
**Location:** Dhaka · NASA-2026-0084  
**Project URL:** `https://www.spaceappschallenge.org/2026/find-a-team/astrologic/`  
**GitHub Repository:** `https://github.com/TanvirHosenNishat01-blip/AstroLogic-Megacity-Climate-Intelligence`  
**Project Demo Video:** `https://drive.google.com/file/d/1cqLivEyvOzLIHE2nU7Fx1IITtAuyN7Pr/view?usp=sharing`  

---

## 🚀 One-Sentence Project Pitch
**Megacity Climate Intelligence (MCI)** is Bangladesh’s first deterministic climate trend engine, transforming 24+ years of NASA Earth observation data into verifiable mathematical truth to separate climate noise from real environmental shifts.

---

## 📝 High-Level Project Summary (Under 1,000 Characters)
Megacity Climate Intelligence (MCI) is an empirical Earth observation platform engineered for NASA's "Be an Earth System Trend Detective" challenge to separate short-term weather noise from statistically verified climate trends. By executing deterministic Mann-Kendall tests and Theil-Sen median slopes over 24+ years of daily NASA POWER records, MCI evaluates climate trajectories across 5 global megacity pairs—Dhaka vs. Sylhet (Bangladesh), Delhi vs. Kolkata (India), Jakarta vs. Surabaya (Indonesia), Cairo vs. Alexandria (Egypt), and Lagos vs. Abuja (Nigeria)—alongside a 64-district territorial monitor. Tailored for civic leaders, researchers, educators, and farmers, MCI delivers real p-values, 95% confidence intervals, and full data provenance through four adaptive persona modes, six native languages, and an offline-first architecture. It empowers vulnerable communities to replace speculative climate anxiety with defensible mathematical proof.

---

## 🔬 Detailed Project Description (Under 5,000 Characters)

### 1. The Challenge Answered: Trend vs. Noise
In climate science, a trend is not a smoothed graph or an animated visual impression; it is an empirical mathematical claim about direction, magnitude, and statistical significance. Across vulnerable nations in the Global South, public discourse frequently mistakes three-day seasonal heatwaves or temporary drought spells for irreversible climate trends. This data fragmentation and sensationalism misleads municipal adaptation budgets, skews scientific research, and disrupts agricultural planting calendars. Our mission was not to produce another decorative map, but to act as true Trend Detectives—establishing mathematical validity, rate of change, and statistical significance across 24+ years of NASA Earth observation data.

### 2. Five Global Megacity Pairs & 64-District Deep Dive
To evaluate climate trends under contrasting geographic and socioeconomic pressures, MCI investigates 5 paired global megacity benchmarks in the same nations:
- **Bangladesh:** Dhaka vs. Sylhet (Bangla)
- **India:** Delhi vs. Kolkata (Hindi)
- **Indonesia:** Jakarta vs. Surabaya (Indonesian)
- **Egypt:** Cairo vs. Alexandria (Arabic, RTL)
- **Nigeria:** Lagos vs. Abuja (Yoruba)

For each pair, the engine evaluates four core climate variables: Mean Temperature (T2M), Night-time Low (T2M_MIN), Daytime High (T2M_MAX), and Daily Rainfall (PRECTOTCORR), supplemented by an exhaustive 64-district local monitor for Bangladesh with regional ranking tables and spatial heatmaps.

### 3. How It Works: Pure Deterministic Math with Zero Hallucination
MCI rejects black-box AI approximations in favor of peer-reviewed mathematical validity:
- **NASA Earth Observations:** We ingest 24 years (2001–2025) of continuous daily records from NASA POWER (Prediction Of Worldwide Energy Resources) for surface meteorology and solar irradiance.
- **Non-Parametric Rigor:** Trend direction and significance are determined using the Mann-Kendall test (S, standardized Z, and Kendall's tau). Magnitude is calculated via the Theil-Sen robust median slope with Gilbert-Sen 95% confidence intervals.
- **The 80% Completeness Rule:** A year is excluded if missing more than 20% of its expected days; observation gaps are explicitly reported rather than artificially smoothed.
- **Multi-Source Integration:** Thermal anomalies are cross-referenced via NASA FIRMS (MODIS/VIIRS), real-time basemaps via NASA GIBS, and natural hazard tracking via NASA EONET alongside local ground-truth calibration (BMD, FFWC) and USGS seismic telemetry.
- **Challenge 02 JSON Compliance:** Every inquiry outputs a fully compliant audit object and an open Provenance Drawer displaying raw REST endpoints, timestamps, and sample sizes (N > 7,600 days).

### 4. The Killer Demo: Sylhet vs. Dhaka Contrast
Our benchmark killer demo contrasts two real-world regions over 24 years of NASA POWER records:
- **Sylhet:** Demonstrates a statistically significant warming trend (Z = +1.96, p = 0.0497 < 0.05) with a Theil-Sen slope of +0.038 °C/year.
- **Dhaka:** Despite pervasive urban heat island perception, empirical analysis proves a non-significant result (p = 0.1941 > 0.05)—revealing localized thermal trapping rather than a monotonic regional baseline shift.
MCI reports both truths honestly with complete statistical transparency.

### 5. Inclusive Personas, 6 Languages & Offline Resilience
- **Four Persona Modes:** General Public / City Officer (plain-language verdicts), Student & Educator (interactive STEM statistics), Climate Scientist (raw p-values, Kendall's tau, multi-format export), and Farmer / Agricultural Planner (monsoon shifts & solar patterns).
- **6 Languages:** Full localization in English, Bangla, Hindi, Indonesian, Arabic (native RTL), and Yoruba.
- **Offline-First Architecture:** Pre-bundled historical fixtures and client-side vector boundaries enable full functionality during cyclone power/network blackouts.

### 6. What We’d Build Next (Future Scope)
1. **Automated Agricultural Advisory:** Integrating with the Department of Agricultural Extension (DAE) to deliver automated SMS planting advisories to 16M+ farmers based on localized monsoon trends.
2. **Low-Cost IoT Sensor Meshes:** Deploying LoRaWAN ground stations across rural unions to calibrate NASA satellite grid points in real time.
3. **Pan-Global Expansion:** Broadening our paired-city analysis across vulnerable river deltas and metropolitan belts throughout the Global South.

---

## 🏷️ Tags & Keywords
`NASA POWER`, `Mann-Kendall Test`, `Theil-Sen Slope`, `Earth Observation`, `Climate Intelligence`, `Megacities`, `Bangladesh`, `Open Science`, `Offline-First`, `Data Provenance`, `NASA GIBS`, `NASA FIRMS`, `NASA EONET`

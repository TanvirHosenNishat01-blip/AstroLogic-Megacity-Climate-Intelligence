# NASA Space Apps Challenge 2026 — AI Utilization & Ethical Disclosure

**Project Name:** Megacity Climate Intelligence (MCI)  
**Team Name:** Team AstroLogic  
**Challenge:** Be an Earth System Trend Detective!  
**Track:** Earth Science & Data Analysis (Advanced)  
**Document:** Ethical AI Usage Declaration (`docs/AI_USE.md`)  

---

## ⚖️ Executive Policy: Zero AI in Scientific Calculations

Team AstroLogic strictly adheres to the principle of **Deterministic Mathematical Integrity**. In Megacity Climate Intelligence (MCI):

> **NO artificial intelligence, machine learning model, neural network, or Large Language Model (LLM) is used to calculate, predict, estimate, or interpolate any climate trend, p-value, slope, correlation coefficient, or temperature/rainfall metric.**

All numerical results are computed strictly through transparent, peer-reviewed, closed-form mathematical algorithms implemented in native Python standard libraries (`math`, `collections`):
- **Mann-Kendall Non-Parametric Trend Test** (Mann 1945, Kendall 1975)
- **Theil-Sen Robust Median Slope Estimator** (Theil 1950, Sen 1968)
- **Gilbert-Sen 95% Confidence Interval Formula** (Gilbert 1987)
- **Acklam's Inverse Normal Cumulative Approximation** (Acklam 2010)
- **Pearson ($r$) and Spearman ($\rho$) Bivariate Rank Correlations**

---

## 🤖 Authorized Assistive AI Tools & Roles

Generative AI was utilized exclusively as an **assistive developer co-pilot** for non-scientific tasks, including conceptual brainstorming, frontend design prompt generation, boilerplate code scaffolding, and documentation refactoring.

### 1. Google Gemini
- **Role:** Conceptual Planning, Challenge Analysis & Architectural Scaffolding
- **What It Was Used For:**
  - Analyzing the NASA Space Apps 2026 "Be an Earth System Trend Detective" challenge brief.
  - Identifying relevant NASA Earth observation datasets and public API endpoint capabilities (NASA POWER, GIBS, FIRMS, EONET).
  - Formulating user persona narrative structures (City Officer, Student, Climate Scientist, Farmer).
  - Drafting system architecture diagrams and project milestone roadmaps.
- **Data Worked On:** NASA challenge text guidelines, public API documentation schemas, and structural project outlines.

### 2. OpenAI ChatGPT
- **Role:** UI/UX Ideation, Prompt Engineering & Accessibility Optimization
- **What It Was Used For:**
  - Generating styling concepts for responsive glassmorphism interfaces in dark mode.
  - Formulating prompt templates for clean Leaflet.js cartography integration.
  - Designing color-contrast accessibility palettes compliant with WCAG 2.1 AA standards.
  - Assisting in bilingual translation dictionary structuring (English to Bengali, Hindi, Indonesian, Arabic, and Yoruba).
- **Data Worked On:** Frontend HTML/CSS layout templates, color hex codes, and language dictionary JSON keys.

### 3. xAI Grok
- **Role:** Syntax Scaffolding, Unit Test Templates & Code Refactoring
- **What It Was Used For:**
  - Generating standard FastAPI route boilerplate and CORS middleware setup.
  - Scaffolding unit test parameter fixtures (`tests/test_trend.py`, `tests/test_correlate.py`).
  - Code review for cross-platform file path compatibility across Windows, Linux, and macOS.
  - Assisting in Markdown formatting for documentation dossiers.
- **Data Worked On:** Python boilerplate syntax, standard test case assertions, and markdown documentation formatting.

---

## 🔍 Human Verification & Quality Assurance

To ensure complete validity, security, and scientific reproducibility:
1. **100% Code Audit:** Every line of code generated or suggested by assistive AI tools was manually reviewed, verified, and adjusted by Team AstroLogic members.
2. **Automated Unit Testing:** The entire codebase is verified by 29 automated unit tests (`python -m unittest discover -s tests -v`) with 100% pass rate in under 0.3 seconds.
3. **Traceability:** All calculation engines are isolated in `src/compute/trend.py` and `src/compute/correlate.py` without external model dependencies.
4. **No Synthetic Data:** MCI never invents or simulates missing satellite observations; missing observations are strictly filtered via the 80% annual completeness rule.

---

## 📜 Ethical Pledge

Team AstroLogic confirms that this submission represents our original work, intellectual synthesis, and technical development. All external libraries, datasets, and assistive tools have been transparently declared in accordance with the **NASA Space Apps Challenge 2026 Standard of Conduct** and **Bangladesh Participants Guide**.

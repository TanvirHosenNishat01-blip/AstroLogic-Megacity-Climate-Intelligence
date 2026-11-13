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

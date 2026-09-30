# QRoute: Quantum-Inspired Traffic-Aware Vehicle Routing Engine 🚚⚡

**QRoute** is a state-of-the-art Vehicle Routing Problem (VRP) optimization platform that combines **Quantum-behaved Particle Swarm Optimization (QPSO)** with **Real-World OpenStreetMap (OSM)** road networks and dynamic traffic shock rerouting.

---

## 🌟 Key Features
- **Quantum-Behaved PSO Optimization (QPSO):** Coordinate-wise Delta Potential Well wave mechanics for superior combinatorial optimization without trapping in local minima.
- **Physical Delhi Road Network:** 100% road-snapped turn-by-turn routing via OpenStreetMap (OSM) / OSRM engine across 101 Delhi NCR delivery hubs.
- **Dynamic Traffic Shock Simulation:** Real-time arterial road congestion injection with instantaneous multi-vehicle bypass recalculation.
- **Tri-Algorithm Benchmarking:** Comprehensive comparative analysis against **Google OR-Tools (MIP)** and **Classical PSO**.

---

## 📂 Repository Structure

```
├── backend/                  # FastAPI Optimization Engine
│   ├── data/                 # Delhi Geographic & Customer Datasets (Customer-100.json)
│   ├── qpso.py               # Quantum Particle Swarm Optimization Solver
│   ├── classical_pso.py      # Classical PSO Baseline Solver
│   ├── ortools_baseline.py   # Google OR-Tools Baseline Solver
│   ├── real_map.py           # Delhi Road Graph & OSM Integration
│   ├── traffic.py            # Dynamic Traffic Shock Engine
│   ├── fitness.py            # Multi-Objective Fitness Evaluation
│   ├── vrp.py                # Fleet & Capacity Constraints
│   ├── main.py               # FastAPI Server & REST Endpoints
│   ├── Dockerfile            # Cloud Run Containerization
│   └── requirements.txt      # Python Dependencies
│
├── frontend/                 # React + Vite + Leaflet Web Dashboard
│   ├── src/
│   │   ├── components/       # UI Panels (DelhiOsmMap, DashboardTab, BenchmarkTab, etc.)
│   │   ├── services/         # API Service Clients
│   │   ├── utils/            # Delhi Coordinates & OSRM Engine
│   │   └── data/             # Mock & Synchronized Fallback Datasets
│   ├── public/               # Static Assets
│   ├── Dockerfile            # Production Multi-Stage Nginx Container
│   ├── nginx.conf            # Reverse Proxy Routing
│   ├── package.json          # Node Dependencies & Scripts
│   └── vite.config.ts        # Vite Bundler Configuration
│
└── docs/                     # Project Guides, PPTs & Research Reports
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```


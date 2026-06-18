# Pune Airbnb Price Intelligence Agent

A full-stack AI agent that predicts Airbnb listing prices in Pune, explains predictions via feature contributions, compares your listing to the market, and lets you set live price alerts.

Built on top of **Minor Project 3** (Linear Regression) — extended into a real agentic application.

---

## Project Structure

```
pune-airbnb-agent/
├── backend/
│   ├── main.py            ← FastAPI backend (model + all agent logic)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   ├── main.jsx
    │   └── components/
    │       ├── ListingForm.jsx
    │       ├── PredictTab.jsx
    │       ├── CompareTab.jsx
    │       ├── MarketTab.jsx
    │       └── AlertsTab.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Setup Instructions (Windows + VS Code)

### Step 1 — Backend (Python / FastAPI)

Open a **PowerShell terminal** in VS Code.

```powershell
cd pune-airbnb-agent/backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

The model trains automatically on first run and saves `pune_model.joblib`.

Test it: open http://localhost:8000 in your browser → should return `{"status": "...running"}`.

---

### Step 2 — Frontend (React / Vite)

Open a **second PowerShell terminal** in VS Code.

```powershell
cd pune-airbnb-agent/frontend

npm install
npm run dev
```

You should see:
```
VITE v5.x  ready in Xms
➜  Local: http://localhost:5173/
```

Open http://localhost:5173 in your browser.

---

## Features

| Tab | What it does |
|-----|-------------|
| **Predict price** | Enter listing details → get predicted price per night |
| **Compare** | See how your listing ranks vs similar ones in Pune |
| **Market** | Full market overview — avg by neighbourhood + room type |
| **Alerts** | Set threshold alerts (e.g. "tell me when Koregaon Park goes above ₹2500") |

---

## Agent Capabilities

- **Prediction** — Linear Regression trained on Pune-specific data (Koregaon Park, Viman Nagar, Baner, Hinjewadi, etc.)
- **Explanation** — Feature contribution bars showing WHY the price was predicted
- **Comparison** — Percentile ranking among similar listings, neighbourhood leaderboard
- **Alerts** — Persistent JSON-based alert system with live trigger detection
- **Retrain** — One-click model retraining from the Market tab

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meta` | Neighbourhoods, room types, model metrics |
| POST | `/predict` | Predict price + feature contributions |
| POST | `/compare` | Compare listing vs market |
| GET | `/market` | Full market overview |
| GET | `/alerts` | Get all alerts (with triggered status) |
| POST | `/alerts` | Create a new alert |
| DELETE | `/alerts/{id}` | Delete an alert |
| POST | `/retrain` | Retrain the model |

---

## Built with

- Python 3.11 · FastAPI · scikit-learn · pandas · numpy · joblib
- React 18 · Vite · Inter + Space Grotesk fonts
- Linear Regression (extended from Minor Project 3)

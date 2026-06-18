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

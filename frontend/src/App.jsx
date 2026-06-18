import { useState, useEffect } from "react";
import PredictTab from "./components/PredictTab";
import CompareTab from "./components/CompareTab";
import MarketTab from "./components/MarketTab";
import AlertsTab from "./components/AlertsTab";

const API = "http://localhost:8000";

const TABS = [
  { id: "predict", label: "Predict price" },
  { id: "explain", label: "Compare" },
  { id: "market", label: "Market" },
  { id: "alerts", label: "Alerts" },
];

export default function App() {
  const [tab, setTab] = useState("predict");
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    fetch(`${API}/meta`)
      .then(r => r.json())
      .then(setMeta)
      .catch(() => {});
  }, []);

  const neighbourhoods = meta?.neighbourhoods ?? [];
  const roomTypes = meta?.room_types ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#F6F8FA" }}>
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #E9ECEF",
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "60px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "8px",
            background: "#1D9E75",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Space Grotesk', sans-serif",
            color: "#fff", fontWeight: 700, fontSize: "15px"
          }}>P</div>
          <div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "15px", lineHeight: 1.2 }}>
              Pune Airbnb Agent
            </p>
            <p style={{ fontSize: "11px", color: "#868E96" }}>Price intelligence · Linear Regression</p>
          </div>
        </div>
        {meta && (
          <div style={{ display: "flex", gap: "8px" }}>
            <span className="badge badge-teal">R² {meta.model_metrics?.r2}</span>
            <span className="badge" style={{ background: "#F1F3F5", color: "#495057" }}>
              MAE ₹{meta.model_metrics?.mae?.toLocaleString()}
            </span>
          </div>
        )}
      </header>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "1.5rem 1rem" }}>
        <div className="tab-bar">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "predict" && <PredictTab neighbourhoods={neighbourhoods} roomTypes={roomTypes} />}
        {tab === "explain" && <CompareTab neighbourhoods={neighbourhoods} roomTypes={roomTypes} />}
        {tab === "market" && <MarketTab />}
        {tab === "alerts" && <AlertsTab neighbourhoods={neighbourhoods} />}
      </main>
    </div>
  );
}

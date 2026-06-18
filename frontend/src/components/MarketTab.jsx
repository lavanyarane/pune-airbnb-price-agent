import { useEffect, useState } from "react";

const API = "http://localhost:8000";

export default function MarketTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retraining, setRetraining] = useState(false);

  const fetchMarket = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/market`);
      setData(await res.json());
    } catch {
      setError("Could not reach the backend. Make sure it is running on port 8000.");
    }
    setLoading(false);
  };

  useEffect(() => { fetchMarket(); }, []);

  const retrain = async () => {
    setRetraining(true);
    try {
      await fetch(`${API}/retrain`, { method: "POST" });
      await fetchMarket();
    } catch {
      setError("Retrain failed.");
    }
    setRetraining(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: "2rem" }}><div className="spinner" /></div>;
  if (error) return <div className="error-msg">{error}</div>;
  if (!data) return null;

  const maxAvg = Math.max(...data.by_neighbourhood.map(n => n.avg));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "1rem" }}>
        {[
          { label: "Market avg", value: `₹${data.overall_avg.toLocaleString()}`, sub: "per night" },
          { label: "Market median", value: `₹${data.overall_median.toLocaleString()}`, sub: "per night" },
          { label: "Total listings", value: data.total_listings.toLocaleString(), sub: "in dataset" },
          { label: "Model R²", value: data.model_r2, sub: `MAE ₹${data.model_mae.toLocaleString()}` },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <p className="section-title" style={{ margin: 0 }}>Avg price by neighbourhood</p>
          <span className="badge badge-teal">Sorted by value</span>
        </div>
        {data.by_neighbourhood.map((n, i) => {
          const pct = Math.round((n.avg / maxAvg) * 100);
          return (
            <div key={n.neighbourhood} className="bar-row">
              <div className="bar-label">{i + 1}. {n.neighbourhood}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="bar-value">₹{Math.round(n.avg).toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <p className="section-title">Avg price by room type</p>
        {data.by_room_type.map(r => {
          const maxRoom = Math.max(...data.by_room_type.map(x => x.avg));
          const pct = Math.round((r.avg / maxRoom) * 100);
          const colors = { "Entire home/apt": "", "Private room": "amber", "Shared room": "coral" };
          return (
            <div key={r.room_type} className="bar-row">
              <div className="bar-label">{r.room_type}</div>
              <div className="bar-track">
                <div className={`bar-fill ${colors[r.room_type] || ""}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="bar-value">₹{Math.round(r.avg).toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button className="btn-outline" onClick={fetchMarket}>Refresh data</button>
        <button className="btn-outline" onClick={retrain} disabled={retraining}>
          {retraining ? "Retraining…" : "Retrain model"}
        </button>
      </div>
    </div>
  );
}

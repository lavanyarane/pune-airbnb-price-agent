import { useState, useEffect } from "react";

const API = "http://localhost:8000";

export default function AlertsTab({ neighbourhoods }) {
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({ neighbourhood: "Koregaon Park", threshold_price: 2500, direction: "above", label: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API}/alerts`);
      setAlerts(await res.json());
    } catch {
      setError("Could not reach the backend.");
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const createAlert = async () => {
    setLoading(true); setError("");
    try {
      await fetch(`${API}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await fetchAlerts();
      setForm(f => ({ ...f, label: "" }));
    } catch {
      setError("Failed to create alert.");
    }
    setLoading(false);
  };

  const deleteAlert = async (id) => {
    await fetch(`${API}/alerts/${id}`, { method: "DELETE" });
    await fetchAlerts();
  };

  const triggered = alerts.filter(a => a.triggered);

  return (
    <div>
      {triggered.length > 0 && (
        <div style={{ background: "#FCEBEB", border: "1px solid #F7C1C1", borderRadius: "var(--radius)", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
          <p style={{ fontWeight: 500, fontSize: "13px", color: "#A32D2D", marginBottom: "6px" }}>
            🔔 {triggered.length} alert{triggered.length > 1 ? "s" : ""} triggered
          </p>
          {triggered.map(a => (
            <p key={a.id} style={{ fontSize: "12px", color: "#791F1F" }}>
              {a.neighbourhood}: avg ₹{a.current_avg?.toLocaleString()} is {a.direction} your threshold of ₹{a.threshold_price.toLocaleString()}
            </p>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <p className="section-title">Create price alert</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "12px" }}>
          <div className="form-group">
            <label>Neighbourhood</label>
            <select value={form.neighbourhood} onChange={e => setForm(f => ({ ...f, neighbourhood: e.target.value }))}>
              {neighbourhoods.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Alert me when avg price is</label>
            <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}>
              <option value="above">Above threshold</option>
              <option value="below">Below threshold</option>
            </select>
          </div>
          <div className="form-group">
            <label>Threshold price (₹/night)</label>
            <input type="number" value={form.threshold_price} min={100} step={100}
              onChange={e => setForm(f => ({ ...f, threshold_price: parseInt(e.target.value) }))} />
          </div>
          <div className="form-group">
            <label>Label (optional)</label>
            <input type="text" value={form.label} placeholder="e.g. KP high season"
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="btn-primary" onClick={createAlert} disabled={loading}>
            {loading ? "Saving…" : "Add alert"}
          </button>
          <button className="btn-outline" onClick={fetchAlerts}>Refresh</button>
        </div>
        {error && <div className="error-msg">{error}</div>}
      </div>

      <div className="card">
        <p className="section-title">Active alerts ({alerts.length})</p>
        {alerts.length === 0 && (
          <p style={{ color: "var(--gray-400)", fontSize: "13px", padding: "0.5rem 0" }}>
            No alerts set yet. Add one above to monitor market prices.
          </p>
        )}
        {alerts.map(a => (
          <div key={a.id} className="alert-item">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className={`pulse ${a.triggered ? "" : "off"}`} />
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500 }}>{a.label}</p>
                <p style={{ fontSize: "12px", color: "var(--gray-400)" }}>
                  {a.neighbourhood} · avg now ₹{a.current_avg?.toLocaleString()} · threshold ₹{a.threshold_price.toLocaleString()} {a.direction}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", align: "center", gap: "8px" }}>
              {a.triggered && <span className="badge badge-coral">Triggered</span>}
              {!a.triggered && <span className="badge" style={{ background: "var(--gray-100)", color: "var(--gray-400)" }}>Watching</span>}
              <button className="btn-danger" onClick={() => deleteAlert(a.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

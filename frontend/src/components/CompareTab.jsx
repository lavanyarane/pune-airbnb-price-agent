import { useState } from "react";
import ListingForm from "./ListingForm";

const API = "http://localhost:8000";

const DEFAULT = {
  neighbourhood: "Viman Nagar",
  room_type: "Private room",
  minimum_nights: 1,
  availability_365: 180,
  number_of_reviews: 20,
  reviews_per_month: 1.2,
};

export default function CompareTab({ neighbourhoods, roomTypes }) {
  const [form, setForm] = useState(DEFAULT);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const compare = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${API}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Could not reach the backend. Make sure it is running on port 8000.");
    }
    setLoading(false);
  };

  const maxNbhAvg = result
    ? Math.max(...result.neighbourhood_ranking.map(n => n.avg_price))
    : 1;

  const getPercentileLabel = (p) => {
    if (p >= 75) return { text: "premium", cls: "badge-coral" };
    if (p >= 40) return { text: "mid-market", cls: "badge-amber" };
    return { text: "budget-friendly", cls: "badge-teal" };
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p className="section-title">Your listing</p>
        <ListingForm values={form} onChange={handleChange} neighbourhoods={neighbourhoods} roomTypes={roomTypes} />
        <div style={{ marginTop: "1rem", display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="btn-primary" onClick={compare} disabled={loading}>
            {loading ? "Comparing…" : "Compare listing"}
          </button>
          {loading && <div className="spinner" />}
        </div>
        {error && <div className="error-msg">{error}</div>}
      </div>

      {result && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "1rem" }}>
            {[
              { label: "Your price", value: `₹${result.your_price.toLocaleString()}`, sub: "predicted" },
              { label: "Similar avg", value: `₹${result.similar_avg.toLocaleString()}`, sub: `${result.similar_listings_count} listings` },
              { label: "Range in area", value: `₹${result.similar_min.toLocaleString()}–${result.similar_max.toLocaleString()}`, sub: "min–max" },
              { label: "Percentile", value: `${result.percentile}th`, sub: getPercentileLabel(result.percentile).text },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: s.label === "Range in area" ? "14px" : "22px", paddingTop: s.label === "Range in area" ? "6px" : 0 }}>
                  {s.value}
                </div>
                <div className="stat-sub">
                  {s.label === "Percentile"
                    ? <span className={`badge ${getPercentileLabel(result.percentile).cls}`}>{s.sub}</span>
                    : s.sub
                  }
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: "1rem" }}>
            <p className="section-title">Neighbourhood price ranking</p>
            {result.neighbourhood_ranking.map((n, i) => {
              const isYours = n.neighbourhood === form.neighbourhood;
              const pct = Math.round((n.avg_price / maxNbhAvg) * 100);
              return (
                <div key={n.neighbourhood} className="bar-row" style={{ fontWeight: isYours ? 500 : 400 }}>
                  <div className="bar-label" style={{ color: isYours ? "var(--teal-dark)" : undefined }}>
                    {i + 1}. {n.neighbourhood}
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill ${isYours ? "" : "amber"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="bar-value">₹{n.avg_price.toLocaleString()}</div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <p className="section-title">Room type comparison</p>
            {result.room_type_comparison.map(r => {
              const isYours = r.room_type === form.room_type;
              const pct = Math.round((r.avg_price / Math.max(...result.room_type_comparison.map(x => x.avg_price))) * 100);
              return (
                <div key={r.room_type} className="bar-row" style={{ fontWeight: isYours ? 500 : 400 }}>
                  <div className="bar-label" style={{ color: isYours ? "var(--teal-dark)" : undefined }}>
                    {r.room_type}
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: isYours ? "var(--teal)" : "var(--gray-400)" }} />
                  </div>
                  <div className="bar-value">₹{r.avg_price.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

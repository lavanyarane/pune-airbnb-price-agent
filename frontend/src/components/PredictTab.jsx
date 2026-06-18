import { useState } from "react";
import ListingForm from "./ListingForm";

const API = "http://localhost:8000";

const DEFAULT = {
  neighbourhood: "Koregaon Park",
  room_type: "Entire home/apt",
  minimum_nights: 2,
  availability_365: 200,
  number_of_reviews: 30,
  reviews_per_month: 1.5,
};

export default function PredictTab({ neighbourhoods, roomTypes }) {
  const [form, setForm] = useState(DEFAULT);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const predict = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${API}/predict`, {
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

  const maxContrib = result
    ? Math.max(...result.feature_contributions.map(c => Math.abs(c.contribution)))
    : 1;

  return (
    <div>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p className="section-title">Listing details</p>
        <ListingForm values={form} onChange={handleChange} neighbourhoods={neighbourhoods} roomTypes={roomTypes} />
        <div style={{ marginTop: "1rem", display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="btn-primary" onClick={predict} disabled={loading}>
            {loading ? "Predicting…" : "Predict price"}
          </button>
          {loading && <div className="spinner" />}
        </div>
        {error && <div className="error-msg">{error}</div>}
      </div>

      {result && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "1rem" }}>
            <div className="stat-card">
              <div className="stat-label">Predicted price</div>
              <div className="stat-value" style={{ color: "var(--teal)" }}>₹{result.predicted_price.toLocaleString()}</div>
              <div className="stat-sub">per night</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Price range</div>
              <div className="stat-value" style={{ fontSize: "16px", paddingTop: "4px" }}>
                ₹{result.price_range.low.toLocaleString()} – ₹{result.price_range.high.toLocaleString()}
              </div>
              <div className="stat-sub">±12% confidence</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Neighbourhood avg</div>
              <div className="stat-value">₹{result.neighbourhood_avg.toLocaleString()}</div>
              <div className="stat-sub">{form.neighbourhood}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Room type avg</div>
              <div className="stat-value">₹{result.room_type_avg.toLocaleString()}</div>
              <div className="stat-sub">{form.room_type}</div>
            </div>
          </div>

          <div className="card">
            <p className="section-title">Why this price? — feature contributions</p>
            <p style={{ fontSize: "12px", color: "var(--gray-400)", marginBottom: "14px" }}>
              Each bar shows how much that feature pushed the price up (teal) or down (coral).
            </p>
            {result.feature_contributions.map(c => {
              const pct = Math.round((Math.abs(c.contribution) / maxContrib) * 100);
              const isPos = c.contribution >= 0;
              return (
                <div key={c.feature} className="bar-row">
                  <div className="bar-label" title={c.feature}>{c.feature}</div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${isPos ? "" : "coral"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="bar-value" style={{ color: isPos ? "var(--teal-dark)" : "var(--coral)" }}>
                    {isPos ? "+" : ""}₹{c.contribution.toLocaleString()}
                  </div>
                </div>
              );
            })}
            <div className="divider" />
            <p style={{ fontSize: "12px", color: "var(--gray-400)" }}>
              Model intercept (base): ₹{result.intercept.toLocaleString()}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

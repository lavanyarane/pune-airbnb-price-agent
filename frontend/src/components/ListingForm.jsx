export default function ListingForm({ values, onChange, neighbourhoods, roomTypes }) {
  const fields = [
    { key: "neighbourhood", label: "Neighbourhood", type: "select", options: neighbourhoods },
    { key: "room_type", label: "Room type", type: "select", options: roomTypes },
    { key: "minimum_nights", label: "Minimum nights", type: "number", min: 1, max: 30 },
    { key: "availability_365", label: "Availability (days/year)", type: "number", min: 1, max: 365 },
    { key: "number_of_reviews", label: "Number of reviews", type: "number", min: 0, max: 500 },
    { key: "reviews_per_month", label: "Reviews per month", type: "number", min: 0, max: 10, step: 0.1 },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
      {fields.map(f => (
        <div className="form-group" key={f.key}>
          <label>{f.label}</label>
          {f.type === "select" ? (
            <select value={values[f.key]} onChange={e => onChange(f.key, e.target.value)}>
              {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type="number"
              value={values[f.key]}
              min={f.min}
              max={f.max}
              step={f.step || 1}
              onChange={e => onChange(f.key, f.step ? parseFloat(e.target.value) : parseInt(e.target.value))}
            />
          )}
        </div>
      ))}
    </div>
  );
}

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error
import joblib
import os
import json
from datetime import datetime
from typing import Optional

app = FastAPI(title="Pune Airbnb Price Intelligence Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_json(obj):
    """Recursively convert numpy/pandas types to native Python types so FastAPI can serialize them."""
    if isinstance(obj, dict):
        return {k: clean_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [clean_json(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.ndarray):
        return clean_json(obj.tolist())
    return obj

# ── Pune synthetic dataset ──────────────────────────────────────────────────
NEIGHBOURHOODS = [
    "Koregaon Park", "Viman Nagar", "Baner", "Hinjewadi",
    "Kothrud", "Shivajinagar", "Kalyani Nagar", "Wakad",
    "Hadapsar", "Deccan Gymkhana"
]

ROOM_TYPES = ["Entire home/apt", "Private room", "Shared room"]

NEIGHBOURHOOD_PREMIUM = {
    "Koregaon Park": 1.45, "Viman Nagar": 1.30, "Kalyani Nagar": 1.35,
    "Deccan Gymkhana": 1.25, "Shivajinagar": 1.20, "Baner": 1.15,
    "Kothrud": 1.10, "Hinjewadi": 1.08, "Wakad": 1.05, "Hadapsar": 1.00
}

ALERTS_FILE = "alerts.json"

def load_alerts():
    if os.path.exists(ALERTS_FILE):
        with open(ALERTS_FILE) as f:
            return json.load(f)
    return []

def save_alerts(alerts):
    with open(ALERTS_FILE, "w") as f:
        json.dump(alerts, f)

def generate_pune_dataset(n=800):
    np.random.seed(42)
    records = []
    for _ in range(n):
        nbh = np.random.choice(NEIGHBOURHOODS)
        room = np.random.choice(ROOM_TYPES, p=[0.5, 0.38, 0.12])
        min_nights = np.random.choice([1, 2, 3, 5, 7], p=[0.4, 0.25, 0.15, 0.1, 0.1])
        availability = np.random.randint(30, 365)
        reviews = np.random.randint(0, 120)
        reviews_per_month = round(np.random.uniform(0.1, 4.5), 2)

        base = 1800
        premium = NEIGHBOURHOOD_PREMIUM[nbh]
        room_factor = {"Entire home/apt": 1.0, "Private room": 0.55, "Shared room": 0.30}[room]
        nights_factor = max(0.85, 1 - (min_nights - 1) * 0.03)
        avail_factor = 0.9 + (availability / 365) * 0.2
        review_factor = 0.95 + min(reviews / 200, 0.15)
        noise = np.random.normal(0, 150)

        price = base * premium * room_factor * nights_factor * avail_factor * review_factor + noise
        price = max(500, round(price))

        records.append({
            "neighbourhood": nbh,
            "room_type": room,
            "minimum_nights": min_nights,
            "availability_365": availability,
            "number_of_reviews": reviews,
            "reviews_per_month": reviews_per_month,
            "price": price
        })
    return pd.DataFrame(records)

# ── Model training ──────────────────────────────────────────────────────────
MODEL_FILE = "pune_model.joblib"
META_FILE  = "pune_meta.joblib"

def train_model():
    df = generate_pune_dataset()

    le_nbh  = LabelEncoder().fit(NEIGHBOURHOODS)
    le_room = LabelEncoder().fit(ROOM_TYPES)

    df["nbh_enc"]  = le_nbh.transform(df["neighbourhood"])
    df["room_enc"] = le_room.transform(df["room_type"])

    features = ["nbh_enc", "room_enc", "minimum_nights", "availability_365",
                "number_of_reviews", "reviews_per_month"]
    X = df[features].values
    y = df["price"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = LinearRegression()
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    metrics = {
        "r2": round(float(r2_score(y_test, y_pred)), 4),
        "mae": round(float(mean_absolute_error(y_test, y_pred)), 2),
        "trained_at": datetime.now().isoformat()
    }

    feature_names = ["Neighbourhood", "Room type", "Minimum nights",
                     "Availability (days)", "Number of reviews", "Reviews/month"]
    coefficients = dict(zip(feature_names, model.coef_.tolist()))

    meta = {
        "le_nbh": le_nbh,
        "le_room": le_room,
        "features": features,
        "feature_names": feature_names,
        "coefficients": coefficients,
        "metrics": metrics,
        "df": df
    }

    joblib.dump(model, MODEL_FILE)
    joblib.dump(meta, META_FILE)
    return model, meta

if os.path.exists(MODEL_FILE) and os.path.exists(META_FILE):
    model = joblib.load(MODEL_FILE)
    meta  = joblib.load(META_FILE)
else:
    model, meta = train_model()

# ── Schemas ─────────────────────────────────────────────────────────────────
class ListingInput(BaseModel):
    neighbourhood: str
    room_type: str
    minimum_nights: int
    availability_365: int
    number_of_reviews: int
    reviews_per_month: float

class AlertInput(BaseModel):
    neighbourhood: str
    threshold_price: float
    direction: str  # "above" or "below"
    label: Optional[str] = ""

# ── Helpers ─────────────────────────────────────────────────────────────────
def encode_and_predict(listing: ListingInput):
    le_nbh  = meta["le_nbh"]
    le_room = meta["le_room"]

    if listing.neighbourhood not in le_nbh.classes_:
        raise HTTPException(400, f"Unknown neighbourhood: {listing.neighbourhood}")
    if listing.room_type not in le_room.classes_:
        raise HTTPException(400, f"Unknown room type: {listing.room_type}")

    x = np.array([[
        le_nbh.transform([listing.neighbourhood])[0],
        le_room.transform([listing.room_type])[0],
        listing.minimum_nights,
        listing.availability_365,
        listing.number_of_reviews,
        listing.reviews_per_month
    ]])
    return float(model.predict(x)[0])

# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "Pune Airbnb Price Intelligence Agent running"}

@app.get("/meta")
def get_meta():
    return clean_json({
        "neighbourhoods": NEIGHBOURHOODS,
        "room_types": ROOM_TYPES,
        "model_metrics": meta["metrics"]
    })

@app.post("/predict")
def predict(listing: ListingInput):
    price = encode_and_predict(listing)
    price = max(500, round(price))

    coeff = meta["coefficients"]
    feature_names = meta["feature_names"]
    raw_values = [
        meta["le_nbh"].transform([listing.neighbourhood])[0],
        meta["le_room"].transform([listing.room_type])[0],
        listing.minimum_nights,
        listing.availability_365,
        listing.number_of_reviews,
        listing.reviews_per_month
    ]

    contributions = []
    for name, coef, val in zip(feature_names, meta["coefficients"].values(), raw_values):
        contribution = round(coef * val)
        contributions.append({
            "feature": name,
            "coefficient": round(coef, 2),
            "value": round(val, 2),
            "contribution": contribution
        })

    contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)

    neighbourhood_avg = meta["df"][
        meta["df"]["neighbourhood"] == listing.neighbourhood
    ]["price"].mean()
    room_avg = meta["df"][
        meta["df"]["room_type"] == listing.room_type
    ]["price"].mean()

    return clean_json({
        "predicted_price": price,
        "price_range": {"low": round(price * 0.88), "high": round(price * 1.12)},
        "feature_contributions": contributions,
        "neighbourhood_avg": round(neighbourhood_avg),
        "room_type_avg": round(room_avg),
        "intercept": round(model.intercept_)
    })

@app.post("/compare")
def compare(listing: ListingInput):
    my_price = max(500, round(encode_and_predict(listing)))
    df = meta["df"]

    similar = df[
        (df["neighbourhood"] == listing.neighbourhood) &
        (df["room_type"] == listing.room_type)
    ]

    if len(similar) < 3:
        similar = df[df["neighbourhood"] == listing.neighbourhood]

    percentile = round((similar["price"] < my_price).mean() * 100)

    top_by_nbh = []
    for nbh in NEIGHBOURHOODS:
        avg = df[df["neighbourhood"] == nbh]["price"].mean()
        top_by_nbh.append({"neighbourhood": nbh, "avg_price": round(avg)})
    top_by_nbh.sort(key=lambda x: x["avg_price"], reverse=True)

    room_comparison = []
    for rt in ROOM_TYPES:
        avg = df[df["room_type"] == rt]["price"].mean()
        room_comparison.append({"room_type": rt, "avg_price": round(avg)})

    return clean_json({
        "your_price": my_price,
        "similar_listings_count": len(similar),
        "similar_avg": round(similar["price"].mean()),
        "similar_min": round(similar["price"].min()),
        "similar_max": round(similar["price"].max()),
        "percentile": percentile,
        "neighbourhood_ranking": top_by_nbh,
        "room_type_comparison": room_comparison
    })

@app.get("/market")
def market_overview():
    df = meta["df"]
    overall_avg = round(df["price"].mean())
    overall_median = round(df["price"].median())

    by_nbh = df.groupby("neighbourhood")["price"].agg(["mean","min","max","count"]).reset_index()
    by_nbh.columns = ["neighbourhood","avg","min","max","count"]
    by_nbh = by_nbh.sort_values("avg", ascending=False)

    by_room = df.groupby("room_type")["price"].mean().reset_index()
    by_room.columns = ["room_type","avg"]

    return clean_json({
        "overall_avg": overall_avg,
        "overall_median": overall_median,
        "total_listings": len(df),
        "by_neighbourhood": by_nbh.round(0).to_dict("records"),
        "by_room_type": by_room.round(0).to_dict("records"),
        "model_r2": meta["metrics"]["r2"],
        "model_mae": meta["metrics"]["mae"]
    })

@app.get("/alerts")
def get_alerts():
    alerts = load_alerts()
    df = meta["df"]
    triggered = []
    for alert in alerts:
        nbh_avg = round(df[df["neighbourhood"] == alert["neighbourhood"]]["price"].mean())
        is_triggered = (
            (alert["direction"] == "above" and nbh_avg > alert["threshold_price"]) or
            (alert["direction"] == "below" and nbh_avg < alert["threshold_price"])
        )
        triggered.append({**alert, "current_avg": nbh_avg, "triggered": is_triggered})
    return clean_json(triggered)

@app.post("/alerts")
def create_alert(alert: AlertInput):
    alerts = load_alerts()
    new_alert = {
        "id": len(alerts) + 1,
        "neighbourhood": alert.neighbourhood,
        "threshold_price": alert.threshold_price,
        "direction": alert.direction,
        "label": alert.label or f"{alert.neighbourhood} {alert.direction} ₹{alert.threshold_price}",
        "created_at": datetime.now().isoformat()
    }
    alerts.append(new_alert)
    save_alerts(alerts)
    return new_alert

@app.delete("/alerts/{alert_id}")
def delete_alert(alert_id: int):
    alerts = load_alerts()
    alerts = [a for a in alerts if a["id"] != alert_id]
    save_alerts(alerts)
    return {"deleted": alert_id}

@app.post("/retrain")
def retrain():
    global model, meta
    model, meta = train_model()
    return {"status": "retrained", "metrics": meta["metrics"]}

# CanopyNet FastAPI Optimization Backend

High-performance Python REST API implementing spatial micro-forest optimization, 0/1 Knapsack dynamic programming, and minimum spanning tree wildlife corridor routing.

---

## 🚀 Quick Start

### 1. Activate Environment & Install Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Start the FastAPI Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

The API will be available at `http://localhost:8001`.

---

## 📚 Interactive Swagger UI Documentation
Open your browser and navigate to:
👉 **[http://localhost:8001/docs](http://localhost:8001/docs)**

---

## 🛠️ REST Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Service health status and links |
| `GET` | `/api/health` | Active algorithms & probe verification |
| `POST` | `/api/generate-city` | Procedural grid generator for a given seed |
| `POST` | `/api/optimize` | Runs the full 3-stage optimization pipeline |
| `GET` | `/api/species` | Botanical 12-species matrix across 4 canopy layers |
| `POST` | `/api/knapsack/{sapling_budget}` | Standalone 0/1 knapsack dynamic programming allocator |

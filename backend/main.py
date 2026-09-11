import os
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.models import (
    OptimizeRequest,
    OptimizeResponse,
    GridModel,
    ParamsModel,
)
from backend.algorithms import (
    generate_city,
    run_pipeline,
    allocate_species,
    SPECIES_LIST,
)

app = FastAPI(
    title="CanopyNet Optimization API",
    description="REST API for graph-based micro-forest site selection, multi-layer species allocation, and wildlife corridor connectivity.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for React frontend (Vite default: http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def root():
    """Root status indicator and Swagger UI link."""
    return {
        "status": "online",
        "service": "CanopyNet FastAPI Optimization Service",
        "docs": "/docs",
        "version": "1.0.0",
        "timestamp": time.time(),
    }


@app.get("/api/health", tags=["Health"])
def health():
    """Health check endpoint for frontend connection probes."""
    return {
        "status": "healthy",
        "engine": "Python FastAPI",
        "algorithms": [
            "BFS Flood Fill (4x4 Tiling)",
            "Budgeted Greedy Set Cover (300m Radius)",
            "0/1 Knapsack Dynamic Programming",
            "Multi-Source Dijkstra (Binary MinHeap)",
            "Kruskal's MST (Union-Find)",
            "Prim's O(V^2) Cross-Check",
            "Union-Find Wildlife Dispersal",
        ],
    }


@app.post("/api/generate-city", response_model=GridModel, tags=["City"])
def api_generate_city(params: ParamsModel):
    """Generates a procedural synthetic city grid for the given random seed."""
    try:
        grid = generate_city(params.seed, params.width, params.height)
        return grid
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/optimize", response_model=OptimizeResponse, tags=["Optimization"])
def api_optimize(req: OptimizeRequest):
    """
    Runs the complete 3-stage optimization pipeline:
    1. Where to plant: BFS vacant plot detection & budgeted greedy set cover
    2. What to plant: 0/1 Knapsack Dynamic Programming across 4 canopy layers
    3. How to connect: Dijkstra shortest paths, Kruskal's MST, and Union-Find dispersal check
    """
    try:
        if req.customGrid:
            grid = {
                "width": req.customGrid.width,
                "height": req.customGrid.height,
                "land": req.customGrid.land,
                "population": req.customGrid.population,
            }
        else:
            grid = generate_city(
                req.params.seed, req.params.width, req.params.height
            )

        params_dict = {
            "seed": req.params.seed,
            "budgetLakh": req.params.budgetLakh,
            "radiusM": req.params.radiusM,
            "travelLimitM": req.params.travelLimitM,
            "density": req.params.density,
            "width": req.params.width,
            "height": req.params.height,
        }

        result = run_pipeline(grid, params_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@app.get("/api/species", tags=["Botanical"])
def get_species():
    """Returns the matrix of 12 native species across 4 vertical canopy layers."""
    return {"species": SPECIES_LIST}


@app.post("/api/knapsack/{sapling_budget}", tags=["Botanical"])
def run_knapsack_only(sapling_budget: int):
    """Runs 0/1 Knapsack DP allocation for an arbitrary sapling budget."""
    try:
        return allocate_species(sapling_budget)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

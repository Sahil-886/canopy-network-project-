from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class GridModel(BaseModel):
    width: int = Field(..., ge=16, le=100)
    height: int = Field(..., ge=16, le=100)
    land: List[int]
    population: List[int]


class ParamsModel(BaseModel):
    seed: int = 42
    budgetLakh: int = 40
    radiusM: int = 300
    travelLimitM: int = 1200
    density: float = 3.0
    width: int = 64
    height: int = 64


class OptimizeRequest(BaseModel):
    params: ParamsModel
    customGrid: Optional[GridModel] = None


class PlotModel(BaseModel):
    id: int
    cells: List[int]
    areaM2: float
    cost: float
    cx: float
    cy: float
    saplingBudget: int
    coveredHomes: List[int]


class EdgeModel(BaseModel):
    from_plot: int = Field(..., alias="from")
    to_plot: int = Field(..., alias="to")
    cost: float
    path: List[int]
    lengthM: float
    roadCrossings: int
    viable: bool

    class Config:
        populate_by_name = True


class PickRecordModel(BaseModel):
    plotId: int
    newlyCoveredResidents: int
    cost: float
    ratio: float
    cumResidents: int
    cumCost: float


class MetricsModel(BaseModel):
    totalPopulation: int
    coveredBefore: int
    coveredAfter: int
    coveragePctBefore: float
    coveragePctAfter: float
    plotsSelected: int
    plantedAreaM2: float
    totalCost: float
    budgetLakh: int
    greenCoverPctBefore: float
    greenCoverPctAfter: float
    totalSaplings: int
    totalBiodiversity: int
    speciesCount: int
    layersCovered: int
    mstCost: float
    corridorLengthBeforeM: float
    corridorLengthAfterM: float
    roadCellsCrossed: int
    waterCellsCrossed: int
    groupsCount: int


class OptimizeResponse(BaseModel):
    grid: GridModel
    plots: List[PlotModel]
    selectedPlots: List[PlotModel]
    picks: List[PickRecordModel]
    allocations: Dict[str, Any]
    mstEdges: List[EdgeModel]
    groups: List[List[int]]
    metrics: MetricsModel
    timingsMs: Dict[str, float]
    primTotalCost: float

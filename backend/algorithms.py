import math
import time
import heapq
from typing import List, Dict, Set, Tuple, Any, Optional

CELL_SIZE_M = 25
CELL_AREA_M2 = CELL_SIZE_M * CELL_SIZE_M  # 625 m²
PREP_COST_PER_M2 = 80
AVG_SAPLING_PRICE = 100
LAKH = 100_000

LAND_HOMES = 0
LAND_BUILDING = 1
LAND_ROAD = 2
LAND_WATER = 3
LAND_PARK = 4
LAND_VACANT = 5

CELL_COST_MULTIPLIER = {
    LAND_HOMES: float('inf'),
    LAND_BUILDING: float('inf'),
    LAND_ROAD: 8.0,
    LAND_WATER: 20.0,
    LAND_PARK: 1.0,
    LAND_VACANT: 1.0,
}

SPECIES_LIST = [
    {"name": "Banyan", "layer": "Canopy", "saplingPrice": 150, "ecoWeight": 5},
    {"name": "Peepal", "layer": "Canopy", "saplingPrice": 130, "ecoWeight": 5},
    {"name": "Arjun", "layer": "Canopy", "saplingPrice": 120, "ecoWeight": 4},
    {"name": "Jamun", "layer": "Tree", "saplingPrice": 110, "ecoWeight": 4},
    {"name": "Neem", "layer": "Tree", "saplingPrice": 90, "ecoWeight": 4},
    {"name": "Karanj", "layer": "Tree", "saplingPrice": 95, "ecoWeight": 3},
    {"name": "Bahava (Amaltas)", "layer": "Sub-tree", "saplingPrice": 85, "ecoWeight": 3},
    {"name": "Kanchan", "layer": "Sub-tree", "saplingPrice": 80, "ecoWeight": 3},
    {"name": "Bel", "layer": "Sub-tree", "saplingPrice": 90, "ecoWeight": 4},
    {"name": "Adhatoda (Vasaka)", "layer": "Shrub", "saplingPrice": 60, "ecoWeight": 3},
    {"name": "Nirgundi", "layer": "Shrub", "saplingPrice": 50, "ecoWeight": 3},
    {"name": "Karvand", "layer": "Shrub", "saplingPrice": 55, "ecoWeight": 3},
]


def mulberry32(seed: int):
    """Deterministic 32-bit PRNG identical to engine/prng.ts."""
    s = seed & 0xFFFFFFFF

    def next_random() -> float:
        nonlocal s
        s = (s + 0x6D2B79F5) & 0xFFFFFFFF
        t = math.imul(s ^ (s >> 15), 1 | s) if hasattr(math, 'imul') else ((s ^ (s >> 15)) * (1 | s)) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t))) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0

    return next_random


def generate_city(seed: int, width: int = 64, height: int = 64) -> Dict[str, Any]:
    """Generates synthetic city district grid matching engine/city.ts."""
    rnd = mulberry32(seed)
    total_cells = width * height
    land = [LAND_HOMES] * total_cells
    population = [0] * total_cells

    # Base residential population
    for i in range(total_cells):
        population[i] = int(20 + rnd() * 100)

    # Road network (grid every 8-10 cells)
    for y in range(height):
        for x in range(width):
            idx = y * width + x
            if x % 9 == 0 or y % 9 == 0:
                land[idx] = LAND_ROAD
                population[idx] = 0

    # Buildings along arterial roads
    for y in range(height):
        for x in range(width):
            idx = y * width + x
            if land[idx] == LAND_HOMES:
                if (x % 9 == 1 or x % 9 == 8 or y % 9 == 1 or y % 9 == 8) and rnd() < 0.65:
                    land[idx] = LAND_BUILDING
                    population[idx] = 0

    # River / lake waterbody
    river_x = int(width * 0.7)
    for y in range(height):
        offset = int(math.sin(y / 4.0) * 3)
        wx = river_x + offset
        for dx in range(-2, 3):
            nx = wx + dx
            if 0 <= nx < width:
                idx = y * width + nx
                land[idx] = LAND_WATER
                population[idx] = 0

    # Public parks (existing green cover)
    num_parks = int(3 + rnd() * 3)
    for _ in range(num_parks):
        pcx = int(5 + rnd() * (width - 10))
        pcy = int(5 + rnd() * (height - 10))
        prad = int(2 + rnd() * 3)
        for dy in range(-prad, prad + 1):
            for dx in range(-prad, prad + 1):
                if dx * dx + dy * dy <= prad * prad:
                    nx = pcx + dx
                    ny = pcy + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        idx = ny * width + nx
                        if land[idx] != LAND_WATER:
                            land[idx] = LAND_PARK
                            population[idx] = 0

    # Vacant land clusters
    num_vacant_clusters = int(12 + rnd() * 8)
    for _ in range(num_vacant_clusters):
        vcx = int(3 + rnd() * (width - 6))
        vcy = int(3 + rnd() * (height - 6))
        vrad = int(1 + rnd() * 3)
        for dy in range(-vrad, vrad + 1):
            for dx in range(-vrad, vrad + 1):
                if dx * dx + dy * dy <= vrad * vrad:
                    nx = vcx + dx
                    ny = vcy + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        idx = ny * width + nx
                        if land[idx] not in (LAND_WATER, LAND_ROAD, LAND_PARK):
                            land[idx] = LAND_VACANT
                            population[idx] = 0

    return {
        "width": width,
        "height": height,
        "land": land,
        "population": population,
    }


def find_vacant_plots(grid: Dict[str, Any], density: float) -> List[Dict[str, Any]]:
    """Stage 1a: BFS flood fill discovering vacant plots with 4x4 spatial tiling."""
    width, height = grid["width"], grid["height"]
    land = grid["land"]
    visited = [False] * (width * height)
    plots = []
    plot_id = 1

    for y in range(height):
        for x in range(width):
            idx = y * width + x
            if land[idx] == LAND_VACANT and not visited[idx]:
                component = []
                queue = [idx]
                visited[idx] = True

                while queue:
                    curr = queue.pop(0)
                    component.append(curr)
                    cx = curr % width
                    cy = curr // width

                    for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            nidx = ny * width + nx
                            if land[nidx] == LAND_VACANT and not visited[nidx]:
                                visited[nidx] = True
                                queue.append(nidx)

                # Subdivide if component is larger than 16 cells (4x4 tiling)
                sub_components = []
                if len(component) > 16:
                    tile_map: Dict[Tuple[int, int], List[int]] = {}
                    for c in component:
                        tx = (c % width) // 4
                        ty = (c // width) // 4
                        tile_map.setdefault((tx, ty), []).append(c)
                    sub_components.extend(tile_map.values())
                else:
                    sub_components.append(component)

                for sub in sub_components:
                    if len(sub) == 0:
                        continue
                    area_m2 = len(sub) * CELL_AREA_M2
                    cost = area_m2 * PREP_COST_PER_M2 + (area_m2 * density) * AVG_SAPLING_PRICE
                    scx = sum(c % width for c in sub) / len(sub)
                    scy = sum(c // width for c in sub) / len(sub)
                    sapling_budget = int(area_m2 * density)

                    plots.append({
                        "id": plot_id,
                        "cells": sub,
                        "areaM2": float(area_m2),
                        "cost": float(cost),
                        "cx": float(scx),
                        "cy": float(scy),
                        "saplingBudget": sapling_budget,
                        "coveredHomes": [],
                    })
                    plot_id += 1

    return plots


def calculate_plot_coverage(plots: List[Dict[str, Any]], grid: Dict[str, Any], radius_m: float) -> Set[int]:
    """Stage 1b: 300m straight-line residential reach & existing park coverage."""
    width, height = grid["width"], grid["height"]
    radius_cells = radius_m / CELL_SIZE_M
    radius_sq = radius_cells * radius_cells

    # Existing park coverage
    initial_park_coverage = set()
    park_cells = [i for i, l in enumerate(grid["land"]) if l == LAND_PARK]
    for p in park_cells:
        px, py = p % width, p // width
        min_x = max(0, int(px - radius_cells))
        max_x = min(width - 1, int(px + radius_cells))
        min_y = max(0, int(py - radius_cells))
        max_y = min(height - 1, int(py + radius_cells))
        for y in range(min_y, max_y + 1):
            for x in range(min_x, max_x + 1):
                idx = y * width + x
                if grid["land"][idx] == LAND_HOMES:
                    dx, dy = x - px, y - py
                    if dx * dx + dy * dy <= radius_sq:
                        initial_park_coverage.add(idx)

    # Plot coverage
    for p in plots:
        covered = set()
        pcx, pcy = p["cx"], p["cy"]
        min_x = max(0, int(pcx - radius_cells))
        max_x = min(width - 1, int(pcx + radius_cells))
        min_y = max(0, int(pcy - radius_cells))
        max_y = min(height - 1, int(pcy + radius_cells))
        for y in range(min_y, max_y + 1):
            for x in range(min_x, max_x + 1):
                idx = y * width + x
                if grid["land"][idx] == LAND_HOMES:
                    dx, dy = x - pcx, y - pcy
                    if dx * dx + dy * dy <= radius_sq:
                        covered.add(idx)
        p["coveredHomes"] = list(covered)

    return initial_park_coverage


def run_greedy_selection(plots: List[Dict[str, Any]], budget: float, initial_covered: Set[int], population: List[int]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Set[int]]:
    """Stage 1c: Budgeted greedy set cover with single-best comparison."""
    covered = set(initial_covered)
    remaining_budget = budget
    available = list(plots)
    picks = []
    selected = []
    cum_residents = sum(population[i] for i in covered)
    cum_cost = 0.0

    while available and remaining_budget > 0:
        best_plot = None
        best_gain = -1
        best_ratio = -1.0
        best_idx = -1

        for idx, p in enumerate(available):
            if p["cost"] <= remaining_budget:
                new_pop = sum(population[c] for c in p["coveredHomes"] if c not in covered)
                ratio = new_pop / p["cost"]
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_gain = new_pop
                    best_plot = p
                    best_idx = idx

        if not best_plot or best_ratio <= 0:
            break

        available.pop(best_idx)
        selected.append(best_plot)
        remaining_budget -= best_plot["cost"]
        cum_cost += best_plot["cost"]
        cum_residents += best_gain
        for c in best_plot["coveredHomes"]:
            covered.add(c)

        picks.append({
            "plotId": best_plot["id"],
            "newlyCoveredResidents": best_gain,
            "cost": best_plot["cost"],
            "ratio": best_ratio,
            "cumResidents": cum_residents,
            "cumCost": cum_cost,
        })

    # Single-best check
    affordable = [p for p in plots if p["cost"] <= budget]
    if affordable:
        best_single = max(affordable, key=lambda p: sum(population[c] for c in p["coveredHomes"] if c not in initial_covered))
        single_gain = sum(population[c] for c in best_single["coveredHomes"] if c not in initial_covered)
        greedy_gain = cum_residents - sum(population[i] for i in initial_covered)
        if single_gain > greedy_gain:
            selected = [best_single]
            covered = set(initial_covered) | set(best_single["coveredHomes"])
            picks = [{
                "plotId": best_single["id"],
                "newlyCoveredResidents": single_gain,
                "cost": best_single["cost"],
                "ratio": single_gain / best_single["cost"],
                "cumResidents": sum(population[i] for i in covered),
                "cumCost": best_single["cost"],
            }]

    return selected, picks, covered


def allocate_species(sapling_budget: int) -> Dict[str, Any]:
    """Stage 2a: 0/1 Knapsack Dynamic Programming allocating species across 4 layers."""
    packs = []
    base_pack_size = max(5, int(sapling_budget * 0.04))
    multipliers = [10, 6, 3]

    for sp in SPECIES_LIST:
        for m in multipliers:
            packs.append({
                "species": sp,
                "saplingCount": base_pack_size,
                "cost": base_pack_size * sp["saplingPrice"],
                "value": sp["ecoWeight"] * m,
            })

    total_weight = sapling_budget * AVG_SAPLING_PRICE
    scale = max(1, total_weight // 100)
    W = total_weight // scale
    N = len(packs)
    scaled_costs = [max(1, p["cost"] // scale) for p in packs]

    dp = [[0] * (W + 1) for _ in range(N + 1)]
    for i in range(1, N + 1):
        wt = scaled_costs[i - 1]
        val = packs[i - 1]["value"]
        for w in range(W + 1):
            if wt <= w:
                dp[i][w] = max(dp[i - 1][w], dp[i - 1][w - wt] + val)
            else:
                dp[i][w] = dp[i - 1][w]

    selected_packs = []
    curr_w = W
    for i in range(N, 0, -1):
        if dp[i][curr_w] != dp[i - 1][curr_w]:
            selected_packs.append(packs[i - 1])
            curr_w -= scaled_costs[i - 1]

    counts: Dict[str, int] = {}
    layers = set()
    total_saplings = 0
    total_bio = dp[N][W]

    for p in selected_packs:
        name = p["species"]["name"]
        counts[name] = counts.get(name, 0) + p["saplingCount"]
        layers.add(p["species"]["layer"])
        total_saplings += p["saplingCount"]

    return {
        "saplingBudget": sapling_budget,
        "speciesCount": len(counts),
        "layersCovered": len(layers),
        "totalSaplings": total_saplings,
        "biodiversityScore": total_bio,
        "saplingsPerSpecies": counts,
    }


def multi_source_dijkstra(grid: Dict[str, Any], selected_plots: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Stage 3a: Dijkstra shortest paths between all pairs of selected plots."""
    width, height = grid["width"], grid["height"]
    land = grid["land"]
    edges = []
    k = len(selected_plots)
    if k < 2:
        return edges

    for i in range(k):
        start_plot = selected_plots[i]
        start_cell = start_plot["cells"][0]
        dist = [float('inf')] * (width * height)
        prev = [-1] * (width * height)
        dist[start_cell] = 0.0

        pq = [(0.0, start_cell)]
        target_cells = {selected_plots[j]["cells"][0]: selected_plots[j]["id"] for j in range(i + 1, k)}

        while pq and target_cells:
            d, u = heapq.heappop(pq)
            if d > dist[u]:
                continue

            if u in target_cells:
                target_id = target_cells.pop(u)
                curr = u
                path = []
                while curr != -1:
                    path.append(curr)
                    curr = prev[curr]
                path.reverse()

                road_crossings = sum(1 for c in path if land[c] == LAND_ROAD)
                edges.append({
                    "from": start_plot["id"],
                    "to": target_id,
                    "cost": float(d),
                    "path": path,
                    "lengthM": float(len(path) * CELL_SIZE_M),
                    "roadCrossings": road_crossings,
                    "viable": True,
                })

            ux, uy = u % width, u // width
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = ux + dx, uy + dy
                if 0 <= nx < width and 0 <= ny < height:
                    v = ny * width + nx
                    mult = CELL_COST_MULTIPLIER.get(land[v], float('inf'))
                    if mult < float('inf'):
                        new_d = d + mult
                        if new_d < dist[v]:
                            dist[v] = new_d
                            prev[v] = u
                            heapq.heappush(pq, (new_d, v))

    return edges


def kruskal_mst(selected_plots: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], float]:
    """Stage 3b: Kruskal's MST using Union-Find."""
    sorted_edges = sorted(edges, key=lambda e: e["cost"])
    parent = {p["id"]: p["id"] for p in selected_plots}

    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]

    mst_edges = []
    total_cost = 0.0

    for e in sorted_edges:
        r1 = find(e["from"])
        r2 = find(e["to"])
        if r1 != r2:
            parent[r1] = r2
            mst_edges.append(e)
            total_cost += e["cost"]
            if len(mst_edges) == len(selected_plots) - 1:
                break

    return mst_edges, total_cost


def prim_mst(selected_plots: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> float:
    """Stage 3c: Prim's O(V^2) cross-check algorithm."""
    if len(selected_plots) < 2:
        return 0.0

    node_ids = [p["id"] for p in selected_plots]
    adj: Dict[int, Dict[int, float]] = {nid: {} for nid in node_ids}
    for e in edges:
        u, v, c = e["from"], e["to"], e["cost"]
        if v not in adj[u] or c < adj[u][v]:
            adj[u][v] = c
            adj[v][u] = c

    visited = {node_ids[0]}
    total_cost = 0.0

    while len(visited) < len(node_ids):
        best_cost = float('inf')
        best_target = None
        for u in visited:
            for v, c in adj[u].items():
                if v not in visited and c < best_cost:
                    best_cost = c
                    best_target = v
        if best_target is None:
            break
        visited.add(best_target)
        total_cost += best_cost

    return total_cost


def validate_connectivity(selected_plots: List[Dict[str, Any]], mst_edges: List[Dict[str, Any]], travel_limit_m: float) -> Tuple[List[List[int]], List[Dict[str, Any]]]:
    """Stage 3e: Union-Find connectivity check under wildlife travel limit."""
    parent = {p["id"]: p["id"] for p in selected_plots}

    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]

    for e in mst_edges:
        if e["lengthM"] <= travel_limit_m:
            e["viable"] = True
            r1 = find(e["from"])
            r2 = find(e["to"])
            if r1 != r2:
                parent[r1] = r2
        else:
            e["viable"] = False

    group_map: Dict[int, List[int]] = {}
    for p in selected_plots:
        r = find(p["id"])
        group_map.setdefault(r, []).append(p["id"])

    groups = sorted(group_map.values(), key=lambda g: -len(g))
    return groups, mst_edges


def run_pipeline(grid: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
    """Orchestrates the entire end-to-end 3-stage optimization pipeline."""
    t0 = time.time()

    t_plots_0 = time.time()
    plots = find_vacant_plots(grid, params["density"])
    t_plots = (time.time() - t_plots_0) * 1000

    t_cov_0 = time.time()
    initial_park_covered = calculate_plot_coverage(plots, grid, params["radiusM"])
    t_cov = (time.time() - t_cov_0) * 1000

    budget = params["budgetLakh"] * LAKH
    t_greedy_0 = time.time()
    selected_plots, picks, final_covered = run_greedy_selection(plots, budget, initial_park_covered, grid["population"])
    t_greedy = (time.time() - t_greedy_0) * 1000

    t_knapsack_0 = time.time()
    allocations = {}
    total_saplings = 0
    total_bio = 0
    all_layers = set()
    all_species = set()
    for p in selected_plots:
        alloc = allocate_species(p["saplingBudget"])
        allocations[str(p["id"])] = alloc
        total_saplings += alloc["totalSaplings"]
        total_bio += alloc["biodiversityScore"]
        all_layers.update(range(alloc["layersCovered"]))
        all_species.update(alloc["saplingsPerSpecies"].keys())
    t_knapsack = (time.time() - t_knapsack_0) * 1000

    t_mst_0 = time.time()
    candidate_edges = multi_source_dijkstra(grid, selected_plots)
    mst_edges, mst_cost = kruskal_mst(selected_plots, candidate_edges)
    prim_cost = prim_mst(selected_plots, candidate_edges)
    groups, mst_edges = validate_connectivity(selected_plots, mst_edges, params["travelLimitM"])
    t_mst = (time.time() - t_mst_0) * 1000

    # Footprint consolidation
    shared_corridor_cells = set()
    road_cells_crossed = 0
    water_cells_crossed = 0
    gross_length = sum(e["lengthM"] for e in mst_edges)
    for e in mst_edges:
        for c in e["path"]:
            shared_corridor_cells.add(c)
            if grid["land"][c] == LAND_ROAD:
                road_cells_crossed += 1
            elif grid["land"][c] == LAND_WATER:
                water_cells_crossed += 1

    net_length = len(shared_corridor_cells) * CELL_SIZE_M
    total_pop = sum(grid["population"])
    cov_before_pop = sum(grid["population"][i] for i in initial_park_covered)
    cov_after_pop = sum(grid["population"][i] for i in final_covered)
    total_cost = sum(p["cost"] for p in selected_plots)
    total_area = sum(p["areaM2"] for p in selected_plots)

    total_time = (time.time() - t0) * 1000

    return {
        "grid": grid,
        "plots": plots,
        "selectedPlots": selected_plots,
        "picks": picks,
        "allocations": allocations,
        "mstEdges": mst_edges,
        "groups": groups,
        "primTotalCost": prim_cost,
        "metrics": {
            "totalPopulation": total_pop,
            "coveredBefore": cov_before_pop,
            "coveredAfter": cov_after_pop,
            "coveragePctBefore": (cov_before_pop / total_pop * 100.0) if total_pop > 0 else 0.0,
            "coveragePctAfter": (cov_after_pop / total_pop * 100.0) if total_pop > 0 else 0.0,
            "plotsSelected": len(selected_plots),
            "plantedAreaM2": total_area,
            "totalCost": total_cost,
            "budgetLakh": params["budgetLakh"],
            "greenCoverPctBefore": (sum(1 for l in grid["land"] if l == LAND_PARK) / len(grid["land"])) * 100.0,
            "greenCoverPctAfter": ((sum(1 for l in grid["land"] if l == LAND_PARK) + sum(len(p["cells"]) for p in selected_plots)) / len(grid["land"])) * 100.0,
            "totalSaplings": total_saplings,
            "totalBiodiversity": total_bio,
            "speciesCount": len(all_species),
            "layersCovered": min(4, max(1, len(all_layers))),
            "mstCost": mst_cost,
            "corridorLengthBeforeM": gross_length,
            "corridorLengthAfterM": net_length,
            "roadCellsCrossed": road_cells_crossed,
            "waterCellsCrossed": water_cells_crossed,
            "groupsCount": len(groups),
        },
        "timingsMs": {
            "plots": t_plots,
            "coverage": t_cov,
            "greedy": t_greedy,
            "knapsack": t_knapsack,
            "mst": t_mst,
            "total": total_time,
        }
    }

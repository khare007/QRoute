# ortools_baseline.py
"""
Google OR-Tools Baseline Solver for Capacitated Vehicle Routing Problem (CVRP)
=============================================================================
Features:
1. Integer-Scaled Arc Cost Evaluator for C++ Solver Engine
2. Multi-Objective Cost Function strictly aligned with fitness.py (Distance + Traffic Impedance)
3. Hard Vehicle Capacity Dimension Constraints (AddDimensionWithVehicleCapacity)
4. Guided Local Search Metaheuristic with Fast Bounded Time-Limits
5. Direct 3-Tuple Return Adapter for benchmark.py and main.py Integration
"""
import numpy as np
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from fitness import calculate_fitness

SCALE_FACTOR = 1000  # Scaling factor converting decimal costs to integers for OR-Tools


def solve_with_ortools_cvrp(
    distance_matrix: np.ndarray,
    congestion_matrix: np.ndarray = None,
    demands: list = None,
    vehicle_capacities: list = None,
    num_vehicles: int = 4,
    depot: int = 0,
    w_dist: float = 0.35,
    w_cong: float = 0.65,
    time_limit_seconds: int = 3
):
    """
    Solves Capacitated VRP with Traffic Congestion using Google OR-Tools C++ engine.
    """
    num_nodes = len(distance_matrix)
    
    if demands is None:
        demands = [0] + [10] * (num_nodes - 1)
        
    if vehicle_capacities is None:
        vehicle_capacities = [100] * num_vehicles
        
    if congestion_matrix is None:
        congestion_matrix = np.zeros_like(distance_matrix)

    # 1. Non-Linear Traffic-Aware Arc Cost Matrix (Strictly Aligned with fitness.py)
    # cost = w_dist * distance + w_cong * (distance * congestion * (1.0 + congestion^2 * 3.5))
    traffic_multiplier = 1.0 + (congestion_matrix ** 2) * 3.5
    congestion_penalty_matrix = distance_matrix * congestion_matrix * traffic_multiplier
    combined_cost = (w_dist * distance_matrix + w_cong * congestion_penalty_matrix) * SCALE_FACTOR
    int_cost_matrix = np.round(combined_cost).astype(int).tolist()

    # 2. Initialize Routing Index Manager & Routing Model
    manager = pywrapcp.RoutingIndexManager(num_nodes, num_vehicles, depot)
    routing = pywrapcp.RoutingModel(manager)

    # 3. Register Transit Callback for Combined Arc Cost
    def cost_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return int_cost_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(cost_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # 4. Add Hard Vehicle Capacity Constraints (CVRP)
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return int(demands[from_node])

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,                   # Null capacity slack
        vehicle_capacities,  # List of vehicle maximum capacities
        True,                # Start cumul to zero at depot
        'Capacity'
    )

    # 5. Search Parameters & Guided Local Search Metaheuristic
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = time_limit_seconds

    # 6. Solve Problem
    solution = routing.SolveWithParameters(search_parameters)

    # 7. Extract Multi-Vehicle Route Sequences
    routes = []
    if solution:
        for vehicle_id in range(num_vehicles):
            if not routing.IsVehicleUsed(solution, vehicle_id):
                continue

            index = routing.Start(vehicle_id)
            route = []
            while not routing.IsEnd(index):
                node_idx = manager.IndexToNode(index)
                route.append(int(node_idx))
                index = solution.Value(routing.NextVar(index))

            route.append(int(manager.IndexToNode(index)))  # Return to depot
            routes.append(route)

    return routes


# =====================================================================
# Adapter Function for benchmark.py and main.py Pipelines
# =====================================================================
def run_ortools_baseline(graph_net, vrp_env):
    """
    Direct adapter aligned with benchmark.py and main.py.
    
    Returns:
        routes (list): Multi-vehicle route sequences.
        metrics (dict): Exact fitness, road distance, and congestion evaluated via fitness.py.
        convergence_curve (list): Baseline fitness history.
    """
    # 1. Extract matrices from Graph Network
    dist_matrix = getattr(graph_net, 'distance_matrix', None)
    if dist_matrix is None and hasattr(graph_net, 'get_distance_matrix'):
        dist_matrix = graph_net.get_distance_matrix()

    cong_matrix = getattr(graph_net, 'congestion_matrix', None)
    if cong_matrix is None and hasattr(graph_net, 'get_congestion_matrix'):
        cong_matrix = graph_net.get_congestion_matrix()

    # 2. Extract dynamic fleet and capacity constraints
    demands = getattr(vrp_env, 'demands', [0] + [10] * (graph_net.num_nodes - 1))
    num_vehicles = getattr(vrp_env, 'num_vehicles', 4)
    
    if hasattr(vrp_env, 'vehicle_capacity'):
        capacities = [int(vrp_env.vehicle_capacity)] * num_vehicles
    else:
        capacities = getattr(vrp_env, 'vehicle_capacities', [100] * num_vehicles)
        
    depot = getattr(vrp_env, 'depot', 0)

    # 3. Solve using Google OR-Tools CVRP
    routes = solve_with_ortools_cvrp(
        distance_matrix=np.array(dist_matrix),
        congestion_matrix=np.array(cong_matrix) if cong_matrix is not None else None,
        demands=demands,
        vehicle_capacities=capacities,
        num_vehicles=num_vehicles,
        depot=depot,
        w_dist=0.35,
        w_cong=0.65
    )

    # 4. Standardized Fitness Evaluation using project's central calculate_fitness function
    fit_val, dist, cong = 0.0, 0.0, 0.0
    for r in routes:
        f, d, c = calculate_fitness(r, graph_net)
        fit_val += f
        dist += d
        cong += c

    metrics = {
        "fitness": float(round(fit_val, 4)),
        "distance": float(round(dist, 2)),
        "congestion": float(round(cong, 4))
    }

    dummy_convergence_curve = [metrics["fitness"]]

    # Return standard 3-tuple expected across the entire project
    return routes, metrics, dummy_convergence_curve
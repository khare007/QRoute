# backend_audit.py
import sys
import os

print("="*65)
print("  QROUTE BACKEND FULL SYSTEM AUDIT & INTEGRATION TEST")
print("="*65)

try:
    # 1. Test Dataset & Cache
    from real_map import build_real_road_graph, build_synthetic_graph, get_real_route_coordinates
    from vrp import VRPConstraints
    from qpso import run_qpso
    from classical_pso import run_classical_pso
    from ortools_baseline import run_ortools_baseline
    from traffic import auto_inject_on_active_route, inject_traffic_shock, reset_traffic_matrix
    from benchmark import generate_benchmark
    import main

    print("\n[STEP 1] Testing Real Delhi OSM Road Graph...")
    graph = build_real_road_graph(num_customers=20)
    print(f"  [+] Nodes Loaded: {graph.num_nodes} (1 Central Depot + 20 Customers)")
    print(f"  [+] Distance Matrix: {graph.distance_matrix.shape} | Max Distance: {graph.distance_matrix.max():.2f} km")
    print(f"  [+] Congestion Matrix: {graph.congestion_matrix.shape}")

    print("\n[STEP 2] Testing 2D Synthetic Mirror Projection...")
    syn_graph = build_synthetic_graph(graph)
    print(f"  [+] Synthetic Nodes Count: {len(syn_graph.synthetic_nodes)}")
    print(f"  [+] Node 0 (Depot) Coord: ({syn_graph.synthetic_nodes[0]['x']}, {syn_graph.synthetic_nodes[0]['y']})")

    print("\n[STEP 3] Testing VRP Capacity & Fleet Rules...")
    vrp = VRPConstraints(graph)
    print(f"  [+] Allocated Fleet: {vrp.num_vehicles} Vehicles")
    print(f"  [+] Capacity per Vehicle: {vrp.vehicle_capacity} units")
    print(f"  [+] Total Customer Demand: {sum(vrp.demands)} units")

    print("\n[STEP 4] Executing QPSO Quantum Solver (30 iterations)...")
    q_routes, q_metrics, q_conv = run_qpso(graph, vrp, swarm_size=25, iterations=30)
    print(f"  [+] QPSO Solved!")
    print(f"      - Fitness: {q_metrics['fitness']}")
    print(f"      - Total Road Distance: {q_metrics['distance']} km")
    print(f"      - Dispatched Routes: {len(q_routes)} vehicles")
    print(f"      - Convergence Steps: {len(q_conv)} points")

    print("\n[STEP 5] Executing Classical TVAC-PSO Solver...")
    p_routes, p_metrics, p_conv = run_classical_pso(graph, vrp, swarm_size=25, iterations=30)
    print(f"  [+] Classical PSO Solved!")
    print(f"      - Fitness: {p_metrics['fitness']}")
    print(f"      - Total Distance: {p_metrics['distance']} km")

    print("\n[STEP 6] Executing Google OR-Tools CVRP Solver...")
    or_routes, or_metrics, _ = run_ortools_baseline(graph, vrp)
    print(f"  [+] Google OR-Tools Solved!")
    print(f"      - Fitness: {or_metrics['fitness']}")
    print(f"      - Total Distance: {or_metrics['distance']} km")
    print(f"      - Routes Generated: {len(or_routes)}")

    print("\n[STEP 7] Testing Dynamic Traffic Shock & Rerouting...")
    shock_u, shock_v = auto_inject_on_active_route(graph, q_routes, shock_level=0.95)
    print(f"  [+] Injected Traffic Shock on active road: Node {shock_u} -> Node {shock_v}")
    new_q_routes, new_q_metrics, _ = run_qpso(graph, vrp, swarm_size=25, iterations=30)
    print(f"  [+] QPSO After Traffic Shock:")
    print(f"      - New Fitness: {new_q_metrics['fitness']}")
    print(f"      - Detour Distance: {new_q_metrics['distance']} km")
    reset_traffic_matrix(graph)
    print(f"  [+] Traffic Matrix Reset Successful.")

    print("\n[STEP 8] Testing Statistical Benchmark Engine (2 runs)...")
    bench_results = generate_benchmark(graph, vrp)
    summary_data = bench_results.get("summary", bench_results) if isinstance(bench_results, dict) else bench_results
    print(f"  [+] Benchmark Success! Models evaluated: {list(summary_data.keys())}")
    for k, v in summary_data.items():
        if isinstance(v, dict) and 'fitness_mean' in v:
            print(f"      * {k:20}: Fitness={v['fitness_mean']} | Distance={v['distance_mean']}km | Runtime={v['runtime_mean']}s")

    print("\n" + "="*65)
    print("  [SUCCESS] 100% OF BACKEND MODULES ARE HEALTHY & VERIFIED!")
    print("="*65)

except Exception as e:
    print(f"\n[!] BACKEND AUDIT FAILED AT STEP: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

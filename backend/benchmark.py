import json
import os
from qpso import run_qpso
from baselines import run_ortools_baseline

def generate_benchmark(graph_net, vrp_env):
    results = {"runs": []}
    
    for i in range(1, 11): # 10 Independent runs
        _, q_metrics, _ = run_qpso(graph_net, vrp_env, swarm_size=10, iterations=20)
        _, o_metrics = run_ortools_baseline(graph_net, vrp_env)
        
        run_data = {
            "run_id": i,
            "QPSO": q_metrics,
            "OR_Tools": o_metrics
        }
        results["runs"].append(run_data)
        
    # Save to results folder
    if not os.path.exists('results'):
        os.makedirs('results')
        
    with open('results/benchmark_metrics.json', 'w') as f:
        json.dump(results, f, indent=4)
        
    return results

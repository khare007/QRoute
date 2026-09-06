from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from graph import network, RoadNetwork
from vrp import vrp_env, VRPConstraints
from qpso import run_qpso
from baselines import run_ortools_baseline
from traffic import inject_traffic_shock
from benchmark import generate_benchmark

app = FastAPI(title="SIH QPSO Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScenarioRequest(BaseModel):
    num_customers: int = 20  # Default 20

@app.get("/")
def home():
    return {"message": "Quantum VRP Backend is Online! Ready for React."}

@app.post("/api/run-scenario")
def api_run_scenario(request: ScenarioRequest = ScenarioRequest()):
    # Create dynamic network based on selected customers
    num_nodes = request.num_customers + 1 # +1 for depot
    
    dynamic_network = RoadNetwork(num_nodes=num_nodes)
    dynamic_vrp = VRPConstraints(num_nodes=num_nodes)
    
    best_routes, best_metrics, convergence = run_qpso(dynamic_network, dynamic_vrp)
    _, or_metrics = run_ortools_baseline(dynamic_network, dynamic_vrp)
    
    return {
        "status": "success",
        "customers": request.num_customers,
        "QPSO_routes": best_routes,
        "QPSO_metrics": best_metrics,
        "OR_Tools_metrics": or_metrics,
        "convergence_data": convergence
    }

@app.post("/api/inject-traffic")
def api_inject_traffic():
    # Injecting heavy traffic
    inject_traffic_shock(network, node_a=3, node_b=4, new_congestion=0.95)
    
    # Re-optimize dynamically
    new_routes, new_metrics, _ = run_qpso(network, vrp_env)
    
    return {
        "status": "traffic_injected",
        "message": "Heavy congestion injected between nodes 3 and 4",
        "new_routes": new_routes,
        "new_metrics": new_metrics
    }

@app.post("/api/run-benchmark")
def api_run_benchmark():
    data = generate_benchmark(network, vrp_env)
    return {"status": "success", "benchmark_data": data}

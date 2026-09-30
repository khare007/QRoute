import os
import json
import time
import requests
import numpy as np
from geopy.distance import geodesic

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CACHE_FILE = os.path.join(DATA_DIR, "customer_cache.json")
CUSTOMER_FILE = os.path.join(DATA_DIR, "Customer-100.json")

OSRM_BASE_URL = "http://router.project-osrm.org/table/v1/driving/"

def generate_cache():
    """
    Fetches real street routing matrices using OSRM Table API 
    and caches distances and nominal congestion data locally.
    """
    if not os.path.exists(CUSTOMER_FILE):
        raise FileNotFoundError(f"Customer dataset not found at: {CUSTOMER_FILE}")

    with open(CUSTOMER_FILE, "r") as f:
        data = json.load(f)

    # 1 Depot + 100 Customers = 101 Nodes
    all_nodes = [data["depot"]] + data["customers"]
    n = len(all_nodes)
    print(f"Loaded {n} delivery points. Building road network matrix...")

    distance_matrix = np.zeros((n, n), dtype=float)
    duration_matrix = np.zeros((n, n), dtype=float)

    # Format all coordinates as 'lon,lat;lon,lat...'
    coords_list = [f"{node['lon']},{node['lat']}" for node in all_nodes]
    coords_str = ";".join(coords_list)

    # Batch source coordinates to prevent exceeding URL length limits
    batch_size = 20
    use_fallback = False

    for start_idx in range(0, n, batch_size):
        sources = list(range(start_idx, min(start_idx + batch_size, n)))
        source_params = ";".join(str(s) for s in sources)
        
        request_url = f"{OSRM_BASE_URL}{coords_str}?sources={source_params}&annotations=distance,duration"

        try:
            res = requests.get(request_url, timeout=25)
            if res.status_code == 200 and res.json().get("code") == "Ok":
                payload = res.json()
                dists_km = np.array(payload["distances"]) / 1000.0  # Convert meters to kilometers
                durs_sec = np.array(payload["durations"])

                for offset, src_node in enumerate(sources):
                    distance_matrix[src_node, :] = np.round(dists_km[offset, :], 2)
                    duration_matrix[src_node, :] = np.round(durs_sec[offset, :], 1)
                
                print(f"  -> Successfully processed nodes {sources[0]} to {sources[-1]}")
                time.sleep(0.6)  # Maintain delay to avoid public rate-limiting
            else:
                print(f"[!] Warning: OSRM returned invalid response for batch {sources[0]}-{sources[-1]}. Triggering fallback.")
                use_fallback = True
                break
        except Exception as e:
            print(f"[!] Warning: Network error during OSRM call ({e}). Triggering fallback.")
            use_fallback = True
            break

    # Fallback to geodesic distance with city road tortuosity factor if API is unavailable
    if use_fallback:
        print("[*] Generating road distances via geodesic tortuosity approximation...")
        CITY_FACTOR = 1.35
        for i in range(n):
            for j in range(n):
                if i != j:
                    c1 = (all_nodes[i]["lat"], all_nodes[i]["lon"])
                    c2 = (all_nodes[j]["lat"], all_nodes[j]["lon"])
                    km = geodesic(c1, c2).kilometers * CITY_FACTOR
                    distance_matrix[i][j] = round(km, 2)
                    duration_matrix[i][j] = round(km * 140, 1)

    # Nominal baseline urban traffic congestion matrix (0.05 to 0.20)
    np.random.seed(42)
    congestion_matrix = np.random.uniform(0.05, 0.20, size=(n, n))
    np.fill_diagonal(congestion_matrix, 0.0)

    nodes_metadata = {
        node["id"]: {
            "name": node["name"],
            "lat": node["lat"],
            "lon": node["lon"],
            "demand": node["demand"]
        }
        for node in all_nodes
    }

    cache_payload = {
        "num_nodes": n,
        "distance_matrix": distance_matrix.tolist(),
        "duration_matrix": duration_matrix.tolist(),
        "congestion_matrix": congestion_matrix.tolist(),
        "nodes_metadata": nodes_metadata
    }

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CACHE_FILE, "w") as f:
        json.dump(cache_payload, f, indent=2)

    print(f"\n[DONE] Successfully saved routing matrix for {n} nodes at:")
    print(f"       {CACHE_FILE}")

if __name__ == "__main__":
    generate_cache()
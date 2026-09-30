import random
import numpy as np

def inject_traffic_shock(graph_net, node_a: int, node_b: int, new_congestion: float = 0.95):
    """
    Injects a severe traffic shock on a specific bidirectional road segment (node_a <-> node_b).
    """
    if node_a >= graph_net.num_nodes or node_b >= graph_net.num_nodes:
        raise IndexError(
            f"Node indices ({node_a}, {node_b}) exceed active graph size ({graph_net.num_nodes})."
        )
        
    graph_net.congestion_matrix[node_a][node_b] = new_congestion
    graph_net.congestion_matrix[node_b][node_a] = new_congestion
    return graph_net

def auto_inject_on_active_route(graph_net, active_routes: list, shock_level: float = 0.95):
    """
    Extracts all currently traversed edges from active fleet routes,
    randomly picks one active link, and injects severe congestion shock.
    """
    active_edges = []
    
    # Collect all valid customer legs (ignore immediate depot loops [0, 0])
    for route in active_routes:
        for idx in range(len(route) - 1):
            u, v = route[idx], route[idx + 1]
            if u != v:
                active_edges.append((u, v))
                
    if not active_edges:
        # Fallback if no routes dispatched yet
        u, v = 0, min(1, graph_net.num_nodes - 1)
    else:
        # Pick an active traversal edge at random (prevents scripted demo behavior)
        u, v = random.choice(active_edges)
        
    inject_traffic_shock(graph_net, u, v, new_congestion=shock_level)
    return u, v

def reset_traffic_matrix(graph_net, baseline_low: float = 0.05, baseline_high: float = 0.20):
    """
    Resets graph congestion matrix back to nominal city baseline conditions.
    """
    n = graph_net.num_nodes
    graph_net.congestion_matrix = np.random.uniform(baseline_low, baseline_high, (n, n))
    np.fill_diagonal(graph_net.congestion_matrix, 0.0)
    return graph_net
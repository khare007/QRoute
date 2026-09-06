def inject_traffic_shock(graph_net, node_a, node_b, new_congestion=0.90):
    # This alters the global graph network congestion
    graph_net.congestion_matrix[node_a][node_b] = new_congestion
    graph_net.congestion_matrix[node_b][node_a] = new_congestion
    return graph_net

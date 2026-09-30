def calculate_fitness(route: list, graph_net):
    """
    Calculates multi-objective fitness evaluating total travel distance 
    and traffic impedance with non-linear penalties for heavy congestion shocks.
    """
    total_distance = 0.0
    total_congestion_penalty = 0.0
    
    for i in range(len(route) - 1):
        u, v = route[i], route[i + 1]
        dist = float(graph_net.distance_matrix[u][v])
        cong = float(graph_net.congestion_matrix[u][v])
        
        total_distance += dist
        
        # Non-linear congestion multiplier:
        # Normal traffic (cong <= 0.20) adds negligible extra penalty.
        # Severe shocks (cong >= 0.90) scale delay exponentially, forcing immediate rerouting.
        traffic_multiplier = 1.0 + (cong ** 2) * 3.5
        total_congestion_penalty += (dist * cong * traffic_multiplier)
        
    # Multi-objective balancing weights (Distance vs Traffic Congestion)
    w_dist = 0.35
    w_cong = 0.65 
    
    fitness_score = (w_dist * total_distance) + (w_cong * total_congestion_penalty)
    return float(fitness_score), float(total_distance), float(total_congestion_penalty)
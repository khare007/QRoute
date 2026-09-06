def calculate_fitness(route, graph_net):
    total_distance = 0.0
    total_congestion_penalty = 0.0
    
    for i in range(len(route) - 1):
        u, v = route[i], route[i+1]
        dist = float(graph_net.distance_matrix[u][v])
        cong = float(graph_net.congestion_matrix[u][v])
        
        total_distance += dist
        total_congestion_penalty += (dist * cong) # Traffic increases time
        
    # Weights for multi-objective calculation
    w_dist = 0.4
    w_cong = 0.6 
    
    fitness_score = (w_dist * total_distance) + (w_cong * total_congestion_penalty)
    return float(fitness_score), float(total_distance), float(total_congestion_penalty)

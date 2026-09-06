import numpy as np # type: ignore
from fitness import calculate_fitness

def decode_spv_to_route(particle, graph_net, vrp_env):
    # SPV Encoding: Smallest Position Value to create sequence
    customer_order = (np.argsort(particle) + 1).tolist()
    
    routes = []
    current_route = [0]
    current_load = 0
    
    for customer in customer_order:
        customer = int(customer)
        demand = int(vrp_env.demands[customer])
        if current_load + demand > vrp_env.vehicle_capacity:
            current_route.append(0)
            routes.append(current_route)
            current_route = [0, customer]
            current_load = demand
        else:
            current_route.append(customer)
            current_load += demand
            
    current_route.append(0)
    routes.append(current_route)
    return routes

def run_qpso(graph_net, vrp_env, swarm_size=30, iterations=100):
    num_customers = graph_net.num_nodes - 1
    
    # Initialize quantum particles
    particles = np.random.uniform(0, 1, (swarm_size, num_customers))
    pbest = np.copy(particles)
    pbest_fitness = np.full(swarm_size, np.inf)
    
    gbest = None
    gbest_fitness = np.inf
    convergence_curve = []
    
    for it in range(iterations):
        mbest = np.mean(pbest, axis=0) # Mean best position
        
        for i in range(swarm_size):
            routes = decode_spv_to_route(particles[i], graph_net, vrp_env)
            fit_val, dist, cong = 0.0, 0.0, 0.0
            for r in routes:
                f, d, c = calculate_fitness(r, graph_net)
                fit_val += f; dist += d; cong += c
                
            if fit_val < pbest_fitness[i]:
                pbest_fitness[i] = fit_val
                pbest[i] = np.copy(particles[i])
                
            if fit_val < gbest_fitness:
                gbest_fitness = fit_val
                gbest = np.copy(particles[i])
                best_routes = routes
                best_metrics = {"fitness": float(round(fit_val, 3)), "distance": float(round(dist, 2)), "congestion": float(round(cong, 3))}

        # Quantum Update Rule (Delta Potential Well)
        beta = 1.0 - (0.5 * (it / iterations)) 
        for i in range(swarm_size):
            u = np.random.uniform(0, 1, num_customers)
            phi = np.random.uniform(0, 1, num_customers)
            P = (phi * pbest[i]) + ((1 - phi) * gbest)
            L = np.random.choice([-1, 1], num_customers)
            particles[i] = P + L * beta * np.abs(mbest - particles[i]) * np.log(1.0 / u)
            
        convergence_curve.append(float(gbest_fitness))
        
    return best_routes, best_metrics, convergence_curve

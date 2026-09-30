import numpy as np # type: ignore
from fitness import calculate_fitness
from qpso import decode_spv_to_route

def run_classical_pso(graph_net, vrp_env, swarm_size=30, iterations=100):
    """
    Integrates seamlessly with graph_net, vrp_env, and multi-vehicle route decoding.
    """
    num_customers = graph_net.num_nodes - 1
    lb, ub = 0.0, 1.0
    v_max = 0.2  # Max velocity step for [0, 1] range
    
    # 1. Initialize Positions and Velocities
    particles = np.random.uniform(lb, ub, (swarm_size, num_customers))
    velocities = np.zeros((swarm_size, num_customers))  # Starts at zero velocity
    
    pbest = np.copy(particles)
    pbest_fitness = np.full(swarm_size, np.inf)
    
    gbest = None
    gbest_fitness = np.inf
    best_routes = []
    best_metrics = {}
    convergence_curve = []
    
    # Paper Parameter Bounds (Ratnaweera TVAC)
    w_max, w_min = 0.9, 0.4
    c1_max, c1_min = 2.5, 0.5
    c2_max, c2_min = 2.5, 0.5
    
    for it in range(iterations):
        # Time-Varying Inertia Weight (Eq 5)
        w = (w_max - w_min) * ((iterations - it) / iterations) + w_min
        
        # Time-Varying Acceleration Coefficients (Eq 6 & 7)
        c1 = (c1_max - c1_min) * ((iterations - it) / iterations) + c1_min
        c2 = (c2_max - c2_min) * (it / iterations) + c2_min
        
        for i in range(swarm_size):
            routes = decode_spv_to_route(particles[i], graph_net, vrp_env)
            fit_val, dist, cong = 0.0, 0.0, 0.0
            for r in routes:
                f, d, c = calculate_fitness(r, graph_net)
                fit_val += f
                dist += d
                cong += c
                
            # Update Personal Best
            if fit_val < pbest_fitness[i]:
                pbest_fitness[i] = fit_val
                pbest[i] = np.copy(particles[i])
                
            # Update Global Best
            if fit_val < gbest_fitness:
                gbest_fitness = fit_val
                gbest = np.copy(particles[i])
                best_routes = routes
                best_metrics = {
                    "fitness": float(round(fit_val, 3)),
                    "distance": float(round(dist, 2)),
                    "congestion": float(round(cong, 3))
                }
                
        # Velocity and Position Update Rule with Clamping
        for i in range(swarm_size):
            r1 = np.random.uniform(0, 1, num_customers)
            r2 = np.random.uniform(0, 1, num_customers)
            
            velocities[i] = (w * velocities[i]) + (c1 * r1 * (pbest[i] - particles[i])) + (c2 * r2 * (gbest - particles[i]))
            velocities[i] = np.clip(velocities[i], -v_max, v_max)
            
            particles[i] = particles[i] + velocities[i]
            particles[i] = np.clip(particles[i], lb, ub)
            
        convergence_curve.append(float(gbest_fitness))
        
    return best_routes, best_metrics, convergence_curve
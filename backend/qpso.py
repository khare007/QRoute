# qpso.py
"""
Quantum-behaved Particle Swarm Optimization (QPSO) for Capacitated VRP
======================================================================
Key Theoretical Innovations Integrated:
1. Coordinate-wise Delta Potential Well Wave Mechanics (Sun et al., 2004)
2. Smallest Position Value (SPV) Combinatorial Permutation Decoding
3. Quadratic Interpolation Recombination Operator (Pant et al., 2008)
4. Elitist Super-Particle Dynamic Local Search QPSO_LDSS_gm (Xi et al., 2017)
5. Strict Multi-Vehicle Capacity Compliance with Fleet Size Penalization
"""
import numpy as np 
from fitness import calculate_fitness

def decode_spv_to_route(particle: np.ndarray, graph_net, vrp_env) -> list:
    """
    Smallest Position Value (SPV) decoding with Hard Vehicle Capacity Constraints.
    Converts continuous particle coordinates in [0, 1] to discrete customer routes.
    
    Guarantees:
    - Depot is always Node 0.
    - Customer nodes are 1..N.
    - NO vehicle is EVER overloaded (Hard Capacity Compliance).
    """
    # Sort continuous dimensions to derive customer delivery sequence
    customer_order = (np.argsort(particle) + 1).tolist()
    capacity = getattr(vrp_env, 'vehicle_capacity', 100)
    
    routes = []
    current_route = [0]
    current_load = 0
    
    for customer in customer_order:
        customer_id = int(customer)
        demand = int(vrp_env.demands[customer_id])
        
        # Hard Capacity Check: If adding customer exceeds capacity, dispatch new vehicle
        if current_load + demand > capacity:
            current_route.append(0)  # Return to central depot
            routes.append(current_route)
            current_route = [0, customer_id]
            current_load = demand
        else:
            current_route.append(customer_id)
            current_load += demand
            
    current_route.append(0)  # Final vehicle returns to depot
    routes.append(current_route)
    return routes


def evaluate_particle(particle: np.ndarray, graph_net, vrp_env):
    """
    Evaluates multi-objective fitness (Distance + Traffic Impendance).
    Applies soft penalty if dispatched vehicles exceed configured fleet limit.
    """
    routes = decode_spv_to_route(particle, graph_net, vrp_env)
    fit_val, dist, cong = 0.0, 0.0, 0.0
    
    for r in routes:
        f, d, c = calculate_fitness(r, graph_net)
        fit_val += f
        dist += d
        cong += c
        
    # Fleet Alignment Penalty: Penalize QPSO if it tries to use more vehicles than OR-Tools
    max_vehicles = getattr(vrp_env, 'num_vehicles', 4)
    if len(routes) > max_vehicles:
        excess = len(routes) - max_vehicles
        fit_val += (excess * 25.0)  # Soft penalty forcing optimal vehicle bin-packing
        
    return fit_val, dist, cong, routes


def super_particle_local_search(pbest: np.ndarray, pbest_fitness: np.ndarray, 
                                gbest: np.ndarray, gbest_fitness: float, mbest: np.ndarray, 
                                dim: int, graph_net, vrp_env, max_T: int = 10, 
                                max_r: float = 1.0, min_r: float = 0.01):
    """
    Elitist Super-Particle Local Search Strategy (Xi et al., 2017)
    - Variant: QPSO_LDSS_gm (Search space radius based on |gbest - mbest|)
    - Multiplicative compounding radius decay: r = chi * r
    - Rank-based elitist roulette selection for dimension assembly
    """
    swarm_size = len(pbest)
    
    # Linear rank-based selection probability
    sorted_order = np.argsort(pbest_fitness)
    ranks = np.empty_like(sorted_order, dtype=float)
    ranks[sorted_order] = np.arange(swarm_size, 0, -1)
    prob = ranks / np.sum(ranks)

    # Base search radius centered around attractor distance
    r = np.abs(gbest - mbest) + 1e-6
    current_gbest = np.copy(gbest)
    current_gbest_fit = gbest_fitness

    # Construct Super Particle Ps from elitist dimensions
    Ps = np.zeros(dim)
    for j in range(dim):
        selected_idx = np.random.choice(swarm_size, p=prob)
        Ps[j] = pbest[selected_idx][j]

    # Iterative local neighborhood exploration loop
    for loct in range(1, max_T + 1):
        delta_r = np.random.uniform(-r, r, size=dim)
        Pp = Ps + delta_r
        
        fit_p, _, _, _ = evaluate_particle(Pp, graph_net, vrp_env)
        if fit_p < current_gbest_fit:
            current_gbest = np.copy(Pp)
            current_gbest_fit = fit_p

        # Multiplicative compounding search radius contraction (Eq. 12 & 13)
        chi = max_r - (max_r - min_r) * (loct / max_T)
        r = chi * r

    return current_gbest, current_gbest_fit


def quadratic_interpolation(pbest: np.ndarray, pbest_fitness: np.ndarray, gbest_idx: int, dim: int):
    """
    Quadratic Interpolation Recombination Operator (Pant et al., 2008)
    Analytically computes the minimum of a parabolic curve through 3 particles:
    a = gbest (global best), b and c = randomly chosen distinct particles.
    """
    swarm_size = len(pbest)
    if swarm_size < 3:
        return None

    a_idx = gbest_idx
    other_indices = [idx for idx in range(swarm_size) if idx != a_idx]
    b_idx, c_idx = np.random.choice(other_indices, size=2, replace=False)

    a, b, c = pbest[a_idx], pbest[b_idx], pbest[c_idx]
    fa, fb, fc = pbest_fitness[a_idx], pbest_fitness[b_idx], pbest_fitness[c_idx]

    numerator = (b**2 - c**2) * fa + (c**2 - a**2) * fb + (a**2 - b**2) * fc
    denominator = 2.0 * ((b - c) * fa + (c - a) * fb + (a - b) * fc)

    # Numerical safeguard against divide-by-zero
    valid_mask = np.abs(denominator) > 1e-8
    x_tilde = np.copy(a)
    x_tilde[valid_mask] = numerator[valid_mask] / denominator[valid_mask]
    
    # Check boundary and finiteness
    if not np.all(np.isfinite(x_tilde)):
        return None
        
    return x_tilde


def run_qpso(graph_net, vrp_env, swarm_size: int = 30, iterations: int = 100, 
             stagnation_limit: int = 8, enable_local_search: bool = True):
    """
    Master QPSO Optimizer Runner.
    
    Returns:
        best_routes (list): Multi-vehicle optimal route sequences.
        best_metrics (dict): Fitness score, total road distance, and average congestion.
        convergence_curve (list): Step-by-step best fitness descent history.
    """
    num_customers = graph_net.num_nodes - 1
    dim = num_customers
    
    # 1. Initialize Swarm in continuous hypercube [0, 1]
    particles = np.random.uniform(0.0, 1.0, (swarm_size, dim))
    pbest = np.copy(particles)
    pbest_fitness = np.full(swarm_size, np.inf)
    
    gbest = None
    gbest_fitness = np.inf
    best_routes = []
    best_metrics = {}
    convergence_curve = []
    
    stagnation_counter = 0

    # 2. Initial population evaluation
    for i in range(swarm_size):
        fit, dist, cong, routes = evaluate_particle(particles[i], graph_net, vrp_env)
        pbest_fitness[i] = fit
        if fit < gbest_fitness:
            gbest_fitness = fit
            gbest = np.copy(particles[i])
            best_routes = routes
            best_metrics = {
                "fitness": float(round(fit, 4)), 
                "distance": float(round(dist, 2)), 
                "congestion": float(round(cong, 4))
            }

    # 3. Main Quantum Iterative Optimization Loop
    for it in range(iterations):
        # Adaptive Contraction-Expansion coefficient (Linear decay 1.0 -> 0.5)
        beta = 1.0 - (0.5 * (it / iterations))
        
        # Mean Best Position (mbest) - Center of mass of swarm personal bests
        mbest = np.mean(pbest, axis=0)
        improved_this_iter = False

        # 4. Coordinate-Wise Delta Potential Well Position Update
        for i in range(swarm_size):
            u = np.random.uniform(1e-7, 1.0, size=dim)  # Safe lower bound prevents log(0)
            phi = np.random.uniform(0.0, 1.0, size=dim)
            
            # Local Attractor p
            P = phi * pbest[i] + (1.0 - phi) * gbest
            
            # Stochastic quantum wave collapse direction (+1 or -1)
            L = np.random.choice([-1.0, 1.0], size=dim)
            
            # Delta Potential Well position update equation
            particles[i] = P + L * beta * np.abs(mbest - particles[i]) * np.log(1.0 / u)
            
            # Clip bounds to keep particles within normalized search domain
            particles[i] = np.clip(particles[i], 0.0, 1.0)
            
            fit, dist, cong, routes = evaluate_particle(particles[i], graph_net, vrp_env)
            
            # Personal Best Update
            if fit < pbest_fitness[i]:
                pbest_fitness[i] = fit
                pbest[i] = np.copy(particles[i])
                
                # Global Best Update
                if fit < gbest_fitness:
                    gbest_fitness = fit
                    gbest = np.copy(particles[i])
                    best_routes = routes
                    best_metrics = {
                        "fitness": float(round(fit, 4)), 
                        "distance": float(round(dist, 2)), 
                        "congestion": float(round(cong, 4))
                    }
                    improved_this_iter = True

        # 5. Quadratic Interpolation Recombination (Pant et al., 2008)
        gbest_idx = int(np.argmin(pbest_fitness))
        x_tilde = quadratic_interpolation(pbest, pbest_fitness, gbest_idx, dim)
        if x_tilde is not None:
            fit_tilde, dist_tilde, cong_tilde, routes_tilde = evaluate_particle(x_tilde, graph_net, vrp_env)
            worst_idx = int(np.argmax(pbest_fitness))
            if fit_tilde < pbest_fitness[worst_idx]:
                pbest[worst_idx] = np.copy(x_tilde)
                pbest_fitness[worst_idx] = fit_tilde
                if fit_tilde < gbest_fitness:
                    gbest_fitness = fit_tilde
                    gbest = np.copy(x_tilde)             
                    best_routes = routes_tilde
                    best_metrics = {
                        "fitness": float(round(fit_tilde, 4)), 
                        "distance": float(round(dist_tilde, 2)), 
                        "congestion": float(round(cong_tilde, 4))
                    }
                    improved_this_iter = True

        # 6. Stagnation Tracking & Local Search Trigger
        if not improved_this_iter:
            stagnation_counter += 1
        else:
            stagnation_counter = 0

        # Trigger Super-Particle Local Search if swarm stagnates in local minima
        if enable_local_search and stagnation_counter >= stagnation_limit:
            gbest, gbest_fitness = super_particle_local_search(
                pbest, pbest_fitness, gbest, gbest_fitness, mbest, 
                dim, graph_net, vrp_env, max_T=10
            )
            _, dist, cong, best_routes = evaluate_particle(gbest, graph_net, vrp_env)
            best_metrics = {
                "fitness": float(round(gbest_fitness, 4)),
                "distance": float(round(dist, 2)),
                "congestion": float(round(cong, 4))
            }
            stagnation_counter = 0

        convergence_curve.append(float(gbest_fitness))

    return best_routes, best_metrics, convergence_curve
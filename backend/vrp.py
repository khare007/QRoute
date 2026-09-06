import numpy as np

class VRPConstraints:
    def __init__(self, num_nodes=21):
        self.depot = 0
        self.customers = list(range(1, num_nodes))
        
        # Fixed demands for reproducible presentation
        np.random.seed(42)
        self.demands = [0] + [np.random.randint(10, 30) for _ in range(num_nodes-1)]
        
        self.vehicle_capacity = 100
        self.num_vehicles = 3

# Global instance to be imported by other files
vrp_env = VRPConstraints()

import numpy as np

class VRPConstraints:
    def __init__(self, graph_net, vehicle_capacity: int = 100):
        self.depot = 0
        self.num_nodes = graph_net.num_nodes
        self.customers = list(range(1, self.num_nodes))
        self.vehicle_capacity = vehicle_capacity
        
        # Real demands directly loaded from node metadata
        self.demands = [graph_net.nodes_metadata[i]["demand"] for i in range(self.num_nodes)]
        
        # Dynamic fleet allocation based on total demand load
        total_demand = sum(self.demands)
        min_vehicles_needed = int(np.ceil(total_demand / (self.vehicle_capacity * 0.8)))
        self.num_vehicles = max(3, min_vehicles_needed)
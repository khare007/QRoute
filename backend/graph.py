import numpy as np # type: ignore

class RoadNetwork:
    def __init__(self, num_nodes=21):
        self.num_nodes = num_nodes
        
        # Generate a fixed random distance matrix for reproducibility
        np.random.seed(42)
        self.distance_matrix = np.random.randint(5, 50, size=(num_nodes, num_nodes))
        np.fill_diagonal(self.distance_matrix, 0)
        
        # Base congestion (0.1 to 0.4 for normal traffic)
        self.congestion_matrix = np.random.uniform(0.1, 0.4, size=(num_nodes, num_nodes))
        np.fill_diagonal(self.congestion_matrix, 0)

# Global instance to be imported by other files
network = RoadNetwork()

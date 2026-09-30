import { GraphNode, VehicleRoute } from '../types';
import { calculateRouteRoadDistanceKm, getRouteRealMapCoords } from './delhiCoordinates';

export const VEHICLE_COLORS = [
  '#00FF9D', // V1: Neon Emerald
  '#00A3FF', // V2: Electric Cyan
  '#F97316', // V3: Vibrant Orange
  '#A855F7', // V4: Bright Purple
  '#EC4899', // V5: Hot Pink
  '#EAB308', // V6: Cyber Yellow
  '#06B6D4', // V7: Deep Teal
  '#8B5CF6', // V8: Deep Violet
  '#10B981', // V9: Sea Green
  '#F43F5E'  // V10: Rose Red
];

/**
 * Dynamically partitions nodes and generates realistic vehicle routes
 * for any fleet size (1 to 10 vehicles) using authentic Delhi GPS road distances.
 */
export function generateFleetRoutes(
  numVehicles: number,
  nodes: GraphNode[],
  isReoptimized: boolean = false,
  affectedEdge: [number, number] = [6, 7]
): VehicleRoute[] {
  const depot = nodes.find((n) => n.isDepot) || { id: 0, x: 290, y: 195, demand: 0, label: '0', isDepot: true };
  const customerNodes = nodes.filter((n) => !n.isDepot);

  // If no customers, return single empty depot loop
  if (customerNodes.length === 0) {
    return [
      {
        vehicleId: 1,
        name: 'Vehicle 1',
        color: VEHICLE_COLORS[0],
        path: [0, 0],
        sequence: [0, 0],
        distance: 0,
        time: 0,
        load: 0,
        real_map_coords: []
      }
    ];
  }

  // Sort nodes radially around central depot (angular sweep)
  const sortedCustomers = [...customerNodes].sort((a, b) => {
    const angleA = Math.atan2(a.y - depot.y, a.x - depot.x);
    const angleB = Math.atan2(b.y - depot.y, b.x - depot.x);
    return angleA - angleB;
  });

  const actualVehicles = Math.min(numVehicles, customerNodes.length);
  const vehicles: VehicleRoute[] = [];
  const chunkSize = Math.ceil(sortedCustomers.length / actualVehicles);

  for (let i = 0; i < actualVehicles; i++) {
    const slice = sortedCustomers.slice(i * chunkSize, (i + 1) * chunkSize);
    if (slice.length === 0) continue;

    let path = [0, ...slice.map((n) => n.id), 0];

    // If reoptimized, detour around affectedEdge if present
    if (isReoptimized && affectedEdge) {
      const idx1 = path.indexOf(affectedEdge[0]);
      const idx2 = path.indexOf(affectedEdge[1]);
      if (idx1 !== -1 && idx2 !== -1 && Math.abs(idx1 - idx2) === 1) {
        // Reroute via an alternative waypoint
        const insertIdx = Math.max(idx1, idx2);
        path.splice(insertIdx, 0, 11);
      }
    }

    // Calculate real road distance (km) and capacity load
    const distance = calculateRouteRoadDistanceKm(path);
    let load = 0;
    for (let p = 0; p < path.length; p++) {
      if (path[p] !== 0) {
        const n = nodes.find((node) => node.id === path[p]);
        load += n?.demand || 10;
      }
    }

    const time = Number((distance * 1.85 + (isReoptimized ? 4.5 : 0)).toFixed(1));

    vehicles.push({
      vehicleId: i + 1,
      name: `Vehicle ${i + 1}`,
      color: VEHICLE_COLORS[i % VEHICLE_COLORS.length],
      path,
      sequence: path,
      distance: Number(distance.toFixed(2)),
      time,
      load: Math.round(load),
      real_map_coords: getRouteRealMapCoords(path)
    });
  }

  return vehicles;
}

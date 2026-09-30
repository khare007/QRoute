import React, { useMemo } from 'react';
import { GraphNode, GraphEdge, VehicleRoute } from '../types';
import {
  getNodeDelhiCoords,
  getNodeName,
  getRoadSegmentPoints,
  getRouteRealMapCoords,
  DELHI_ROAD_NETWORK_EDGES,
  OSRM_CLIENT_CACHE
} from '../utils/delhiCoordinates';

interface MiniNetworkGraphProps {
  nodes: GraphNode[];
  routes: VehicleRoute[];
  highlightEdge?: [number, number];
  isAlert?: boolean;
  edges?: GraphEdge[];
  mode?: 'osm' | 'synthetic';
}

export const MiniNetworkGraph: React.FC<MiniNetworkGraphProps> = ({
  nodes,
  routes,
  highlightEdge,
  isAlert = false,
  edges = [],
  mode = 'osm'
}) => {
  const getNode = (id: number) => nodes.find((n) => n.id === id);

  // 1. Compute dynamic bounding box for Delhi GPS coordinates
  const delhiProjection = useMemo(() => {
    // Gather all node coordinates
    const coords: [number, number][] = nodes.map((n) => getNodeDelhiCoords(n.id));
    if (highlightEdge) {
      coords.push(getNodeDelhiCoords(highlightEdge[0]));
      coords.push(getNodeDelhiCoords(highlightEdge[1]));
    }

    if (coords.length === 0) {
      return {
        project: (p: [number, number]) => ({ x: 120, y: 70 }),
        minLat: 28.50,
        maxLat: 28.70,
        minLon: 77.10,
        maxLon: 77.30
      };
    }

    let minLat = Math.min(...coords.map((c) => c[0]));
    let maxLat = Math.max(...coords.map((c) => c[0]));
    let minLon = Math.min(...coords.map((c) => c[1]));
    let maxLon = Math.max(...coords.map((c) => c[1]));

    // Add 12% padding around coordinates so nodes don't hit the border
    const latSpan = Math.max(0.02, maxLat - minLat);
    const lonSpan = Math.max(0.02, maxLon - minLon);
    minLat -= latSpan * 0.15;
    maxLat += latSpan * 0.15;
    minLon -= lonSpan * 0.15;
    maxLon += lonSpan * 0.15;

    // SVG viewBox: width=260, height=145
    const padX = 14;
    const padY = 14;
    const w = 260 - padX * 2;
    const h = 145 - padY * 2;

    const project = (p: [number, number]) => {
      const lat = p[0];
      const lon = p[1];
      const x = padX + ((lon - minLon) / (maxLon - minLon)) * w;
      const y = padY + ((maxLat - lat) / (maxLat - minLat)) * h;
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
    };

    return { project, minLat, maxLat, minLon, maxLon };
  }, [nodes, highlightEdge]);

  // Map each node to its route color
  const nodeColorMap = useMemo(() => {
    const map = new Map<number, string>();
    routes.forEach((route) => {
      const seq = route.sequence || route.path || [];
      seq.forEach((id) => {
        if (id !== 0 && !map.has(id)) {
          map.set(id, route.color);
        }
      });
    });
    return map;
  }, [routes]);

  // Helper for smooth Catmull-Rom Bezier curve (for 2D synthetic mode)
  const generateSmoothCurvedPath = (pts: { x: number; y: number }[]): string => {
    if (!pts || pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  // ----------------------------------------------------
  // RENDER: REAL DELHI MAP (OSM) MINI-VIEW
  // ----------------------------------------------------
  if (mode === 'osm') {
    const shockCoords = highlightEdge ? {
      p1: getNodeDelhiCoords(highlightEdge[0]),
      p2: getNodeDelhiCoords(highlightEdge[1]),
      waypoints:
        OSRM_CLIENT_CACHE.get(`${highlightEdge[0]}-${highlightEdge[1]}`) ||
        (OSRM_CLIENT_CACHE.has(`${highlightEdge[1]}-${highlightEdge[0]}`)
          ? [...OSRM_CLIENT_CACHE.get(`${highlightEdge[1]}-${highlightEdge[0]}`)!].reverse()
          : null) ||
        getRoadSegmentPoints(
          getNodeDelhiCoords(highlightEdge[0]),
          getNodeDelhiCoords(highlightEdge[1])
        )
    } : null;

    return (
      <div className="relative w-52 sm:w-60 h-36 bg-[#080C14] rounded-xl border border-slate-800/80 overflow-hidden flex-shrink-0 shadow-inner select-none">
        {/* Subtle Map Badge */}
        <div className="absolute top-1.5 left-2 z-10 text-[8px] font-mono text-cyan-400/80 bg-slate-950/80 px-1.5 py-0.5 rounded border border-cyan-500/20 pointer-events-none">
          DELHI STREET GRID
        </div>

        <svg viewBox="0 0 260 145" className="w-full h-full">
          <defs>
            <filter id="mini-glow-red" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="mini-glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="mini-delhi-dots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="0.6" fill="#1E293B" />
            </pattern>
          </defs>

          {/* Background Texture */}
          <rect width="260" height="145" fill="#070B12" />
          <rect width="260" height="145" fill="url(#mini-delhi-dots)" />

          {/* 1. Base Delhi Arterial Street Network (Subtle grid in background) */}
          <g opacity="0.22">
            {DELHI_ROAD_NETWORK_EDGES.slice(0, 30).map((edge) => {
              const pts = edge.coords.map((c) => delhiProjection.project(c));
              const ptsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
              return (
                <polyline
                  key={`mini-arterial-${edge.id}`}
                  points={ptsStr}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
              );
            })}
          </g>

          {/* 2. Active Vehicle Road Routes (Multi-waypoint street curves) */}
          <g id="mini-osm-routes">
            {routes.map((route) => {
              const seq = route.sequence || route.path || [];
              if (seq.length < 2) return null;

              const roadCoords = getRouteRealMapCoords(seq);
              const projectedPts = roadCoords.map((c) => delhiProjection.project(c));
              const ptsStr = projectedPts.map((p) => `${p.x},${p.y}`).join(' ');

              return (
                <g key={`mini-osm-route-${route.vehicleId}`}>
                  {/* Outer Route Halo */}
                  <polyline
                    points={ptsStr}
                    fill="none"
                    stroke={route.color}
                    strokeWidth="5"
                    strokeOpacity="0.22"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Core Sharp Road Path */}
                  <polyline
                    points={ptsStr}
                    fill="none"
                    stroke={route.color}
                    strokeWidth="2.2"
                    strokeOpacity="0.95"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </g>

          {/* 3. Traffic Shock Road Segment (Card B Highlight) */}
          {shockCoords && isAlert && (
            <g id="mini-osm-shock">
              {(() => {
                const projectedShockPts = shockCoords.waypoints.map((c) => delhiProjection.project(c));
                const shockPtsStr = projectedShockPts.map((p) => `${p.x},${p.y}`).join(' ');
                const midIdx = Math.floor(projectedShockPts.length / 2);
                const midPoint = projectedShockPts[midIdx] || projectedShockPts[0];

                return (
                  <>
                    {/* Pulsing Red Laser Segment */}
                    <polyline
                      points={shockPtsStr}
                      fill="none"
                      stroke="#FF3366"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#mini-glow-red)"
                      className="animate-pulse"
                    />
                    <polyline
                      points={shockPtsStr}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                      strokeDasharray="4,3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Animated Shockwave Halo */}
                    <circle
                      cx={midPoint.x}
                      cy={midPoint.y}
                      r="12"
                      fill="#FF3366"
                      fillOpacity="0.3"
                      className="animate-ping"
                    />

                    {/* ⚠️ Road Shock Badge */}
                    <g transform={`translate(${midPoint.x - 9}, ${midPoint.y - 12})`}>
                      <polygon
                        points="9,1 17,15 1,15"
                        fill="#FF3366"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                        strokeLinejoin="round"
                      />
                      <text
                        x="9"
                        y="13"
                        fill="#FFFFFF"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        !
                      </text>
                    </g>
                  </>
                );
              })()}
            </g>
          )}

          {/* 4. Customer Landmark Nodes */}
          <g id="mini-osm-nodes">
            {nodes.map((n) => {
              if (n.isDepot) return null;
              const coords = getNodeDelhiCoords(n.id);
              const pt = delhiProjection.project(coords);
              const nodeColor = nodeColorMap.get(n.id) || '#00FF9D';
              const isShockNode = highlightEdge && (n.id === highlightEdge[0] || n.id === highlightEdge[1]);

              return (
                <g key={`mini-osm-node-${n.id}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="6.5"
                    fill="#0B0F19"
                    stroke={isShockNode && isAlert ? '#FF3366' : nodeColor}
                    strokeWidth={isShockNode && isAlert ? '2.2' : '1.5'}
                  />
                  <text
                    x={pt.x}
                    y={pt.y}
                    fill={isShockNode && isAlert ? '#FF3366' : '#FFFFFF'}
                    fontSize="7"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {n.id}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 5. Central Depot Node 0 (Connaught Place Hub) */}
          <g id="mini-osm-depot">
            {(() => {
              const cpCoords = getNodeDelhiCoords(0);
              const pt = delhiProjection.project(cpCoords);
              return (
                <>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="9"
                    fill="#EF4444"
                    fillOpacity="0.25"
                    className="animate-pulse"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="6.5"
                    fill="#EF4444"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                  />
                  <text
                    x={pt.x}
                    y={pt.y + 0.5}
                    fill="#FFFFFF"
                    fontSize="7"
                    fontWeight="900"
                    fontFamily="monospace"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    ★0
                  </text>
                </>
              );
            })()}
          </g>
        </svg>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: SYNTHETIC 2D GRAPH MINI-VIEW
  // ----------------------------------------------------
  return (
    <div className="relative w-52 sm:w-60 h-36 bg-[#080C14] rounded-xl border border-slate-800/80 overflow-hidden flex-shrink-0 shadow-inner select-none">
      <div className="absolute top-1.5 left-2 z-10 text-[8px] font-mono text-slate-500 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none">
        SYNTHETIC TOPOLOGY
      </div>

      <svg viewBox="120 40 370 340" className="w-full h-full select-none">
        <defs>
          <filter id="mini-glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Subtle background mesh */}
        <g opacity="0.15">
          {(edges || []).slice(0, 30).map((edge, idx) => {
            const n1 = getNode(edge.from);
            const n2 = getNode(edge.to);
            if (!n1 || !n2) return null;
            return (
              <line
                key={`mini-bg-edge-${idx}`}
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            );
          })}
        </g>

        {/* 2. Active Vehicle Routes (Smooth Curves) */}
        {routes.map((route) => {
          const seq = route.sequence || route.path || [];
          const pts = seq
            .map((id) => getNode(id))
            .filter((n): n is GraphNode => Boolean(n))
            .map((n) => ({ x: n.x, y: n.y }));

          if (pts.length < 2) return null;
          const pathD = generateSmoothCurvedPath(pts);

          return (
            <g key={`mini-synth-route-${route.vehicleId}`}>
              <path
                d={pathD}
                fill="none"
                stroke={route.color}
                strokeWidth="5"
                strokeOpacity="0.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={pathD}
                fill="none"
                stroke={route.color}
                strokeWidth="2.4"
                strokeOpacity="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {/* 3. Highlighted Road (Traffic Shock in Card B) */}
        {highlightEdge && (
          (() => {
            const n1 = getNode(highlightEdge[0]);
            const n2 = getNode(highlightEdge[1]);
            if (!n1 || !n2) return null;
            const midX = (n1.x + n2.x) / 2;
            const midY = (n1.y + n2.y) / 2;

            return (
              <g id="mini-traffic-shock">
                <line
                  x1={n1.x}
                  y1={n1.y}
                  x2={n2.x}
                  y2={n2.y}
                  stroke="#FF3366"
                  strokeWidth="4.5"
                  strokeDasharray="5,3"
                  strokeLinecap="round"
                  filter="url(#mini-glow-red)"
                />
                <line
                  x1={n1.x}
                  y1={n1.y}
                  x2={n2.x}
                  y2={n2.y}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                  strokeLinecap="round"
                />
                <circle
                  cx={midX}
                  cy={midY}
                  r="14"
                  fill="#FF3366"
                  fillOpacity="0.25"
                  className="animate-ping"
                />
                <g transform={`translate(${midX - 10}, ${midY - 14})`}>
                  <polygon
                    points="10,1 19,17 1,17"
                    fill="#FF3366"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <text
                    x="10"
                    y="15"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="sans-serif"
                  >
                    !
                  </text>
                </g>
              </g>
            );
          })()
        )}

        {/* 4. Customer Nodes */}
        {nodes.map((n) => {
          if (n.isDepot) return null;
          const nodeColor = nodeColorMap.get(n.id) || '#00FF9D';
          const isAffectedNode = highlightEdge && (n.id === highlightEdge[0] || n.id === highlightEdge[1]);

          return (
            <g key={`mini-node-${n.id}`}>
              <circle
                cx={n.x}
                cy={n.y}
                r="7.5"
                fill="#0B0F19"
                stroke={isAffectedNode && isAlert ? '#FF3366' : nodeColor}
                strokeWidth={isAffectedNode && isAlert ? '2.5' : '1.8'}
              />
              <text
                x={n.x}
                y={n.y}
                fill={isAffectedNode && isAlert ? '#FF3366' : '#FFFFFF'}
                fontSize="7.5"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {n.id}
              </text>
            </g>
          );
        })}

        {/* 5. Central Depot Star */}
        <g id="mini-depot-star">
          <polygon
            points="290,182 293.5,190.5 302,192 295.5,198 297.5,206.5 290,202 282.5,206.5 284.5,198 278,192 286.5,190.5"
            fill="#FBBF24"
            stroke="#F59E0B"
            strokeWidth="1.5"
          />
          <text
            x="290"
            y="218"
            fill="#FBBF24"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
          >
            0
          </text>
        </g>
      </svg>
    </div>
  );
};

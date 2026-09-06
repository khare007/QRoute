import React from 'react';
import { GraphNode, GraphEdge, VehicleRoute } from '../types';

interface MiniNetworkGraphProps {
  nodes: GraphNode[];
  routes: VehicleRoute[];
  highlightEdge?: [number, number];
  isAlert?: boolean;
  edges?: GraphEdge[];
}

export const MiniNetworkGraph: React.FC<MiniNetworkGraphProps> = ({
  nodes,
  routes,
  highlightEdge,
  isAlert = false,
  edges
}) => {
  const getNode = (id: number) => nodes.find((n) => n.id === id);
  const depot = nodes.find((n) => n.isDepot) || { id: 0, x: 290, y: 195, demand: 0, label: '0', isDepot: true };

  // Map each node to its route color for glowing node ring
  const nodeColorMap = new Map<number, string>();
  routes.forEach((route) => {
    route.path.forEach((id) => {
      if (id !== 0 && !nodeColorMap.has(id)) {
        nodeColorMap.set(id, route.color);
      }
    });
  });

  return (
    <div className="relative w-52 sm:w-60 h-36 bg-[#080C14] rounded-xl border border-slate-800/80 overflow-hidden flex-shrink-0 shadow-inner">
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

        {/* 1. Subtle background constellation network edges */}
        <g opacity="0.25">
          {(edges || []).slice(0, 35).map((edge, idx) => {
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

        {/* 2. Active Vehicle Routes (Polylines) */}
        {routes.map((route) => {
          const points = route.path
            .map((id) => {
              const n = getNode(id);
              return n ? `${n.x},${n.y}` : '';
            })
            .filter(Boolean)
            .join(' ');

          return (
            <g key={`mini-route-${route.vehicleId}`}>
              {/* Outer soft trace */}
              <polyline
                points={points}
                fill="none"
                stroke={route.color}
                strokeWidth="4"
                strokeOpacity="0.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Main colored route */}
              <polyline
                points={points}
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
                {/* Glowing red dashed road */}
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

                {/* Pulsing red alert halo */}
                <circle
                  cx={midX}
                  cy={midY}
                  r="14"
                  fill="#FF3366"
                  fillOpacity="0.25"
                  className="animate-ping"
                />

                {/* Warning Triangle Alert Badge */}
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

                {/* Alert circle around node 6 */}
                <circle
                  cx={n1.x}
                  cy={n1.y}
                  r="12"
                  fill="none"
                  stroke="#FF3366"
                  strokeWidth="2"
                  strokeDasharray="3,2"
                />
              </g>
            );
          })()
        )}

        {/* 4. Customer Nodes with IDs */}
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

        {/* 5. Central Depot Star (Node 0) */}
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

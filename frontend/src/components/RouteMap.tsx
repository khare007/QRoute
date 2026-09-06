import React, { useState } from 'react';
import {
  Crosshair,
  Plus,
  Minus,
  Maximize2,
  AlertOctagon,
  Star
} from 'lucide-react';
import { GraphNode, GraphEdge, VehicleRoute } from '../types';

interface RouteMapProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  routes: VehicleRoute[];
  isTrafficInjected: boolean;
  affectedEdge?: [number, number];
  title?: string;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  nodes,
  edges,
  routes,
  isTrafficInjected,
  affectedEdge = [6, 7],
  title = '1. OPTIMIZED ROUTES (BASE SCENARIO)'
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoveredRoute, setHoveredRoute] = useState<number | null>(null);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 2.2));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Helper to get node position by ID
  const getNode = (id: number): GraphNode | undefined => nodes.find((n) => n.id === id);

  // Check if edge is the affected road
  const isEdgeAffected = (from: number, to: number): boolean => {
    if (!isTrafficInjected || !affectedEdge) return false;
    return (
      (from === affectedEdge[0] && to === affectedEdge[1]) ||
      (from === affectedEdge[1] && to === affectedEdge[0])
    );
  };

  return (
    <div
      id="route-map-panel"
      className="relative flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden h-full min-h-[420px]"
    >
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00A3FF] shadow-[0_0_8px_#00A3FF]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {title}
          </span>
        </div>
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          {routes.map((route) => (
            <div
              key={`legend-v-${route.vehicleId}`}
              onMouseEnter={() => setHoveredRoute(route.vehicleId)}
              onMouseLeave={() => setHoveredRoute(null)}
              className={`flex items-center space-x-1.5 px-1.5 py-0.5 rounded cursor-pointer transition ${
                hoveredRoute === route.vehicleId ? 'bg-slate-800' : ''
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: route.color,
                  boxShadow: `0 0 8px ${route.color}`
                }}
              />
              <span className="text-[10px] text-slate-300 font-mono font-bold">V{route.vehicleId}</span>
            </div>
          ))}
          {isTrafficInjected && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/70 text-[10px] text-rose-300 font-mono animate-pulse">
              <AlertOctagon className="w-3 h-3 text-rose-400" />
              <span>Shock: Edge {affectedEdge[0]}→{affectedEdge[1]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:20px_20px] bg-[#0B0F19] overflow-hidden select-none">
        {/* Floating Controls (Top-Right) */}
        <div
          id="map-controls"
          className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-black/60 backdrop-blur border border-slate-700 rounded-lg p-1 text-slate-300 shadow-md"
        >
          <button
            onClick={handleResetZoom}
            title="Center Graph"
            className="p-1.5 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset View"
            className="p-1.5 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Data Grid Badges (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur p-2 border border-slate-700 rounded-lg text-[9px] uppercase tracking-tighter z-10 pointer-events-none font-mono">
          <div className="text-white font-semibold">DEPOT: Node 0</div>
          <div className="text-slate-400">EDGES: 62 ACTIVE</div>
        </div>

        {/* SVG Interactive Canvas */}
        <svg
          viewBox="0 0 600 420"
          className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`
          }}
        >
          <defs>
            {/* Subtle Grid Pattern */}
            <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.75" fill="#1E293B" />
            </pattern>
            {/* Glow Filters */}
            <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-red-shock" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="600" height="420" fill="#0D1322" />
          <rect width="600" height="420" fill="url(#grid-dots)" />

          {/* 1. Base Road Network (Thin Gray Edges) */}
          <g id="base-edges" opacity="0.45">
            {edges.map((edge, idx) => {
              const fromNode = getNode(edge.from);
              const toNode = getNode(edge.to);
              if (!fromNode || !toNode) return null;
              return (
                <line
                  key={`edge-${idx}`}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="#334155"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
              );
            })}
          </g>

          {/* 2. Injected Traffic Edge (Highlighted if active) */}
          {isTrafficInjected && affectedEdge && (
            <g id="traffic-shock-edge">
              {(() => {
                const n1 = getNode(affectedEdge[0]);
                const n2 = getNode(affectedEdge[1]);
                if (!n1 || !n2) return null;
                return (
                  <>
                    <line
                      x1={n1.x}
                      y1={n1.y}
                      x2={n2.x}
                      y2={n2.y}
                      stroke="#FF3366"
                      strokeWidth="5"
                      strokeLinecap="round"
                      filter="url(#glow-red-shock)"
                      className="animate-pulse"
                    />
                    <line
                      x1={n1.x}
                      y1={n1.y}
                      x2={n2.x}
                      y2={n2.y}
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                      strokeDasharray="4,4"
                      strokeLinecap="round"
                    />
                  </>
                );
              })()}
            </g>
          )}

          {/* 3. Vehicle Routes (Highlighted Paths) */}
          <g id="vehicle-routes">
            {routes.map((route) => {
              const isDimmed = hoveredRoute !== null && hoveredRoute !== route.vehicleId;
              const points = route.path
                .map((nodeId) => {
                  const node = getNode(nodeId);
                  return node ? `${node.x},${node.y}` : '';
                })
                .filter(Boolean)
                .join(' ');

              return (
                <g
                  key={`route-${route.vehicleId}`}
                  onMouseEnter={() => setHoveredRoute(route.vehicleId)}
                  onMouseLeave={() => setHoveredRoute(null)}
                  opacity={isDimmed ? 0.3 : 1}
                  className="transition-opacity duration-200"
                >
                  {/* Outer Glow Path */}
                  <polyline
                    points={points}
                    fill="none"
                    stroke={route.color}
                    strokeWidth="6"
                    strokeOpacity="0.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Core Route Path */}
                  <polyline
                    points={points}
                    fill="none"
                    stroke={route.color}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </g>

          {/* 4. Graph Nodes */}
          <g id="graph-nodes">
            {nodes.map((node) => {
              const isDepot = node.isDepot;
              const isHovered = hoveredNode?.id === node.id;
              const isAffectedEndpoint =
                isTrafficInjected &&
                (node.id === affectedEdge[0] || node.id === affectedEdge[1]);

              return (
                <g
                  key={`node-${node.id}`}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {isDepot ? (
                    // Depot Node 0 (Gold Star)
                    <>
                      <circle
                        r="14"
                        fill="#F59E0B"
                        fillOpacity="0.2"
                        className="animate-pulse"
                      />
                      <polygon
                        points="0,-8 2.5,-2.5 8,-2.5 3.5,1.5 5.5,7 0,3.5 -5.5,7 -3.5,1.5 -8,-2.5 -2.5,-2.5"
                        fill="#FBBF24"
                        stroke="#FFF"
                        strokeWidth="1"
                        filter="url(#glow-gold)"
                      />
                      <text
                        y="16"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#FDE68A"
                        className="font-mono pointer-events-none"
                      >
                        0 (Depot)
                      </text>
                    </>
                  ) : (
                    // Customer Nodes (Circles with glow and number)
                    <>
                      {/* Pulse halo for traffic affected nodes */}
                      {isAffectedEndpoint && (
                        <circle
                          r="12"
                          fill="#FF3366"
                          fillOpacity="0.3"
                          className="animate-ping"
                        />
                      )}
                      {/* Base Node Circle */}
                      <circle
                        r={isHovered ? '9' : '7.5'}
                        fill={isAffectedEndpoint ? '#FF3366' : '#1E293B'}
                        stroke={
                          isAffectedEndpoint
                            ? '#FF6688'
                            : isHovered
                            ? '#00FF9D'
                            : '#00A3FF'
                        }
                        strokeWidth="1.5"
                        className="transition-all duration-150"
                      />
                      {/* Inner dot */}
                      <circle
                        r="2.5"
                        fill={isAffectedEndpoint ? '#FFFFFF' : '#00FF9D'}
                      />
                      {/* Node Label */}
                      <text
                        y="3"
                        textAnchor="middle"
                        fontSize="7.5"
                        fontWeight="bold"
                        fill="#FFFFFF"
                        className="font-mono pointer-events-none select-none"
                      >
                        {node.id}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredNode && (
          <div
            id="node-hover-tooltip"
            className="absolute bottom-3 left-3 z-20 bg-[#0B0F19]/95 backdrop-blur border border-cyan-500/40 rounded-lg p-2 text-xs shadow-xl pointer-events-none font-mono text-gray-200 flex items-center gap-3"
          >
            <div>
              <span className="text-gray-400 text-[10px] block">NODE</span>
              <span className="font-bold text-[#00A3FF]">
                {hoveredNode.isDepot ? 'Node 0 (Central Depot)' : `Customer #${hoveredNode.id}`}
              </span>
            </div>
            {!hoveredNode.isDepot && (
              <div>
                <span className="text-gray-400 text-[10px] block">DEMAND</span>
                <span className="font-bold text-[#00FF9D]">{hoveredNode.demand} units</span>
              </div>
            )}
            <div>
              <span className="text-gray-400 text-[10px] block">COORDINATES</span>
              <span className="text-gray-300">({hoveredNode.x}, {hoveredNode.y})</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

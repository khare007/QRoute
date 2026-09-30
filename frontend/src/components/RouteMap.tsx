import React, { useState } from 'react';
import {
  Crosshair,
  Plus,
  Minus,
  Maximize2,
  AlertOctagon,
  Star,
  Map as MapIcon,
  GitFork,
  Columns
} from 'lucide-react';
import { GraphNode, GraphEdge, VehicleRoute } from '../types';
import { DelhiOsmMap } from './DelhiOsmMap';

interface RouteMapProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  routes: VehicleRoute[];
  isTrafficInjected: boolean;
  affectedEdge?: [number, number];
  title?: string;
  dataset?: string;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  nodes,
  edges,
  routes,
  isTrafficInjected,
  affectedEdge = [6, 7],
  title = '1. OPTIMIZED ROUTES (BASE SCENARIO)',
  dataset = 'Synthetic Graph'
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoveredRoute, setHoveredRoute] = useState<number | null>(null);

  // Map display mode: 'osm' | 'synthetic' | 'dual'
  const [mapMode, setMapMode] = useState<'osm' | 'synthetic' | 'dual'>(
    dataset === 'Real Delhi Map (OSM)' ? 'osm' : 'dual'
  );

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

  // Helper to generate smooth Catmull-Rom to Cubic Bézier curved path for route sequence
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

  const renderSyntheticCanvas = () => (
    <div className="relative flex-1 w-full h-full min-h-[380px] bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:20px_20px] bg-[#0B0F19] overflow-hidden select-none">
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
        <div className="text-slate-400">NODES: {nodes.length} | EDGES: {edges.length}</div>
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
          <filter id="glow-route" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
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

        {/* 1. Base Road Network (Ultra-subtle, non-distracting background grid) */}
        <g id="base-edges" opacity="0.15">
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
                stroke="#475569"
                strokeWidth="0.8"
                strokeDasharray="2,3"
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

        {/* 3. Vehicle Routes (Smooth Glowing Curves matching Real Map Aesthetics) */}
        <g id="vehicle-routes">
          {routes.map((route) => {
            const isDimmed = hoveredRoute !== null && hoveredRoute !== route.vehicleId;
            const isHovered = hoveredRoute === route.vehicleId;
            const seq = route.sequence || route.path || [];
            const pts = seq
              .map((nodeId) => getNode(nodeId))
              .filter((n): n is GraphNode => Boolean(n))
              .map((n) => ({ x: n.x, y: n.y }));

            if (pts.length < 2) return null;
            const pathD = generateSmoothCurvedPath(pts);

            return (
              <g
                key={`route-${route.vehicleId}`}
                onMouseEnter={() => setHoveredRoute(route.vehicleId)}
                onMouseLeave={() => setHoveredRoute(null)}
                opacity={isDimmed ? 0.2 : 1}
                className="transition-opacity duration-200 cursor-pointer"
              >
                {/* Outer Ambient Glow Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={route.color}
                  strokeWidth={isHovered ? 10 : 7}
                  strokeOpacity={isHovered ? 0.45 : 0.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow-route)"
                />
                {/* Mid Glow Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={route.color}
                  strokeWidth={isHovered ? 4.5 : 3.2}
                  strokeOpacity={0.65}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Core Laser Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={route.color}
                  strokeWidth={isHovered ? 2.8 : 2.0}
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
  );

  return (
    <div
      id="route-map-panel"
      className="relative flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden h-full min-h-[440px]"
    >
      {/* Panel Header */}
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90 flex-nowrap overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00A3FF] shadow-[0_0_8px_#00A3FF]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300 font-mono whitespace-nowrap">
              {title}
            </span>
          </div>

          {/* Dual-Map Display Mode Selector (Tabs) */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono flex-shrink-0">
            <button
              onClick={() => setMapMode('osm')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded cursor-pointer transition whitespace-nowrap ${
                mapMode === 'osm'
                  ? 'bg-[#00FF9D]/20 text-[#00FF9D] font-bold border border-[#00FF9D]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3 h-3 text-[#00FF9D]" />
              <span>Real Delhi Map (OSM)</span>
            </button>
            <button
              onClick={() => setMapMode('synthetic')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded cursor-pointer transition whitespace-nowrap ${
                mapMode === 'synthetic'
                  ? 'bg-[#00A3FF]/20 text-[#00A3FF] font-bold border border-[#00A3FF]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitFork className="w-3 h-3 text-[#00A3FF]" />
              <span>Synthetic Graph (2D)</span>
            </button>
            <button
              onClick={() => setMapMode('dual')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded cursor-pointer transition whitespace-nowrap ${
                mapMode === 'dual'
                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3 h-3 text-purple-400" />
              <span>Dual View (Split)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0 flex-nowrap">
          {routes.map((route) => (
            <div
              key={`legend-v-${route.vehicleId}`}
              onMouseEnter={() => setHoveredRoute(route.vehicleId)}
              onMouseLeave={() => setHoveredRoute(null)}
              className={`flex items-center space-x-1.5 px-1.5 py-0.5 rounded cursor-pointer transition ${
                hoveredRoute === route.vehicleId ? 'bg-slate-800 ring-1 ring-white/20' : ''
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

      {/* Main Map Content Area based on Selected Mode */}
      <div className="relative flex-1 w-full h-full min-h-[400px]">
        {mapMode === 'osm' && (
          <DelhiOsmMap
            nodes={nodes}
            edges={edges}
            routes={routes}
            isTrafficInjected={isTrafficInjected}
            affectedEdge={affectedEdge}
            title="Real Delhi Map (OSM)"
          />
        )}

        {mapMode === 'synthetic' && renderSyntheticCanvas()}

        {mapMode === 'dual' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 h-full w-full p-2 bg-[#0B0F19]">
            {/* Left: Real Delhi Map (OSM) */}
            <div className="border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[400px] xl:h-full">
              <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-300">
                <span className="flex items-center gap-1.5 text-[#00FF9D] font-bold">
                  <MapIcon className="w-3 h-3" /> Real Delhi Map (OSM)
                </span>
                <span className="text-slate-500">Leaflet Polyline (routes.real_map_coords)</span>
              </div>
              <div className="flex-1 relative">
                <DelhiOsmMap
                  nodes={nodes}
                  edges={edges}
                  routes={routes}
                  isTrafficInjected={isTrafficInjected}
                  affectedEdge={affectedEdge}
                  title="Delhi OSM Map"
                />
              </div>
            </div>

            {/* Right: Synthetic Graph (2D Canvas/SVG) */}
            <div className="border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[400px] xl:h-full">
              <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-300">
                <span className="flex items-center gap-1.5 text-[#00A3FF] font-bold">
                  <GitFork className="w-3 h-3" /> Synthetic Graph (2D Canvas)
                </span>
                <span className="text-slate-500">Interactive SVG (routes.sequence)</span>
              </div>
              <div className="flex-1 relative">
                {renderSyntheticCanvas()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

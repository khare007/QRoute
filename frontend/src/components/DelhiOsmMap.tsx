import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GraphNode, GraphEdge, VehicleRoute } from '../types';
import {
  getNodeDelhiCoords,
  getNodeName,
  DELHI_CENTER,
  getRouteRealMapCoords,
  fetchOsrmRouteGeometry,
  getRoadSegmentPoints,
  DELHI_ROAD_NETWORK_EDGES,
  DelhiRoadEdge,
  OSRM_CLIENT_CACHE
} from '../utils/delhiCoordinates';
import {
  Crosshair,
  Plus,
  Minus,
  Layers,
  AlertOctagon,
  Activity,
  Navigation,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DelhiOsmMapProps {
  nodes: GraphNode[];
  edges?: GraphEdge[];
  routes: VehicleRoute[];
  isTrafficInjected?: boolean;
  affectedEdge?: [number, number];
  title?: string;
}

// Controller to smoothly fit map bounds and handle custom zoom buttons
const MapController: React.FC<{
  coords: [number, number][];
  zoomAction: { type: 'in' | 'out' | 'reset'; ts: number } | null;
  mapTileStyle?: string;
}> = ({ coords, zoomAction, mapTileStyle }) => {
  const map = useMap();

  // Invalidate size on mount, style switch, and container resize so tiles cover 100% of the canvas
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    handleResize();
    const t1 = setTimeout(handleResize, 100);
    const t2 = setTimeout(handleResize, 350);
    const t3 = setTimeout(handleResize, 700);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [map, mapTileStyle]);

  // Fit bounds on coords change
  useEffect(() => {
    if (!coords || coords.length === 0) return;
    try {
      const bounds = L.latLngBounds(coords.map((c) => L.latLng(c[0], c[1])));
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14, animate: true });
      map.invalidateSize();
    } catch {
      // Fallback
    }
  }, [coords, map]);

  // Handle custom zoom in/out/reset triggers
  useEffect(() => {
    if (!zoomAction) return;
    if (zoomAction.type === 'in') {
      map.zoomIn();
    } else if (zoomAction.type === 'out') {
      map.zoomOut();
    } else if (zoomAction.type === 'reset' && coords.length > 0) {
      try {
        const bounds = L.latLngBounds(coords.map((c) => L.latLng(c[0], c[1])));
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14, animate: true });
      } catch {
        map.setView(DELHI_CENTER, 12);
      }
    }
  }, [zoomAction, map, coords]);

  return null;
};

// Custom DivIcons for Map Nodes
const createDepotIcon = () => {
  return L.divIcon({
    className: 'custom-depot-marker',
    html: `
      <div style="
        width: 34px;
        height: 34px;
        background: radial-gradient(circle, #EF4444 0%, #B91C1C 100%);
        border: 2.5px solid #FFFFFF;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-weight: 900;
        font-size: 12px;
        font-family: monospace;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.95), 0 0 6px #FFFFFF;
        cursor: pointer;
      ">
        ★ 0
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });
};

const createCustomerIcon = (id: number, color: string = '#00A3FF', isShock: boolean = false) => {
  return L.divIcon({
    className: `custom-customer-marker-${id}`,
    html: `
      <div style="
        width: 26px;
        height: 26px;
        background: ${isShock ? '#FF3366' : '#0B0F19'};
        border: 2px solid ${isShock ? '#FFFFFF' : color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-weight: 700;
        font-size: 10px;
        font-family: monospace;
        box-shadow: 0 0 12px ${isShock ? 'rgba(255, 51, 102, 0.9)' : color + '70'};
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${id}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14]
  });
};

const createIncidentIcon = () => {
  return L.divIcon({
    className: 'custom-incident-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: #FF3366;
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 16px;
        box-shadow: 0 0 24px rgba(255, 51, 102, 1);
        cursor: pointer;
      ">
        ⚠️
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

export const DelhiOsmMap: React.FC<DelhiOsmMapProps> = ({
  nodes,
  routes,
  isTrafficInjected = false,
  affectedEdge = [6, 7],
  title = 'Real Delhi Map (OSM)'
}) => {
  const [isClient, setIsClient] = useState<boolean>(false);
  const [mapTileStyle, setMapTileStyle] = useState<'dark' | 'osm' | 'satellite'>('dark');
  const [showRoadNetwork, setShowRoadNetwork] = useState<boolean>(false);
  const [hoveredRoute, setHoveredRoute] = useState<number | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [isFleetSummaryOpen, setIsFleetSummaryOpen] = useState<boolean>(true);
  const [zoomTrigger, setZoomTrigger] = useState<{ type: 'in' | 'out' | 'reset'; ts: number } | null>(null);

  // Dynamic asynchronous real street geometries fetched from OSRM
  const [snappedRouteGeometries, setSnappedRouteGeometries] = useState<Record<number, [number, number][]>>({});
  const [snappedShockGeometry, setSnappedShockGeometry] = useState<[number, number][] | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch real OSRM street geometries for all vehicle routes whenever routes change
  useEffect(() => {
    let isMounted = true;
    routes.forEach((r) => {
      const seq = r.sequence || r.path || [];
      if (seq.length >= 2) {
        const fallback = getRouteRealMapCoords(seq);
        setSnappedRouteGeometries((prev) => ({
          ...prev,
          [r.vehicleId]: prev[r.vehicleId] || fallback
        }));

        fetchOsrmRouteGeometry(seq).then((osrmCoords) => {
          if (isMounted && osrmCoords && osrmCoords.length > 0) {
            setSnappedRouteGeometries((prev) => ({
              ...prev,
              [r.vehicleId]: osrmCoords
            }));
          }
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [routes]);

  // Fetch real physical OSRM street geometry for the shocked traffic incident corridor
  useEffect(() => {
    if (!isTrafficInjected || !affectedEdge) {
      setSnappedShockGeometry(null);
      return;
    }
    let isMounted = true;
    const edgeSeq = [affectedEdge[0], affectedEdge[1]];
    const cacheKey = `${affectedEdge[0]}-${affectedEdge[1]}`;
    const reverseKey = `${affectedEdge[1]}-${affectedEdge[0]}`;

    if (OSRM_CLIENT_CACHE.has(cacheKey)) {
      setSnappedShockGeometry(OSRM_CLIENT_CACHE.get(cacheKey)!);
    } else if (OSRM_CLIENT_CACHE.has(reverseKey)) {
      setSnappedShockGeometry([...OSRM_CLIENT_CACHE.get(reverseKey)!].reverse());
    }

    fetchOsrmRouteGeometry(edgeSeq).then((osrmCoords) => {
      if (isMounted && osrmCoords && osrmCoords.length >= 2) {
        setSnappedShockGeometry(osrmCoords);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isTrafficInjected, affectedEdge]);

  // Map each customer node to its route color
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

  // Extract all coordinates for auto-fit bounds
  const allCoords = useMemo(() => {
    const coords: [number, number][] = [];
    nodes.forEach((n) => {
      coords.push(getNodeDelhiCoords(n.id));
    });
    routes.forEach((r) => {
      const routeCoords =
        snappedRouteGeometries[r.vehicleId] ||
        (r.real_map_coords && r.real_map_coords.length > 0
          ? r.real_map_coords
          : getRouteRealMapCoords(r.sequence || r.path || []));
      routeCoords.forEach((c) => coords.push(c));
    });
    return coords.length > 0 ? coords : [DELHI_CENTER];
  }, [nodes, routes, snappedRouteGeometries]);

  // Total Real Fleet Distance (Calculated from true routes)
  const totalFleetDistance = useMemo(() => {
    return routes.reduce((acc, r) => acc + (typeof r.distance === 'number' ? r.distance : 0), 0);
  }, [routes]);

  // Traffic shock road segment waypoints & midpoint (snapped directly to physical street asphalt)
  const shockData = useMemo(() => {
    if (!isTrafficInjected || !affectedEdge) return null;
    const p1 = getNodeDelhiCoords(affectedEdge[0]);
    const p2 = getNodeDelhiCoords(affectedEdge[1]);
    const cacheKey = `${affectedEdge[0]}-${affectedEdge[1]}`;
    const reverseKey = `${affectedEdge[1]}-${affectedEdge[0]}`;

    const roadPoints =
      (snappedShockGeometry && snappedShockGeometry.length >= 2)
        ? snappedShockGeometry
        : (OSRM_CLIENT_CACHE.get(cacheKey) ||
           (OSRM_CLIENT_CACHE.has(reverseKey) ? [...OSRM_CLIENT_CACHE.get(reverseKey)!].reverse() : null) ||
           getRoadSegmentPoints(p1, p2));

    const midIdx = Math.floor(roadPoints.length / 2);
    const midPoint = roadPoints[midIdx] || [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

    return {
      roadPoints,
      midPoint: midPoint as [number, number],
      fromName: getNodeName(affectedEdge[0]),
      toName: getNodeName(affectedEdge[1])
    };
  }, [isTrafficInjected, affectedEdge, snappedShockGeometry]);

  if (!isClient) {
    return (
      <div className="w-full h-full min-h-[420px] bg-[#0B0F19] flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span>Initializing Real Delhi Road Network Map...</span>
        </div>
      </div>
    );
  }

  // High-Contrast Free Tile Layers (NO WATERMARK, NO API KEY)
  let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  let tileAttribution = '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ';

  if (mapTileStyle === 'osm') {
    tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    tileAttribution = '&copy; OpenStreetMap contributors';
  } else if (mapTileStyle === 'satellite') {
    tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    tileAttribution = '&copy; Esri, Earthstar Geographics';
  }

  return (
    <div className="relative w-full h-full min-h-[420px] flex flex-col bg-[#0B0F19] select-none overflow-hidden">
      {/* 1. Header Controls - Fixed Single Row Layout (No jumping/wrapping) */}
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/95 z-20 flex-nowrap overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF9D] shadow-[0_0_10px_#00FF9D] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-200 font-mono whitespace-nowrap">
            {title}
          </span>
          <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 whitespace-nowrap">
            Road-Snapped Routing Engine
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-nowrap">
          {/* Traffic Shock Live Indicator */}
          {isTrafficInjected && affectedEdge && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-950/90 border border-rose-600 text-[10px] text-rose-300 font-mono animate-pulse shadow-[0_0_12px_rgba(255,51,102,0.4)] whitespace-nowrap">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span>Shock: {affectedEdge[0]} ↔ {affectedEdge[1]} (95%)</span>
            </div>
          )}

          {/* Road Network Layer Toggle - Fixed width to prevent any jumping */}
          <button
            onClick={() => setShowRoadNetwork((prev) => !prev)}
            className={`flex items-center justify-center gap-1.5 w-[122px] py-1 rounded text-[10px] font-mono cursor-pointer transition border whitespace-nowrap select-none ${
              showRoadNetwork
                ? 'bg-emerald-950/80 border-emerald-500/60 text-[#00FF9D] font-bold shadow-[0_0_8px_rgba(0,255,157,0.2)]'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle Delhi Arterial Road Congestion Heatmap"
          >
            <Activity className="w-3 h-3 flex-shrink-0" />
            <span>Traffic Grid: {showRoadNetwork ? 'ON' : 'OFF'}</span>
          </button>

          {/* Map Style Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono flex-shrink-0">
            <button
              onClick={() => setMapTileStyle('dark')}
              className={`px-2.5 py-0.5 rounded cursor-pointer transition whitespace-nowrap ${
                mapTileStyle === 'dark'
                  ? 'bg-[#00A3FF]/20 text-[#00A3FF] font-bold border border-[#00A3FF]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark Matrix
            </button>
            <button
              onClick={() => setMapTileStyle('osm')}
              className={`px-2.5 py-0.5 rounded cursor-pointer transition whitespace-nowrap ${
                mapTileStyle === 'osm'
                  ? 'bg-emerald-500/20 text-[#00FF9D] font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              OSM Streets
            </button>
            <button
              onClick={() => setMapTileStyle('satellite')}
              className={`px-2.5 py-0.5 rounded cursor-pointer transition whitespace-nowrap ${
                mapTileStyle === 'satellite'
                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* 2. Leaflet Map Container */}
      <div className="relative flex-1 w-full h-full min-h-[380px]">
        {/* Custom Unblocked Floating Zoom Controls (Top-Right) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-black/75 backdrop-blur border border-slate-700 rounded-lg p-1 text-slate-300 shadow-xl">
          <button
            onClick={() => setZoomTrigger({ type: 'reset', ts: Date.now() })}
            title="Fit Active Routes"
            className="p-1.5 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#00FF9D]" />
          </button>
          <button
            onClick={() => setZoomTrigger({ type: 'in', ts: Date.now() })}
            title="Zoom In"
            className="p-1.5 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomTrigger({ type: 'out', ts: Date.now() })}
            title="Zoom Out"
            className="p-1.5 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Comprehensive Fleet Summary Card (Bottom-Left Position - Completely Free of Zoom Buttons!) */}
        <div className="absolute bottom-3 left-3 z-10 bg-slate-950/90 backdrop-blur-md px-3 py-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 shadow-2xl pointer-events-auto flex flex-col gap-1.5 max-w-[240px] transition-all">
          <div
            onClick={() => setIsFleetSummaryOpen((prev) => !prev)}
            className="flex items-center justify-between cursor-pointer border-b border-slate-800/80 pb-1 gap-2"
          >
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white font-bold tracking-wide">
                Delhi Fleet ({routes.length} V)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#00FF9D] font-bold">
                {totalFleetDistance.toFixed(1)} km
              </span>
              {isFleetSummaryOpen ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </div>
          </div>

          {isFleetSummaryOpen && (
            <div className="space-y-1 text-[10px] pt-0.5">
              {/* Central Depot */}
              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white flex-shrink-0" />
                  <span>Depot 0 (CP)</span>
                </div>
                <span className="text-slate-500 text-[9px]">Hub</span>
              </div>

              {/* Individual Vehicle Routes */}
              {routes.map((route) => {
                const isHovered = hoveredRoute === route.vehicleId;
                return (
                  <div
                    key={`fleet-item-v-${route.vehicleId}`}
                    onMouseEnter={() => setHoveredRoute(route.vehicleId)}
                    onMouseLeave={() => setHoveredRoute(null)}
                    className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition ${
                      isHovered ? 'bg-slate-800 ring-1 ring-white/30' : 'hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: route.color, boxShadow: `0 0 6px ${route.color}` }}
                      />
                      <span className="font-bold" style={{ color: route.color }}>
                        Route {route.vehicleId}
                      </span>
                    </div>
                    <span className="text-slate-200 font-bold font-mono text-[9.5px]">
                      {route.distance.toFixed(1)} km
                    </span>
                  </div>
                );
              })}

              {/* Traffic Shock Alert Status */}
              {isTrafficInjected && (
                <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-rose-400 font-bold animate-pulse">
                  <span className="flex items-center gap-1 text-[9.5px]">
                    <span>⚠️</span>
                    <span>Shock Incident</span>
                  </span>
                  <span className="text-[9px] bg-rose-950 px-1 py-0.5 rounded border border-rose-800">
                    95% Jam
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <MapContainer
          center={DELHI_CENTER}
          zoom={12}
          zoomControl={false}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', minHeight: '380px', backgroundColor: '#0B0F19' }}
          className="z-0 w-full h-full"
        >
          <TileLayer
            key={mapTileStyle}
            attribution={tileAttribution}
            url={tileUrl}
            maxZoom={19}
          />

          <MapController coords={allCoords} zoomAction={zoomTrigger} mapTileStyle={mapTileStyle} />

          {/* LAYER 1: Optional Delhi Arterial Road Corridors Grid */}
          {showRoadNetwork &&
            DELHI_ROAD_NETWORK_EDGES.map((edge) => {
              const isAffected =
                isTrafficInjected &&
                affectedEdge &&
                ((edge.fromId === affectedEdge[0] && edge.toId === affectedEdge[1]) ||
                  (edge.fromId === affectedEdge[1] && edge.toId === affectedEdge[0]));

              let edgeColor = '#10B981';
              let opacity = 0.5;
              let weight = 3.0;

              if (edge.congestion >= 0.70) {
                edgeColor = '#EF4444';
                opacity = 0.8;
                weight = 4.0;
              } else if (edge.congestion >= 0.35) {
                edgeColor = '#F59E0B';
                opacity = 0.65;
                weight = 3.5;
              }

              if (isAffected) {
                edgeColor = '#FF3366';
                opacity = 0.95;
                weight = 5.5;
              }

              const isHovered = hoveredEdgeId === edge.id;

              return (
                <Polyline
                  key={`road-edge-${edge.id}`}
                  positions={edge.coords}
                  eventHandlers={{
                    mouseover: () => setHoveredEdgeId(edge.id),
                    mouseout: () => setHoveredEdgeId(null)
                  }}
                  pathOptions={{
                    color: edgeColor,
                    weight: isHovered ? weight + 2 : weight,
                    opacity: isHovered ? 1.0 : opacity,
                    lineCap: 'round',
                    lineJoin: 'round',
                    dashArray: isAffected ? '8, 6' : undefined
                  }}
                >
                  <Tooltip sticky>
                    <div className="font-mono text-xs text-slate-900 p-1">
                      <div className="font-bold">{edge.fromName} ↔ {edge.toName}</div>
                      <div className="text-[11px] text-slate-700">
                        Congestion: <strong style={{ color: edgeColor }}>{(edge.congestion * 100).toFixed(0)}%</strong>
                      </div>
                    </div>
                  </Tooltip>
                </Polyline>
              );
            })}

          {/* LAYER 2: Traffic Shock Incident Polyline & Animated ⚠️ Hazard Marker */}
          {shockData && (
            <>
              {/* Highlighted Glowing Shock Polyline */}
              <Polyline
                positions={shockData.roadPoints}
                pathOptions={{
                  color: '#FF3366',
                  weight: 8,
                  opacity: 0.95,
                  dashArray: '10, 8',
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              >
                <Popup>
                  <div className="p-1 font-mono text-xs text-slate-900">
                    <span className="font-bold text-rose-600 block text-sm">⚠️ High Traffic Shock</span>
                    <div className="mt-1 text-[11px]">
                      <div>Corridor: {shockData.fromName} ↔ {shockData.toName}</div>
                      <div>Congestion Index: <strong>95% (Severe Jam)</strong></div>
                      <div className="text-emerald-700 font-bold mt-1">✓ QPSO Dynamically Rerouting Fleet</div>
                    </div>
                  </div>
                </Popup>
              </Polyline>

              {/* Center ⚠️ Incident Marker */}
              <Marker position={shockData.midPoint} icon={createIncidentIcon()}>
                <Tooltip direction="top" offset={[0, -18]} opacity={0.95} permanent>
                  <div className="font-mono text-xs text-rose-700 font-bold p-0.5">
                    ⚠️ Road Shock: {affectedEdge[0]} ↔ {affectedEdge[1]}
                  </div>
                </Tooltip>
              </Marker>
            </>
          )}

          {/* LAYER 3: Snapped Vehicle Routes (Multi-waypoint physical street curves with neon glow) */}
          {routes.map((route) => {
            const polyCoords: [number, number][] =
              snappedRouteGeometries[route.vehicleId] ||
              (route.real_map_coords && route.real_map_coords.length > 0
                ? route.real_map_coords
                : getRouteRealMapCoords(route.sequence || route.path || []));

            if (polyCoords.length < 2) return null;

            const isDimmed = hoveredRoute !== null && hoveredRoute !== route.vehicleId;
            const isHovered = hoveredRoute === route.vehicleId;
            const seq = route.sequence || route.path || [];

            return (
              <React.Fragment key={`osm-route-${route.vehicleId}`}>
                {/* Glow Outer Polyline */}
                <Polyline
                  positions={polyCoords}
                  pathOptions={{
                    color: route.color,
                    weight: isHovered ? 11 : 8,
                    opacity: isDimmed ? 0.10 : isHovered ? 0.60 : 0.35,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                />
                {/* Sharp Core Polyline */}
                <Polyline
                  positions={polyCoords}
                  eventHandlers={{
                    mouseover: () => setHoveredRoute(route.vehicleId),
                    mouseout: () => setHoveredRoute(null)
                  }}
                  pathOptions={{
                    color: route.color,
                    weight: isHovered ? 5.2 : 4.0,
                    opacity: isDimmed ? 0.25 : 1.0,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                >
                  <Tooltip sticky>
                    <div className="font-mono text-xs text-slate-900 p-1">
                      <div className="font-bold flex items-center gap-1.5" style={{ color: route.color }}>
                        <Navigation className="w-3 h-3" />
                        {route.name || `Vehicle ${route.vehicleId}`} (Optimal Path)
                      </div>
                      <div className="mt-1 text-[11px] space-y-0.5">
                        <div>Stops: <strong>{Math.max(0, seq.length - 2)} deliveries</strong></div>
                        <div>Road Distance: <strong>{route.distance.toFixed(1)} km</strong></div>
                        <div>Transit Time: <strong>{route.time.toFixed(1)} mins</strong></div>
                        <div>Vehicle Load: <strong>{route.load} / 100 Q</strong></div>
                      </div>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="font-mono text-xs text-slate-900 p-1.5">
                      <div className="font-bold mb-1 text-sm flex items-center gap-1.5" style={{ color: route.color }}>
                        <span>{route.name || `Vehicle ${route.vehicleId}`}</span>
                        <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">QPSO Snapped</span>
                      </div>
                      <div className="text-[11px] space-y-1">
                        <div>
                          <strong>Turn-by-Turn Route:</strong>
                          <div className="text-[10px] text-slate-700 bg-slate-100 p-1 rounded mt-0.5 max-h-20 overflow-y-auto">
                            {seq.map((nodeId, idx) => (
                              <span key={`seq-${idx}`}>
                                {getNodeName(nodeId)} ({nodeId})
                                {idx < seq.length - 1 ? ' → ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-200">
                          <div>Distance: <strong>{route.distance.toFixed(2)} km</strong></div>
                          <div>Travel Time: <strong>{route.time.toFixed(1)} mins</strong></div>
                          <div>Capacity: <strong>{route.load}/100</strong></div>
                          <div>Waypoints: <strong>{polyCoords.length} pts</strong></div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Polyline>
              </React.Fragment>
            );
          })}

          {/* LAYER 4: Node Markers (Depot at CP + Customer Landmarks) */}
          {nodes.map((node) => {
            const coords = getNodeDelhiCoords(node.id);
            const landmarkName = getNodeName(node.id);
            const isDepot = node.isDepot;
            const isShock =
              isTrafficInjected && affectedEdge && (node.id === affectedEdge[0] || node.id === affectedEdge[1]);
            const color = isDepot ? '#EF4444' : nodeColorMap.get(node.id) || '#00FF9D';
            const icon = isDepot ? createDepotIcon() : createCustomerIcon(node.id, color, Boolean(isShock));

            return (
              <Marker key={`osm-marker-${node.id}`} position={coords} icon={icon}>
                <Tooltip direction="top" offset={[0, -14]} opacity={0.95}>
                  <div className="font-mono text-xs text-slate-900 p-0.5">
                    <span className="font-bold block">
                      {isDepot ? '★ Central Depot 0 (Connaught Place)' : `#${node.id}: ${landmarkName}`}
                    </span>
                    {!isDepot && (
                      <span className="text-[#0080FF] text-[11px]">Demand: {node.demand} units</span>
                    )}
                  </div>
                </Tooltip>
                <Popup>
                  <div className="font-mono text-xs text-slate-900 p-1.5">
                    <div className="font-bold text-slate-900 text-sm">
                      {isDepot ? '★ Central Dark Store (Connaught Place)' : `Node #${node.id}: ${landmarkName}`}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                      <div>GPS: [{coords[0].toFixed(4)}°N, {coords[1].toFixed(4)}°E]</div>
                      {!isDepot && <div>Delivery Demand: <strong>{node.demand} units</strong></div>}
                      {isShock && (
                        <div className="text-rose-600 font-bold mt-1 bg-rose-50 p-1 rounded border border-rose-200">
                          ⚠️ Affected by road congestion shock ({affectedEdge[0]} ↔ {affectedEdge[1]})
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

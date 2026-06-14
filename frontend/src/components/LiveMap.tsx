import React, { useState, useEffect, useRef } from 'react';
import { Compass, Info } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Station {
  station_code: string;
  station_name: string;
  city: string;
  state: string;
  platforms: number;
  daily_passengers: number;
  latitude: number;
  longitude: number;
}

interface TrainData {
  train_number: string;
  train_name: string;
  source_station: string;
  destination_station: string;
  train_type: string;
  capacity: number;
  average_speed: number;
  route_distance: number;
  status: string;
}

interface TrackSection {
  section_id: string;
  location: string;
  track_length: number;
  health_score: number;
  inspection_date: string;
  maintenance_status: string;
}

interface LiveMapProps {
  stations: Station[];
  trains: TrainData[];
  tracks: TrackSection[];
  activeStep: number;
  theme: string;
}

// Track connections map (used to draw polylines)
const TRACK_ROUTES = [
  { from: "NDLS", to: "CNB" },
  { from: "CNB", to: "PNBE" },
  { from: "PNBE", to: "HWH" },
  { from: "HWH", to: "GHY" },
  { from: "NDLS", to: "JAT" },
  { from: "NDLS", to: "GKP" },
  { from: "GKP", to: "PNBE" },
  { from: "CNB", to: "BPL" },
  { from: "BPL", to: "JBP" },
  { from: "JBP", to: "NGP" },
  { from: "BPL", to: "ADI" },
  { from: "ADI", to: "CSMT" },
  { from: "CSMT", to: "PUNE" },
  { from: "PUNE", to: "SBC" },
  { from: "SBC", to: "MAS" },
  { from: "MAS", to: "VSKP" },
  { from: "VSKP", to: "BBS" },
  { from: "BBS", to: "HWH" },
  { from: "NGP", to: "SC" },
  { from: "SC", to: "SBC" },
  { from: "SC", to: "VSKP" },
  { from: "MAS", to: "MDU" }
];

export default function LiveMap({ stations, trains, tracks, activeStep, theme }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const activeTileLayer = useRef<L.TileLayer | null>(null);
  const tracksGroup = useRef<L.FeatureGroup | null>(null);
  const stationsGroup = useRef<L.FeatureGroup | null>(null);
  const trainsGroup = useRef<L.FeatureGroup | null>(null);

  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [mapView, setMapView] = useState<'roadmap' | 'satellite'>('satellite');
  
  // Mutable state for animating train positions without triggering constant Leaflet redraws
  const trainStateRef = useRef<any[]>([]);

  // Coordinates centering on Central India
  const indiaCenter: [number, number] = [22.973, 78.656];

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize Leaflet
    const map = L.map(mapRef.current, {
      center: [22.2, 78.5],
      zoom: 4.6,
      zoomSnap: 0.1,
      zoomControl: false,
      attributionControl: false
    });

    mapInstance.current = map;

    // Add layers groups
    tracksGroup.current = L.featureGroup().addTo(map);
    stationsGroup.current = L.featureGroup().addTo(map);
    trainsGroup.current = L.featureGroup().addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Cleanup on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // 2. Manage Tile Layers toggling
  useEffect(() => {
    if (!mapInstance.current) return;

    // Remove active layer
    if (activeTileLayer.current) {
      mapInstance.current.removeLayer(activeTileLayer.current);
    }

    let url = '';
    let config = {};

    if (mapView === 'roadmap') {
      // Conditional Light vs Dark themed CartoDB tiles
      url = theme === 'light'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      config = {
        maxZoom: 20,
        subdomains: 'abcd'
      };
    } else {
      // ESRI World Satellite view
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      config = {
        maxZoom: 19
      };
    }

    const layer = L.tileLayer(url, config).addTo(mapInstance.current);
    activeTileLayer.current = layer;
    
    // Send to back so vectors appear on top
    layer.bringToBack();
  }, [mapView, theme]);

  // 3. Render static Station Nodes & Track Polylines
  useEffect(() => {
    if (!mapInstance.current || stations.length === 0 || !stationsGroup.current || !tracksGroup.current) return;

    stationsGroup.current.clearLayers();
    tracksGroup.current.clearLayers();

    // A. Draw tracks polylines
    TRACK_ROUTES.forEach((route, idx) => {
      const sFrom = stations.find(s => s.station_code === route.from);
      const sTo = stations.find(s => s.station_code === route.to);
      if (!sFrom || !sTo) return;

      const isSectionA42 = (route.from === "NDLS" && route.to === "CNB") || (route.from === "CNB" && route.to === "NDLS");
      
      let color = mapView === 'satellite' ? '#0ea5e9' : '#0284c7'; // cyan default
      let weight = 2.5;
      let opacity = 0.8;
      let className = '';

      if (isSectionA42) {
        if (activeStep >= 1 && activeStep < 6) {
          color = '#f43f5e'; // pulsing rose red
          weight = 4;
          className = 'animate-pulse';
        } else if (activeStep === 6) {
          color = '#10b981'; // resolved green
          weight = 3.5;
        }
      } else {
        // Render caution zones
        const key = `${route.from}-${route.to}`;
        const hash = key.charCodeAt(0) + key.charCodeAt(1);
        if (hash % 11 === 0) {
          color = '#eab308'; // Warning Yellow
          weight = 3;
        } else {
          // Normal tracks: faint dark styling
          color = mapView === 'satellite' ? '#475569' : '#334155';
          weight = 1.5;
          opacity = 0.5;
        }
      }

      const polyline = L.polyline(
        [[sFrom.latitude, sFrom.longitude], [sTo.latitude, sTo.longitude]],
        { color, weight, opacity }
      );

      polyline.on('click', () => {
        setSelectedElement({
          type: 'track',
          section_id: isSectionA42 ? "A-42" : `SEC-TRK-${idx}`,
          location: `${sFrom.city} - ${sTo.city}`,
          health_score: isSectionA42 ? (activeStep >= 6 ? 98.0 : (activeStep >= 1 ? 42.0 : 92.0)) : (90.0 - (idx % 3) * 5),
          maintenance_status: isSectionA42 ? (activeStep >= 6 ? "Operational" : (activeStep >= 1 ? "Needs Maintenance" : "Operational")) : "Operational",
          track_length: isSectionA42 ? 12.5 : 24.5
        });
      });

      tracksGroup.current?.addLayer(polyline);
    });

    // B. Draw station markers
    stations.slice(0, 25).forEach((st) => {
      const isA42Node = st.station_code === "NDLS" || st.station_code === "CNB";
      const isOvercrowdedNDLS = st.station_code === "NDLS" && activeStep >= 1 && activeStep < 6;

      let html = '';
      if (isOvercrowdedNDLS) {
        html = `<div class="relative w-4.5 h-4.5 rounded-full border border-slate-900 bg-rose-500 shadow-[0_0_12px_#ef4444] animate-pulse flex items-center justify-center"><div class="w-1.5 h-1.5 rounded-full bg-white"></div></div>`;
      } else if (isA42Node) {
        html = `<div class="w-4 h-4 rounded-full border border-slate-900 bg-cyan-400 shadow-[0_0_10px_#22d3ee] flex items-center justify-center"><div class="w-1.5 h-1.5 rounded-full bg-white"></div></div>`;
      } else {
        html = `<div class="w-3.5 h-3.5 rounded-full border border-slate-900 bg-emerald-500 shadow-[0_0_8px_#10b981] flex items-center justify-center"><div class="w-1 h-1 bg-white"></div></div>`;
      }

      const icon = L.divIcon({
        html,
        className: 'custom-station-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([st.latitude, st.longitude], { icon });
      
      // Popup tooltip on hover
      marker.bindTooltip(`
        <div class="bg-slate-950/90 border border-slate-800 text-slate-100 font-console text-[10px] p-1.5 rounded uppercase">
          <span class="text-cyan-400 font-bold">${st.station_code}</span>: ${st.station_name}
        </div>
      `, { direction: 'top', className: 'custom-map-tooltip' });

      marker.on('click', () => {
        setSelectedElement({
          type: 'station',
          station_name: st.station_name,
          station_code: st.station_code,
          platforms: st.platforms,
          daily_passengers: st.daily_passengers,
          latitude: st.latitude,
          longitude: st.longitude
        });
      });

      stationsGroup.current?.addLayer(marker);
    });

  }, [stations, mapView, activeStep]);

  // 4. Set up moving trains state references
  useEffect(() => {
    if (stations.length === 0 || trains.length === 0) return;

    // Build the 15 trains
    const list = trains.slice(0, 15).map((t, idx) => {
      const route = TRACK_ROUTES[idx % TRACK_ROUTES.length];
      const sFrom = stations.find(s => s.station_code === route.from) || stations[0];
      const sTo = stations.find(s => s.station_code === route.to) || stations[1];

      return {
        number: t.train_number,
        name: t.train_name,
        type: t.train_type,
        status: t.status,
        speed: t.average_speed,
        fromCode: route.from,
        toCode: route.to,
        fromLat: sFrom.latitude,
        fromLon: sFrom.longitude,
        toLat: sTo.latitude,
        toLon: sTo.longitude,
        progress: Math.random(),
        marker: null as L.Marker | null
      };
    });

    trainStateRef.current = list;

    // Reset trains layer
    trainsGroup.current?.clearLayers();

    // Create markers for each train
    trainStateRef.current.forEach((tr) => {
      const lat = tr.fromLat + (tr.toLat - tr.fromLat) * tr.progress;
      const lon = tr.fromLon + (tr.toLon - tr.fromLon) * tr.progress;

      const isA42Train = tr.number === "22436" || (tr.fromCode === "NDLS" && tr.toCode === "CNB");
      const isSlowedDown = isA42Train && activeStep >= 3 && activeStep < 6;

      let html = '';
      if (isSlowedDown) {
        html = `<div class="w-3.5 h-3.5 rounded-full border border-slate-950 bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-ping flex items-center justify-center"><div class="w-1 h-1 bg-white"></div></div>`;
      } else {
        html = `<div class="w-3.5 h-3.5 rounded-full border border-slate-950 bg-cyan-400 shadow-[0_0_8px_#22d3ee] flex items-center justify-center"><div class="w-1.5 h-1.5 rounded-full bg-slate-950"></div></div>`;
      }

      const icon = L.divIcon({
        html,
        className: 'custom-train-marker',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([lat, lon], { icon }).addTo(trainsGroup.current!);
      tr.marker = marker;

      marker.bindTooltip(`
        <div class="bg-slate-950/90 border border-slate-800 text-slate-100 font-console text-[10px] p-1.5 rounded uppercase">
          T-${tr.number} • ${isSlowedDown ? 'SPEED LOCKED: 40 KM/H' : `${tr.speed} KM/H`}
        </div>
      `, { direction: 'right', className: 'custom-map-tooltip' });

      marker.on('click', () => {
        setSelectedElement({
          type: 'train',
          name: tr.name,
          number: tr.number,
          speed: isSlowedDown ? 40 : tr.speed,
          status: isSlowedDown ? 'Delayed' : tr.status
        });
      });
    });

  }, [stations, trains]);

  // 5. Trigger animation ticks to slide trains along their routes
  useEffect(() => {
    const interval = setInterval(() => {
      trainStateRef.current.forEach((t) => {
        if (!t.marker) return;

        let speedFactor = 0.005;
        if (t.number === "22436") {
          if (activeStep >= 3 && activeStep < 6) {
            speedFactor = 0.0015; // Speed restricted
          }
        }

        t.progress += speedFactor;
        if (t.progress > 1) {
          t.progress = 0;
        }

        const lat = t.fromLat + (t.toLat - t.fromLat) * t.progress;
        const lon = t.fromLon + (t.toLon - t.fromLon) * t.progress;
        
        t.marker.setLatLng([lat, lon]);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [activeStep]);

  return (
    <div className="flex flex-col h-full bg-panel border border-panel rounded font-console relative overflow-hidden shadow-xl shadow-panel-md">
      {/* View Switchers overlay */}
      <div className="absolute top-3 right-3 bg-panel/90 border border-panel rounded p-1 z-[1000] flex gap-1 shadow-md">
        <button
          onClick={() => setMapView('roadmap')}
          className={`px-2.5 py-1 rounded text-[9px] uppercase tracking-wider font-bold transition ${
            mapView === 'roadmap' ? 'bg-sidebar-active text-cyan-400 border border-panel' : 'text-desc hover:text-main border border-transparent'
          }`}
        >
          Street View
        </button>
        <button
          onClick={() => setMapView('satellite')}
          className={`px-2.5 py-1 rounded text-[9px] uppercase tracking-wider font-bold transition ${
            mapView === 'satellite' ? 'bg-sidebar-active text-cyan-400 border border-panel' : 'text-desc hover:text-main border border-transparent'
          }`}
        >
          Satellite View
        </button>
      </div>

      {/* Legend overlay */}
      <div className="absolute top-14 right-3 rounded-lg z-[1000] w-36 overflow-hidden shadow-2xl border border-white/10" style={{background:'rgba(8,12,24,0.95)',backdropFilter:'blur(10px)'}}>
        <div className="px-3 pt-2.5 pb-2 text-[9px] font-console font-bold tracking-widest text-sky-300 border-b border-white/10 uppercase">
          LEGEND
        </div>
        <div className="px-3 py-2.5 space-y-1.5 text-[10px] font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-slate-900" />
            <span className="text-white font-medium">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-slate-900" />
            <span className="text-white font-medium">High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block border border-slate-900" />
            <span className="text-white font-medium">Critical Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block border border-slate-900" />
            <span className="text-white font-medium">Maintenance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block border border-slate-900" />
            <span className="text-white font-medium">Incident</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-slate-700 bg-white inline-block shadow-inner" />
            <span className="text-white font-medium">Station</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-slate-500 inline-block" />
            <span className="text-white font-medium">Train Route</span>
          </div>
        </div>
      </div>

      {/* Map container wrapper */}
      <div className="flex-1 w-full h-full min-h-[150px] z-0">
        <div ref={mapRef} className="h-full w-full bg-panel" />
      </div>

      {/* Detail inspect overlay popup */}
      {selectedElement && (
        <div className="absolute bottom-3 left-3 right-3 bg-panel border border-panel rounded p-4 z-[1000] shadow-2xl flex flex-col md:flex-row justify-between gap-4 font-console glow-border-cyan text-xs">
          <div className="space-y-1.5 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-panel pb-1.5">
              <span className="px-1.5 py-0.5 bg-app border border-panel text-desc text-[9px] font-bold rounded uppercase">
                {selectedElement.type} telemetry
              </span>
              <h4 className="text-cyan-400 font-bold uppercase">
                {selectedElement.type === 'station' ? selectedElement.station_name : selectedElement.type === 'train' ? selectedElement.name : selectedElement.location}
              </h4>
            </div>

            {selectedElement.type === 'station' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-sans text-desc">
                <div>CODE: <span className="font-console text-cyan-400 font-bold">{selectedElement.station_code}</span></div>
                <div>PLATFORMS: <span className="font-console text-main">{selectedElement.platforms}</span></div>
                <div>DAILY VOLUME: <span className="font-console text-main">{selectedElement.daily_passengers.toLocaleString()}</span></div>
                <div>COORDINATES: <span className="font-console text-main">{selectedElement.latitude.toFixed(2)}, {selectedElement.longitude.toFixed(2)}</span></div>
              </div>
            )}

            {selectedElement.type === 'train' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-sans text-desc">
                <div>NUMBER: <span className="font-console text-cyan-400 font-bold">{selectedElement.number}</span></div>
                <div>OPERATIONAL SPEED: <span className="font-console text-main">{selectedElement.speed} KM/H</span></div>
                <div>STATUS: <span className={`font-console font-bold ${selectedElement.status === 'Delayed' ? 'text-rose-400' : 'text-emerald-400'}`}>{selectedElement.status}</span></div>
              </div>
            )}

            {selectedElement.type === 'track' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-sans text-desc">
                <div>SECTION ID: <span className="font-console text-cyan-400 font-bold">{selectedElement.section_id}</span></div>
                <div>INTEGRITY RATING: <span className={`font-console font-bold ${selectedElement.health_score < 60 ? 'text-rose-400' : selectedElement.health_score < 80 ? 'text-amber-400' : 'text-emerald-400'}`}>{selectedElement.health_score}%</span></div>
                <div>MAINTENANCE: <span className="font-console text-main">{selectedElement.maintenance_status}</span></div>
                <div>LENGTH: <span className="font-console text-main">{selectedElement.track_length} KM</span></div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setSelectedElement(null)} 
            className="text-desc hover:text-main hover:border-panel px-3 py-1 border border-panel bg-app shrink-0 self-start text-[10px] rounded transition"
          >
            DISMISS // CLEAR
          </button>
        </div>
      )}
    </div>
  );
}

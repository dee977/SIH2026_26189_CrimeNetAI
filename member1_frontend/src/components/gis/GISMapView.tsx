import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { SYNTHETIC_MAP_MARKERS } from '../../data/syntheticData';
import { MapMarkerLocation } from '../../types/gis';
import { 
  MapPin, 
  Radio, 
  Layers, 
  Share2, 
  Compass, 
  Crosshair, 
  Filter, 
  Info,
  ExternalLink,
  ShieldAlert,
  Building,
  Navigation
} from 'lucide-react';

export const GISMapView: React.FC = () => {
  const { selectEntity, setView } = useNavigationStore();
  
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerLocation>(SYNTHETIC_MAP_MARKERS[0]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [showCellTowers, setShowCellTowers] = useState<boolean>(true);

  const categories = [
    { key: 'ALL', label: 'All Loci' },
    { key: 'Port / Terminal', label: 'Ports & Terminals' },
    { key: 'Cell Tower', label: 'Cell Towers' },
    { key: 'Financial Branch', label: 'Financial Branches' },
    { key: 'Suspect Location', label: 'Suspect Coordinates' }
  ];

  const filteredMarkers = SYNTHETIC_MAP_MARKERS.filter(m => {
    if (activeCategory !== 'ALL' && m.category !== activeCategory) return false;
    if (!showCellTowers && m.category === 'Cell Tower') return false;
    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Title & Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Spatial Intelligence
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Corridor: Mumbai - Nhava Sheva - Surat
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-100 mt-0.5">
            GIS Tactical Geographic Map & Tower Coverage
          </h1>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCellTowers(!showCellTowers)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showCellTowers 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Cell Tower Sectors</span>
          </button>
        </div>
      </div>

      {/* Main Map & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Map Canvas (2 Cols) */}
        <div className="lg:col-span-2 relative h-[560px] rounded-2xl overflow-hidden border border-slate-800 bg-[#070b14] shadow-2xl flex flex-col justify-between p-4">
          
          {/* Tactical Grid Background */}
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          
          {/* Top Map Coordinates Bar */}
          <div className="z-10 flex items-center justify-between">
            <div className="glass-panel bg-slate-950/80 px-3 py-1.5 rounded-xl border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-3">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>LAT: 18.9498° N</span>
              <span>LNG: 72.9512° E</span>
              <span className="text-cyan-400 font-semibold">GRID REF: MH-JNPT-04</span>
            </div>

            <div className="glass-panel bg-slate-950/80 px-2.5 py-1 rounded-xl border-slate-800 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>RADAR SYNCHRONIZED</span>
            </div>
          </div>

          {/* Tactical Map Visualization */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div className="relative w-full h-full max-w-xl max-h-[480px]">
              
              {/* Radar Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-cyan-500/10 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-cyan-500/5 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 pointer-events-none" />

              {/* Marker 1: Nhava Sheva Port Yard 4B (Center) */}
              <div 
                onClick={() => setSelectedMarker(SYNTHETIC_MAP_MARKERS[0])}
                className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/30 group-hover:scale-125 transition-transform animate-pulse">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-11 whitespace-nowrap bg-slate-950/90 text-red-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-red-500/30">
                  Yard 4B (Seizure Locus)
                </div>
              </div>

              {/* Marker 2: Cell Tower Sector (Near Nhava Sheva) */}
              {showCellTowers && (
                <div 
                  onClick={() => setSelectedMarker(SYNTHETIC_MAP_MARKERS[1])}
                  className="absolute top-[35%] left-[56%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                >
                  {/* Tower Beam Arc */}
                  <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full border border-emerald-500/20 bg-emerald-500/10 pointer-events-none" />
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-md group-hover:scale-125 transition-transform">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 top-9 whitespace-nowrap bg-slate-950/90 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                    Airtel Sector 4 (Cell 19402)
                  </div>
                </div>
              )}

              {/* Marker 3: BlueSea Logistics Office (Mumbai Lamington Road) */}
              <div 
                onClick={() => setSelectedMarker(SYNTHETIC_MAP_MARKERS[2])}
                className="absolute top-[65%] left-[32%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center text-purple-300 shadow-md group-hover:scale-125 transition-transform">
                  <Building className="w-4 h-4" />
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-9 whitespace-nowrap bg-slate-950/90 text-purple-300 text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30">
                  BlueSea Registered Office
                </div>
              </div>

              {/* Marker 4: Surat Hawala Hub */}
              <div 
                onClick={() => setSelectedMarker(SYNTHETIC_MAP_MARKERS[3])}
                className="absolute top-[20%] left-[78%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-125 transition-transform">
                  <Navigation className="w-4 h-4" />
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-9 whitespace-nowrap bg-slate-950/90 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30">
                  Surat Diamond Bazaar (Rajesh S.)
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Map Legend */}
          <div className="z-10 glass-panel bg-slate-950/85 p-2 rounded-xl border-slate-800 text-[10px] flex items-center gap-4">
            <span className="font-mono text-slate-400 uppercase font-semibold">Map Layers:</span>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> Crime Site</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Cell Tower (CDR)</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /> Shell Office</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Remote Conduit</div>
          </div>

        </div>

        {/* Selected Location Dossier Drawer (1 Col) */}
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-5 border-slate-800 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {selectedMarker.category}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1.5">{selectedMarker.name}</h3>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">{selectedMarker.address}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400 font-mono">Geographic Coords:</span>
                <span className="font-mono text-cyan-300">{selectedMarker.latitude}, {selectedMarker.longitude}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400 font-mono">Accuracy Radius:</span>
                <span className="font-mono text-slate-200">±{selectedMarker.accuracyRadiusMeters} meters</span>
              </div>
              {selectedMarker.timestamp && (
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 font-mono">Last Ingress Timestamp:</span>
                  <span className="font-mono text-slate-200">{selectedMarker.timestamp}</span>
                </div>
              )}
            </div>

            {selectedMarker.cellTowerDetails && (
              <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5 font-mono text-xs">
                <div className="text-emerald-400 font-semibold text-[11px]">Cell Tower Telemetry</div>
                <div className="text-slate-300 text-[11px]">Tower ID: {selectedMarker.cellTowerDetails.towerId}</div>
                <div className="text-slate-300 text-[11px]">Azimuth Angle: {selectedMarker.cellTowerDetails.azimuthDegrees}° Sector</div>
                <div className="text-slate-300 text-[11px]">CDR Session Logs: {selectedMarker.cellTowerDetails.cdrCount} Sessions</div>
              </div>
            )}

            {selectedMarker.notes && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Field Investigation Note:</span>
                {selectedMarker.notes}
              </div>
            )}

            {/* Linked Entities */}
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">Linked Entities At Coordinates:</span>
              <div className="space-y-1.5">
                {selectedMarker.associatedEntities.map(ent => (
                  <button
                    key={ent.id}
                    onClick={() => { selectEntity(ent.id); setView('entity'); }}
                    className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-200 flex items-center justify-between transition-colors"
                  >
                    <span>{ent.label}</span>
                    <span className="text-[10px] font-mono text-cyan-400">{ent.type} →</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => setView('graph')}
              className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow"
            >
              Open Coordinate in Graph
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

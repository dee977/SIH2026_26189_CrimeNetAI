import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { useNavigationStore } from '../../store/navigationStore';
import { apiClient } from '../../services/apiClient';
import { AnyEntity } from '../../types/entities';
import { 
  Crosshair, 
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Maximize2
} from 'lucide-react';

interface ExtractedMarker {
  id: string;
  name: string;
  category: string;
  type: string;
  latitude: number;
  longitude: number;
  source: string;
  caseIds: string[];
  entity: AnyEntity;
}

export const GISMapView: React.FC = () => {
  // Hide main padding/scrollbar for full-bleed map
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.style.overflow = 'hidden';
      mainEl.style.padding = '0';
    }
    return () => {
      if (mainEl) {
        mainEl.style.overflow = '';
        mainEl.style.padding = '';
      }
    };
  }, []);

  const { selectedCaseId, setView, selectEntity } = useNavigationStore();
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [entities, setEntities] = useState<AnyEntity[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Load entities whenever selectedCaseId changes
  useEffect(() => {
    let active = true;
    const fetchLocations = async () => {
      if (!selectedCaseId) {
        setEntities([]);
        return;
      }
      setLoading(true);
      try {
        const response = await apiClient.get<AnyEntity[]>(`/entities?case_id=${selectedCaseId}`);
        if (active && response.success && Array.isArray(response.data)) {
          setEntities(response.data);
        } else if (active) {
          setEntities([]);
        }
      } catch (err) {
        console.error("Failed to load entities", err);
        if (active) setEntities([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchLocations();
    return () => { active = false; };
  }, [selectedCaseId]);

  const mapMarkers = useMemo(() => {
    const markers: ExtractedMarker[] = [];
    entities.forEach(ent => {
      // Find lat/lng either at root or in properties
      let lat = (ent as any).latitude ?? (ent as any).properties?.latitude;
      let lng = (ent as any).longitude ?? (ent as any).properties?.longitude;
      
      // Attempt parse if string
      if (typeof lat === 'string') lat = parseFloat(lat);
      if (typeof lng === 'string') lng = parseFloat(lng);
      
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        markers.push({
          id: ent.id,
          name: ent.label || (ent as any).locationName || ent.id,
          category: (ent as any).locationCategory || ent.type,
          type: ent.type,
          latitude: lat,
          longitude: lng,
          source: ent.source || 'Unknown',
          caseIds: ent.caseIds || [],
          entity: ent
        });
      }
    });
    return markers;
  }, [entities]);

  const filteredMarkers = useMemo(() => {
    return mapMarkers.filter(m => {
      if (selectedType !== 'ALL' && m.type !== selectedType) return false;
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        if (!m.name.toLowerCase().includes(lowerQ) && !m.category.toLowerCase().includes(lowerQ)) {
          return false;
        }
      }
      return true;
    });
  }, [mapMarkers, searchQuery, selectedType]);

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    mapMarkers.forEach(m => types.add(m.type));
    return Array.from(types).sort();
  }, [mapMarkers]);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Create map only once
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([20.5937, 78.9629], 5); // India center by default
      
      // Navy/Blue dark theme tile layer - CartoDB Dark Matter
      L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { attribution: '<a href="https://maps.google.com/">Google Maps</a>', maxZoom: 20 }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }
  }, []);

  // Sync markers to map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    
    const layer = markersLayerRef.current;
    layer.clearLayers();

    filteredMarkers.forEach(m => {
      const circle = L.circleMarker([m.latitude, m.longitude], {
        radius: 8,
        color: '#38bdf8', // Tailwind light blue 400
        fillColor: '#0ea5e9',
        fillOpacity: 0.6,
        weight: 2
      });

      // Professional Popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans';
      
      popupContent.innerHTML = `
        <div class="border-b border-slate-200 pb-2 mb-2">
          <div class="text-[10px] font-mono text-blue-600 uppercase tracking-wider">${m.type}</div>
          <div class="text-sm font-bold text-slate-900 mt-1">${m.name}</div>
        </div>
        <div class="text-xs text-slate-300 space-y-1 font-mono">
          <div><span class="text-slate-500">Category:</span> ${m.category}</div>
          <div><span class="text-slate-500">Source:</span> ${m.source}</div>
          <div><span class="text-slate-500">Case:</span> ${m.caseIds.join(', ') || 'N/A'}</div>
          <div><span class="text-slate-500">Coords:</span> ${m.latitude.toFixed(4)}N, ${m.longitude.toFixed(4)}E</div>
        </div>
        <button id="btn-${m.id}" class="mt-3 w-full bg-cyan-600 hover:bg-cyan-500 text-slate-900 text-xs font-semibold py-1.5 px-3 rounded flex items-center justify-center gap-2 transition-colors">
          Open in Dossier
        </button>
      `;

      circle.bindPopup(popupContent, {
        className: 'custom-dark-popup'
      });

      circle.on('popupopen', () => {
        const btn = document.getElementById(`btn-${m.id}`);
        if (btn) {
          btn.onclick = () => {
            selectEntity(m.id);
            setView('case-workspace');
          };
        }
      });

      layer.addLayer(circle);
    });

  }, [filteredMarkers, selectEntity, setView]);

  const handleFitData = () => {
    if (!mapInstanceRef.current || filteredMarkers.length === 0) return;
    const bounds = L.latLngBounds(filteredMarkers.map(m => [m.latitude, m.longitude]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  };

  // Automatically fit data on initial valid marker load
  useEffect(() => {
    if (filteredMarkers.length > 0) {
      handleFitData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMarkers]); // Only on markers change (data load), not filter change

  return (
    <div className="absolute inset-0 flex bg-slate-50 text-slate-900 z-[10] overflow-hidden">
      
      {/* Sidebar Controls */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-xl z-[400] relative">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Crosshair className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider font-mono">GIS Tactical Map</h2>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search entities..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 text-sm rounded pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div>
              <label className="text-xs font-mono text-slate-500 uppercase flex items-center gap-1.5 mb-1.5">
                <Filter className="w-3.5 h-3.5" /> Entity Filter
              </label>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-white border border-slate-300 text-sm rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Types</option>
                {uniqueTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleFitData}
                disabled={filteredMarkers.length === 0}
                className="flex-1 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-300 text-slate-900 text-xs py-2 rounded flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Fit Data
              </button>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedType('ALL'); }}
                className="flex-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 text-xs py-2 rounded flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {selectedCaseId ? (
            <div className="p-2 space-y-2">
              <div className="text-[10px] font-mono uppercase text-slate-500 mb-2 px-1">
                Mapped Entities ({filteredMarkers.length})
              </div>
              {filteredMarkers.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    mapInstanceRef.current?.setView([m.latitude, m.longitude], 16);
                  }}
                  className="w-full text-left p-2.5 rounded bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 transition-colors flex items-center justify-between"
                >
                  <div className="truncate pr-2">
                    <div className="text-sm font-medium text-slate-900 truncate">{m.name}</div>
                    <div className="text-[10px] text-slate-300 font-mono truncate">{m.type} • {m.category}</div>
                  </div>
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                </button>
              ))}
              {filteredMarkers.length === 0 && !loading && (
                <div className="text-center p-4 text-xs text-slate-500">
                  No entities found matching filters.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative bg-[var(--bg-primary)] z-0">
        
        {/* The map container */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-[500] bg-white/80 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <div className="text-blue-600 font-mono text-sm uppercase tracking-wider">Loading Coordinates...</div>
            </div>
          </div>
        )}

        {/* Empty State / No Case Selected / No Coordinates */}
        {!loading && (!selectedCaseId || mapMarkers.length === 0) && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 border border-slate-300 p-8 rounded-xl max-w-md text-center shadow-2xl backdrop-blur-md pointer-events-auto">
              <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Location Data Unavailable</h3>
              {!selectedCaseId ? (
                <p className="text-sm text-slate-300">Please select an active Case to view associated geospatial intelligence.</p>
              ) : (
                <p className="text-sm text-slate-300">The selected case contains no entities with valid geographic coordinates (Latitude/Longitude). Add location data to entities to map them.</p>
              )}
            </div>
          </div>
        )}

      </div>
      
      {/* Global popup styles for Leaflet */}
      <style>{`
        .custom-dark-popup .leaflet-popup-content-wrapper {
          background: #0f172a;
          color: #f1f5f9;
          border: 1px solid #334155;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        }
        .custom-dark-popup .leaflet-popup-tip {
          background: #0f172a;
          border: 1px solid #334155;
        }
        .custom-dark-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
        }
        .custom-dark-popup .leaflet-popup-close-button:hover {
          color: #f8fafc !important;
        }
      `}</style>
    </div>
  );
};

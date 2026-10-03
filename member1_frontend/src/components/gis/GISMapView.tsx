import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { useNavigationStore } from '../../store/navigationStore';
import { useCaseStore } from '../../store/caseStore';
import { apiClient } from '../../services/apiClient';
import { fetchEntityById } from '../../services/entityService';
import { AnyEntity } from '../../types/entities';
import { PersonProfile } from '../entity/PersonProfile';
import { GenericEntityProfile } from '../entity/GenericEntityProfile';
import { 
  Crosshair, 
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Maximize2,
  X,
  ChevronRight,
  Compass,
  ArrowLeft,
  ArrowUpRight,
  AlertCircle,
  Loader2
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

const KNOWN_COORDINATES: Record<string, [number, number]> = {
  'navi mumbai': [18.9498, 72.9512],
  'jnpt': [18.9498, 72.9512],
  'uran': [18.8837, 72.9348],
  'kharghar': [19.0434, 73.0645],
  'panvel': [18.9894, 73.1175],
  'mumbai': [18.9220, 72.8347],
  'thane': [19.2183, 72.9781],
  'pune': [18.5204, 73.8567],
  'bhiwandi': [19.2967, 73.0631],
  'nhava sheva': [18.9498, 72.9512],
  'delhi': [28.6139, 77.2090],
  'ahmedabad': [23.0225, 72.5714],
  'surat': [21.1702, 72.8311],
  'dubai': [25.2048, 55.2708]
};

const STANDARD_FILTER_TYPES = [
  { value: 'ALL', label: 'All Types' },
  { value: 'Location', label: 'Location' },
  { value: 'Vehicle', label: 'Vehicle' },
  { value: 'Person', label: 'Person' },
  { value: 'Container', label: 'Container' },
  { value: 'Toll Plaza', label: 'Toll Plaza' },
  { value: 'Warehouse', label: 'Warehouse' },
  { value: 'Phone', label: 'Phone' },
  { value: 'BankAccount', label: 'Bank Account' },
  { value: 'Organization', label: 'Organization' },
  { value: 'FIR', label: 'FIR / Crime Report' },
  { value: 'Crime', label: 'Crime Scene' },
];

const TYPE_MARKER_COLORS: Record<string, { stroke: string; fill: string }> = {
  Location: { stroke: '#f87171', fill: '#ef4444' },
  Warehouse: { stroke: '#fb923c', fill: '#f97316' },
  'Toll Plaza': { stroke: '#fbbf24', fill: '#f59e0b' },
  Container: { stroke: '#e879f9', fill: '#d946ef' },
  Vehicle: { stroke: '#818cf8', fill: '#6366f1' },
  Person: { stroke: '#38bdf8', fill: '#0284c7' },
  Organization: { stroke: '#c084fc', fill: '#9333ea' },
  Phone: { stroke: '#34d399', fill: '#10b981' },
  BankAccount: { stroke: '#facc15', fill: '#eab308' },
  FIR: { stroke: '#22d3ee', fill: '#0891b2' },
  Crime: { stroke: '#f43f5e', fill: '#e11d48' },
};

function resolveEntityType(ent: Record<string, unknown>): string {
  const props = (ent.properties as Record<string, unknown>) || {};
  const direct = ent.type || ent.entityType || ent.entity_type || ent.nodeType || props.type || props.entity_type || props.category;
  if (typeof direct === 'string' && direct.trim() && direct.toLowerCase() !== 'undefined') {
    return direct.trim();
  }
  if (ent.fullName || ent.associatedPhones || ent.associatedAccounts || ent.aliases || ent.role || props.fullName || props.role) {
    return 'Person';
  }
  if (ent.registrationNumber || ent.model || ent.chassisNumber || ent.make || props.registrationNumber) {
    return 'Vehicle';
  }
  if (ent.accountNumber || ent.bankName || ent.ifscCode || props.accountNumber) {
    return 'BankAccount';
  }
  if (ent.phoneNumber || ent.carrier || ent.imei || props.phoneNumber) {
    return 'Phone';
  }
  if (ent.locationName || ent.address || ent.city || ent.country || props.locationName || props.address) {
    return 'Location';
  }
  if (ent.firNumber || ent.policeStation || props.firNumber) {
    return 'FIR';
  }
  if (ent.crimeCode || ent.crimeCategory || props.crimeCode) {
    return 'Crime';
  }
  if (ent.orgName || ent.companyName || props.orgName) {
    return 'Organization';
  }
  return 'Person';
}

function resolveEntityCategory(ent: Record<string, unknown>, resolvedType: string): string {
  const props = (ent.properties as Record<string, unknown>) || {};
  const meta = (ent.metadata as Record<string, unknown>) || {};
  const cat = ent.category || ent.locationCategory || ent.locationType || ent.role || props.role || props.category || props.locationCategory || props.classification || meta.role || meta.category;
  if (typeof cat === 'string' && cat.trim() && cat.toLowerCase() !== 'undefined') {
    return cat.trim();
  }
  if (resolvedType === 'Person') {
    const personRole = (props.alias as string) || (ent.alias as string) || 'Person of Interest';
    return personRole;
  }
  if (resolvedType === 'Location') {
    return ent.city ? `Tactical Site (${ent.city})` : 'Geographic Node';
  }
  if (resolvedType === 'Vehicle') {
    return (props.model as string) || (ent.model as string) || 'Monitored Transport';
  }
  if (resolvedType === 'Warehouse') return 'Logistics Depot';
  if (resolvedType === 'Toll Plaza') return 'Toll Fastag Checkpoint';
  if (resolvedType === 'Container') return 'Intermodal Cargo';
  if (resolvedType === 'Phone') return 'Telecom Intercept';
  if (resolvedType === 'BankAccount') return 'Financial Channel';
  return resolvedType;
}

export const GISMapView: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCaseId, setView, selectEntity, selectCase } = useNavigationStore();
  const { cases, fetchCases } = useCaseStore();
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerObjectsRef = useRef<Map<string, L.CircleMarker>>(new Map());

  const [entities, setEntities] = useState<AnyEntity[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Dossier Modal State
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isDossierLoading, setIsDossierLoading] = useState(false);
  const [dossierError, setDossierError] = useState<string | null>(null);
  const [dossierEntity, setDossierEntity] = useState<AnyEntity | null>(null);
  const [activeDossierNode, setActiveDossierNode] = useState<{ id: string; name: string; type: string } | null>(null);
  const [dossierHistory, setDossierHistory] = useState<{ id: string; name: string; type: string }[]>([]);

  // Close dossier modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDossierOpen) {
        setIsDossierOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDossierOpen]);

  // Auto-default case if none selected
  useEffect(() => {
    if (cases.length === 0) {
      fetchCases();
    } else if (!selectedCaseId && cases.length > 0) {
      selectCase(cases[0].caseId);
    }
  }, [selectedCaseId, cases, fetchCases, selectCase]);

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
      } catch {
        if (active) setEntities([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchLocations();
    return () => { active = false; };
  }, [selectedCaseId]);

  // Extract markers with latitude/longitude or geocoded properties
  const mapMarkers = useMemo(() => {
    const markers: ExtractedMarker[] = [];
    
    entities.forEach(ent => {
      const entRecord = ent as unknown as Record<string, unknown>;
      const props = (entRecord.properties as Record<string, unknown>) || {};
      const meta = (entRecord.metadata as Record<string, unknown>) || {};

      let lat = entRecord.latitude ?? entRecord.lat ?? props.latitude ?? props.lat;
      let lng = entRecord.longitude ?? entRecord.lng ?? entRecord.lon ?? props.longitude ?? props.lng ?? props.lon;
      
      // Coordinates array check
      if ((lat === undefined || lng === undefined) && Array.isArray(entRecord.coordinates) && entRecord.coordinates.length >= 2) {
        lat = entRecord.coordinates[0];
        lng = entRecord.coordinates[1];
      }

      // Fallback matching against known regions in properties / address / name
      if (lat === undefined || lng === undefined) {
        const textToSearch = [
          entRecord.locationName,
          entRecord.location,
          entRecord.address,
          entRecord.city,
          ent.label,
          ent.id,
          meta.tollFastagRecords,
          props.location,
          props.city,
          props.address
        ].filter(Boolean).join(' ').toLowerCase();

        for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
          if (textToSearch.includes(key)) {
            const idHash = (ent.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const jitterLat = ((idHash % 20) - 10) * 0.0015;
            const jitterLng = (((idHash * 3) % 20) - 10) * 0.0015;
            lat = coords[0] + jitterLat;
            lng = coords[1] + jitterLng;
            break;
          }
        }
      }

      if (typeof lat === 'string') lat = parseFloat(lat);
      if (typeof lng === 'string') lng = parseFloat(lng);
      
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        const resolvedType = resolveEntityType(entRecord);
        const resolvedCategory = resolveEntityCategory(entRecord, resolvedType);
        const rawName = ent.label || (entRecord.fullName as string) || (entRecord.canonicalName as string) || (entRecord.locationName as string) || (entRecord.name as string) || ent.id;
        const rawSource = (entRecord.source as string) || (props.source as string) || 'M3_GRAPH_DATA';

        markers.push({
          id: ent.id,
          name: rawName,
          category: resolvedCategory,
          type: resolvedType,
          latitude: lat,
          longitude: lng,
          source: rawSource,
          caseIds: ent.caseIds || (entRecord.caseId ? [entRecord.caseId as string] : []),
          entity: ent
        });
      }
    });
    return markers;
  }, [entities]);

  // Dynamic filter options combining standard entity types and case-specific ones
  const filterOptions = useMemo(() => {
    const existing = new Set(STANDARD_FILTER_TYPES.map(t => t.value.toLowerCase()));
    const dynamic: { value: string; label: string }[] = [];
    mapMarkers.forEach(m => {
      if (m.type && !existing.has(m.type.toLowerCase())) {
        existing.add(m.type.toLowerCase());
        dynamic.push({ value: m.type, label: m.type });
      }
    });
    return [...STANDARD_FILTER_TYPES, ...dynamic];
  }, [mapMarkers]);

  // Filter markers based on search and selected entity type
  const filteredMarkers = useMemo(() => {
    return mapMarkers.filter(m => {
      if (selectedType !== 'ALL') {
        const sel = selectedType.toLowerCase();
        const typeMatch = (m.type || '').toLowerCase() === sel;
        const catMatch = (m.category || '').toLowerCase() === sel;
        const nameMatch = (m.name || '').toLowerCase().includes(sel);
        if (!typeMatch && !catMatch && !nameMatch) return false;
      }
      if (searchQuery.trim()) {
        const lowerQ = searchQuery.toLowerCase().trim();
        const matchesName = (m.name || '').toLowerCase().includes(lowerQ);
        const matchesCat = (m.category || '').toLowerCase().includes(lowerQ);
        const matchesType = (m.type || '').toLowerCase().includes(lowerQ);
        const matchesSource = (m.source || '').toLowerCase().includes(lowerQ);
        const matchesId = (m.id || '').toLowerCase().includes(lowerQ);
        if (!matchesName && !matchesCat && !matchesType && !matchesSource && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [mapMarkers, searchQuery, selectedType]);

  // Function to fetch and open the complete intelligence dossier for an entity
  const handleViewDossier = async (
    nodeId: string, 
    nodeName: string, 
    nodeType: string = 'Person', 
    resetHistory: boolean = true,
    markerFallback?: ExtractedMarker
  ) => {
    if (!nodeId) return;
    
    if (resetHistory) {
      setDossierHistory([]);
    }
    setActiveDossierNode({ id: nodeId, name: nodeName, type: nodeType });
    setIsDossierOpen(true);
    setIsDossierLoading(true);
    setDossierError(null);
    setDossierEntity(null);

    selectEntity(nodeId);

    const activeCase = selectedCaseId || (cases.length > 0 ? cases[0].caseId : 'CASE-2025-M3-DATASET');

    try {
      const res = await fetchEntityById(nodeId, activeCase);
      if (res.success && res.data) {
        const raw = res.data as unknown as Record<string, unknown>;
        const rawProps = (raw.properties as Record<string, unknown>) || {};
        const mappedEntity: AnyEntity = {
          ...raw,
          type: (raw.type as string) || (raw.entityType as string) || nodeType || 'Person',
          label: (raw.label as string) || (raw.canonicalName as string) || (raw.name as string) || (raw.fullName as string) || nodeName,
          fullName: (raw.fullName as string) || (raw.canonicalName as string) || (raw.name as string) || nodeName,
          id: (raw.id as string) || (raw.entityId as string) || nodeId,
          source: (raw.source as string) || 'M3_GRAPH_DATA',
          caseIds: (raw.caseIds as string[]) || (raw.caseId ? [raw.caseId as string] : [activeCase]),
          firstObserved: (raw.firstObserved as string) || (raw.created_at as string) || 'Active Investigation',
          lastUpdated: (raw.lastUpdated as string) || (raw.created_at as string) || 'Current',
          evidenceCount: (raw.evidenceCount as number) || 0,
          properties: {
            ...rawProps,
            ...(raw.city ? { city: raw.city } : {}),
            ...(raw.role ? { role: raw.role } : {}),
            ...(raw.address ? { address: raw.address } : {})
          }
        } as unknown as AnyEntity;
        setDossierEntity(mappedEntity);
        setIsDossierLoading(false);
        return;
      }
    } catch {
      // Proceed to fallback
    }

    // Local fallback using marker entity record
    const matchedMarker = markerFallback || mapMarkers.find(m => m.id === nodeId);
    if (matchedMarker) {
      const entRecord = matchedMarker.entity as unknown as Record<string, unknown>;
      const entProps = (entRecord.properties as Record<string, unknown>) || {};
      const fallbackEntity: AnyEntity = {
        ...entRecord,
        id: matchedMarker.id,
        type: (matchedMarker.type || 'Person') as AnyEntity['type'],
        label: matchedMarker.name,
        fullName: (entRecord.fullName as string) || (entRecord.name as string) || (entRecord.canonicalName as string) || matchedMarker.name,
        source: matchedMarker.source || 'M3_GRAPH_DATA',
        caseIds: matchedMarker.caseIds.length > 0 ? matchedMarker.caseIds : [activeCase],
        firstObserved: (entRecord.firstObserved as string) || 'Active Investigation',
        lastUpdated: (entRecord.lastUpdated as string) || 'Current',
        evidenceCount: (entRecord.evidenceCount as number) || 0,
        properties: {
          ...entProps,
          latitude: matchedMarker.latitude,
          longitude: matchedMarker.longitude,
          role: matchedMarker.category,
          classification: matchedMarker.category
        }
      } as unknown as AnyEntity;
      setDossierEntity(fallbackEntity);
    } else {
      const minimalEntity: AnyEntity = {
        id: nodeId,
        type: (nodeType || 'Person') as AnyEntity['type'],
        label: nodeName,
        fullName: nodeName,
        source: 'M3_GRAPH_DATA',
        caseIds: [activeCase],
        firstObserved: 'Active Investigation',
        lastUpdated: 'Current',
        evidenceCount: 0,
        properties: {
          role: 'Person of Interest'
        }
      } as unknown as AnyEntity;
      setDossierEntity(minimalEntity);
    }

    setIsDossierLoading(false);
  };

  const handleDrilldownDossier = (targetId: string, targetName?: string) => {
    if (activeDossierNode) {
      setDossierHistory(prev => [...prev, activeDossierNode]);
    }
    handleViewDossier(targetId, targetName || targetId, 'Person', false);
  };

  const handleBackDossier = () => {
    if (dossierHistory.length === 0) return;
    const historyCopy = [...dossierHistory];
    const prev = historyCopy.pop()!;
    setDossierHistory(historyCopy);
    handleViewDossier(prev.id, prev.name, prev.type, false);
  };

  const handleOpenInEntityExplorer = () => {
    if (!activeDossierNode) return;
    selectEntity(activeDossierNode.id);
    setView('entity');
    setIsDossierOpen(false);
    navigate('/entities');
  };

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([18.97, 73.02], 11);

    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      attribution: '<a href="https://maps.google.com/">Google Maps</a>',
      maxZoom: 20
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, []);

  // ResizeObserver & window resize listener for Leaflet map stability
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    ro.observe(container);

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  // Render markers and popups on map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    
    const layer = markersLayerRef.current;
    layer.clearLayers();
    markerObjectsRef.current.clear();

    filteredMarkers.forEach(m => {
      const colors = TYPE_MARKER_COLORS[m.type] || TYPE_MARKER_COLORS[m.category] || { stroke: '#38bdf8', fill: '#0ea5e9' };

      const circle = L.circleMarker([m.latitude, m.longitude], {
        radius: 8,
        color: colors.stroke,
        fillColor: colors.fill,
        fillOpacity: 0.8,
        weight: 2
      });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans';
      popupContent.innerHTML = `
        <div class="border-b border-slate-700 pb-2 mb-2">
          <div class="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">${m.type || 'ENTITY'}</div>
          <div class="text-sm font-bold text-slate-100 mt-1">${m.name}</div>
        </div>
        <div class="text-xs text-slate-300 space-y-1 font-mono">
          <div><span class="text-slate-400">Category:</span> ${m.category || 'Monitored Target'}</div>
          <div><span class="text-slate-400">Source:</span> ${m.source || 'M3_GRAPH_DATA'}</div>
          <div><span class="text-slate-400">Coords:</span> ${m.latitude.toFixed(4)}°N, ${m.longitude.toFixed(4)}°E</div>
        </div>
        <button type="button" class="btn-dossier-action mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors shadow cursor-pointer">
          <span>Open in Dossier</span>
          <span>→</span>
        </button>
      `;

      // Direct event handler attachment before binding
      const btn = popupContent.querySelector('.btn-dossier-action');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          circle.closePopup();
          handleViewDossier(m.id, m.name, m.type, true, m);
        });
      }

      circle.bindPopup(popupContent, {
        className: 'custom-dark-popup'
      });

      circle.on('popupopen', () => {
        setSelectedMarkerId(m.id);
      });

      circle.addTo(layer);
      markerObjectsRef.current.set(m.id, circle);
    });

    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 50);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredMarkers]);

  // Fit map bounds to current filtered data
  const handleFitData = () => {
    if (!mapInstanceRef.current || filteredMarkers.length === 0) return;
    mapInstanceRef.current.invalidateSize();
    const bounds = L.latLngBounds(filteredMarkers.map(m => [m.latitude, m.longitude]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
  };

  // Reset search and filters
  const handleReset = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedMarkerId(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      if (mapMarkers.length > 0) {
        const bounds = L.latLngBounds(mapMarkers.map(m => [m.latitude, m.longitude]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      } else {
        mapInstanceRef.current.setView([18.97, 73.02], 11);
      }
    }
  };

  // Automatically fit data on initial valid marker load
  useEffect(() => {
    if (mapMarkers.length > 0) {
      handleFitData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMarkers.length]);

  // Select entity from list and center map
  const handleSelectMarker = (m: ExtractedMarker) => {
    setSelectedMarkerId(m.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([m.latitude, m.longitude], 16, {
        duration: 1.0
      });
      const marker = markerObjectsRef.current.get(m.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-row min-h-0 min-w-0 bg-slate-50 text-slate-900 overflow-hidden relative select-auto">
      
      {/* Left Control Panel: Fixed-width column, stable, never collapses or expands */}
      <div className="w-[340px] sm:w-[360px] flex-shrink-0 min-w-[320px] max-w-[380px] bg-white border-r border-slate-200 flex flex-col shadow-lg z-20 h-full overflow-hidden relative">
        
        {/* Header and Controls */}
        <div className="p-4 border-b border-slate-200 shrink-0 bg-white space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Crosshair className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">GIS Tactical Map</h2>
                <p className="text-[11px] text-slate-500 font-sans">Geospatial Intelligence</p>
              </div>
            </div>
            {selectedCaseId && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[120px]" title={selectedCaseId}>
                {selectedCaseId}
              </span>
            )}
          </div>
          
          <div className="space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search entities..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-sans"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            {/* Entity Filter Dropdown */}
            <div>
              <label className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1.5 mb-1 font-medium">
                <Filter className="w-3.5 h-3.5 text-blue-600" /> Entity Filter
              </label>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 text-xs rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer font-sans"
              >
                {filterOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button 
                type="button"
                onClick={handleFitData}
                disabled={filteredMarkers.length === 0}
                className="flex-1 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-300 text-slate-800 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors font-medium shadow-sm hover:border-slate-400 active:scale-[0.98]"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" /> Fit Data
              </button>
              <button 
                type="button"
                onClick={handleReset}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors font-medium shadow-sm hover:border-slate-400 active:scale-[0.98]"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Mapped Entities List: Independently scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2 select-text custom-scrollbar">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500 mb-2 px-1">
            <span>Mapped Entities</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {filteredMarkers.length}
            </span>
          </div>

          {filteredMarkers.map(m => {
            const isSelected = selectedMarkerId === m.id;
            return (
              <div
                key={m.id}
                onClick={() => handleSelectMarker(m)}
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-50/90 border-blue-400 ring-1 ring-blue-400 shadow-sm' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {m.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {m.type}
                      </span>
                      {m.category && m.category !== m.type && (
                        <span className="text-[10px] text-slate-500 truncate">
                          {m.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`p-1.5 rounded-full shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{m.latitude.toFixed(4)}°N, {m.longitude.toFixed(4)}°E</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDossier(m.id, m.name, m.type, true, m);
                      }}
                      className="text-slate-600 hover:text-blue-700 hover:underline font-semibold"
                    >
                      Dossier
                    </button>
                    <span className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
                      Focus <ChevronRight className="w-3 h-3 inline" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMarkers.length === 0 && !loading && (
            <div className="text-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500 space-y-2">
              <Compass className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="font-medium text-slate-700">No matching entities</div>
              <div className="text-[11px] text-slate-400">
                {searchQuery || selectedType !== 'ALL' 
                  ? 'Try clearing the search query or selecting "All Types"' 
                  : 'No entities with geographic coordinates found in this case.'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Map Container: Takes remaining width, 100% height, full interactivity */}
      <div className="flex-1 min-w-0 min-h-0 h-full relative z-0 bg-slate-900 overflow-hidden">
        
        {/* Leaflet map canvas */}
        <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-[500] bg-slate-900/60 flex items-center justify-center backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center gap-3 bg-white p-5 rounded-xl shadow-2xl border border-slate-200">
              <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
              <div className="text-slate-800 font-mono text-xs font-semibold uppercase tracking-wider">
                Loading Geospatial Entities...
              </div>
            </div>
          </div>
        )}

        {/* Empty State when no case or 0 coordinates found */}
        {!loading && (!selectedCaseId || mapMarkers.length === 0) && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none p-4">
            <div className="bg-white/95 border border-slate-200 p-8 rounded-2xl max-w-md text-center shadow-2xl backdrop-blur-md pointer-events-auto">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Location Coordinates Inactive</h3>
              {!selectedCaseId ? (
                <p className="text-xs text-slate-600 leading-relaxed">
                  Select an active investigation case from the Top Navigation bar to view associated tactical geospatial intelligence.
                </p>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed">
                  The active case ({selectedCaseId}) does not have entities with mapped coordinates (Latitude / Longitude). Add location coordinates to entities or ingest GIS-tagged evidence to populate the map.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tactical Legend Badge */}
        <div className="absolute top-4 right-4 z-[400] pointer-events-auto bg-slate-900/85 text-slate-200 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-lg shadow-xl text-[11px] font-mono flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-300 font-sans font-medium">Tactical Satellite Feed</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-300">{filteredMarkers.length} Active Nodes</span>
        </div>

      </div>

      {/* Official Case Dossier Modal */}
      {isDossierOpen && (
        <div 
          className="fixed inset-0 z-[1000] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsDossierOpen(false)}
        >
          <div 
            className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Case Dossier</h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Entity: <span className="text-slate-800 font-semibold">{activeDossierNode?.name || 'Selected Entity'}</span>
                  {' • '}Type: <span className="font-semibold text-blue-600">{activeDossierNode?.type || 'Person'}</span>
                  {' • '}ID: <span className="font-mono text-slate-600">{activeDossierNode?.id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {dossierHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBackDossier}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-xs"
                    title={`Back to ${dossierHistory[dossierHistory.length - 1].name}`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span>Back ({dossierHistory[dossierHistory.length - 1].name})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenInEntityExplorer}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  title="Open full-page in Search & Entity Explorer"
                >
                  <span>Open in Entity Explorer</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDossierOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Close Dossier"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              {isDossierLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-800">
                    Loading verified dossier for {activeDossierNode?.name || 'entity'}...
                  </p>
                  <p className="text-xs text-slate-500">
                    Aggregating criminal history, cross-references, and graph intelligence
                  </p>
                </div>
              ) : dossierError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-800 space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span>Failed to Load Dossier</span>
                  </div>
                  <p className="text-xs text-red-700">{dossierError}</p>
                  <button
                    type="button"
                    onClick={() => activeDossierNode && handleViewDossier(activeDossierNode.id, activeDossierNode.name, activeDossierNode.type, false)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : dossierEntity ? (
                <div>
                  {dossierEntity.type === 'Person' ? (
                    <PersonProfile 
                      person={dossierEntity as unknown as import('../../types/entities').PersonEntity} 
                      onSelectLinkedEntity={handleDrilldownDossier}
                      onCloseModal={() => setIsDossierOpen(false)}
                      caseId={selectedCaseId || undefined}
                    />
                  ) : (
                    <GenericEntityProfile 
                      entity={dossierEntity} 
                      onSelectLinkedEntity={handleDrilldownDossier}
                      onCloseModal={() => setIsDossierOpen(false)}
                      caseId={selectedCaseId || undefined}
                    />
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No intelligence dossier record located for this entity.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[11px]">BSA Section 63/65B Compliant Forensic Dossier</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenInEntityExplorer}
                  className="sm:hidden px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-md border border-blue-200"
                >
                  Full Page
                </button>
                <button
                  type="button"
                  onClick={() => setIsDossierOpen(false)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Global popup styles for Leaflet */}
      <style>{`
        .custom-dark-popup .leaflet-popup-content-wrapper {
          background: #0f172a;
          color: #f1f5f9;
          border: 1px solid #334155;
          border-radius: 0.75rem;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5);
        }
        .custom-dark-popup .leaflet-popup-tip {
          background: #0f172a;
          border: 1px solid #334155;
        }
        .custom-dark-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
          padding: 6px 8px !important;
        }
        .custom-dark-popup .leaflet-popup-close-button:hover {
          color: #f8fafc !important;
        }
      `}</style>
    </div>
  );
};

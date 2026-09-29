import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { useNavigationStore } from '../../store/navigationStore';
import { MapMarkerLocation } from '../../types/gis';
import { apiRequest } from '../../services/apiClient';
import { 
  Radio, 
  Compass, 
  Crosshair, 
  ExternalLink, 
  ShieldAlert, 
  Building, 
  Navigation,
  Activity,
  Maximize2,
  Route,
  RefreshCw,
  Layers,
  MapPin,
  Database
} from 'lucide-react';

const CITY_COORDINATES: Record<string, [number, number]> = {
  'mumbai': [18.9220, 72.8347],
  'nhava sheva': [18.9498, 72.9512],
  'jnpt': [18.9498, 72.9512],
  'surat': [21.1702, 72.8311],
  'pune': [18.5204, 73.8567],
  'ahmedabad': [23.0225, 72.5714],
  'hyderabad': [17.3850, 78.4867],
  'delhi': [28.6139, 77.2090],
  'kolkata': [22.5726, 88.3639],
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
  'goa': [15.2993, 74.1240],
  'alibaug': [18.6414, 72.8722],
  'raxaul': [26.9787, 84.8510],
  'bkc': [19.0660, 72.8680],
  'fort': [18.9300, 72.8330],
  'kalbadevi': [18.9480, 72.8270],
  'nariman point': [18.9260, 72.8230],
  'navi mumbai': [19.0330, 73.0297],
  'dubai': [25.2048, 55.2708]
};

function getDeterministicOffset(id: string): [number, number] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = (((hash % 100) / 100) - 0.5) * 0.04;
  const lngOffset = (((((hash >> 8) % 100) / 100) - 0.5) * 0.04);
  return [latOffset, lngOffset];
}

const CASE_LOCI: Record<string, { corridor: string; centerLat: string; centerLng: string; gridRef: string; markers: MapMarkerLocation[] }> = {
  'CASE-2025-M3-DATASET': {
    corridor: 'National Western Seaboard: Mumbai - Nhava Sheva - Surat - Pune',
    centerLat: '18.9498° N',
    centerLng: '72.9512° E',
    gridRef: 'MH-JNPT-04B',
    markers: [
      {
        id: 'LOC-M3-01',
        name: 'Nhava Sheva Port Yard 4B (Seizure Site)',
        category: 'Port / Terminal',
        address: 'Refrigerated Container Berth 4B, JNPT Port Complex, Navi Mumbai',
        latitude: 18.9498,
        longitude: 72.9512,
        accuracyRadiusMeters: 15,
        timestamp: '2026-01-08 17:30',
        notes: 'Joint preventive squads intercepted container #MRKU-982141-0; seized 42.5kg concealed contraband sealed under BSA §63.',
        associatedEntities: [
          { id: 'P00004', label: 'Person_00004 (Courier)', type: 'Person' },
          { id: 'EVD-2025-M3-01', label: 'Seizure Dossier', type: 'Evidence' }
        ]
      },
      {
        id: 'LOC-M3-02',
        name: 'Airtel Cell Tower Sector 4 (Cell 19402)',
        category: 'Cell Tower',
        address: 'Sector 4 Communication Mast, Nhava Sheva Port Approach',
        latitude: 18.9612,
        longitude: 72.9730,
        accuracyRadiusMeters: 450,
        timestamp: '2026-01-08 08:30 - 14:10',
        notes: 'Handset (+91-98201-44912) logged 14 CDR call bursts with handler P00005 prior to shipment arrival.',
        cellTowerDetails: {
          towerId: 'AIRTEL-MH-19402',
          lac: '404-MH-94',
          azimuthDegrees: 142,
          cdrCount: 14
        },
        associatedEntities: [
          { id: 'P00004', label: 'Person_00004', type: 'Person' },
          { id: 'P00005', label: 'Person_00005 (Handler)', type: 'Person' }
        ]
      },
      {
        id: 'LOC-M3-03',
        name: 'BlueSea Logistics Registered Office',
        category: 'Suspect Location',
        address: '304 Lamington Road Commercial Chambers, South Mumbai',
        latitude: 18.9320,
        longitude: 72.8340,
        accuracyRadiusMeters: 25,
        timestamp: '2026-01-07 14:00',
        notes: 'Corporate front company used for filing fraudulent customs clearing manifests.',
        associatedEntities: [
          { id: 'ORG-BLUESEA', label: 'BlueSea Logistics Pvt Ltd', type: 'Organization' },
          { id: 'P00004', label: 'Person_00004', type: 'Person' }
        ]
      },
      {
        id: 'LOC-M3-04',
        name: 'Khed Shivapur Highway Toll Gate',
        category: 'Suspect Location',
        address: 'NH4 Pune-Bangalore Corridor KM 34, Khed Shivapur',
        latitude: 18.3540,
        longitude: 73.8560,
        accuracyRadiusMeters: 30,
        timestamp: '2026-01-08 10:15',
        notes: 'FASTag RFID tag #TAG-9921443 logged goods vehicle route divergence contrary to declared waybill.',
        associatedEntities: [
          { id: 'P00004', label: 'Person_00004', type: 'Person' }
        ]
      },
      {
        id: 'LOC-M3-05',
        name: 'ICICI Banking & Mule ATM Terminal',
        category: 'Financial Branch',
        address: 'Fort Commercial Banking District, Mumbai',
        latitude: 18.9300,
        longitude: 72.8330,
        accuracyRadiusMeters: 10,
        timestamp: '2026-01-08 11:45',
        notes: 'Mule account ACC-90218821 received INR 18,50,000 followed by immediate rapid cash extraction.',
        associatedEntities: [
          { id: 'ACC-90218821', label: 'ICICI Mule #8821', type: 'BankAccount' }
        ]
      }
    ]
  },

  'CASE-VIDEO-001': {
    corridor: 'Financial Hawala Corridor: Mumbai BKC - Nariman Point - Dubai Transit',
    centerLat: '19.0660° N',
    centerLng: '72.8680° E',
    gridRef: 'MH-BKC-FIN-01',
    markers: [
      {
        id: 'LOC-V1-01',
        name: 'Bandra-Kurla Complex Financial Center',
        category: 'Financial Branch',
        address: 'G-Block, BKC Corporate Park, Mumbai',
        latitude: 19.0660,
        longitude: 72.8680,
        accuracyRadiusMeters: 20,
        timestamp: '2026-01-05 09:15',
        notes: 'Inward smurfing hub receiving INR 45,00,000 across 6 shell corporate conduits.',
        associatedEntities: [
          { id: 'ACC-HDFC-9921', label: 'HDFC Aggregator #9921', type: 'BankAccount' },
          { id: 'P00101', label: 'Person_00101 (Hawala Booker)', type: 'Person' }
        ]
      },
      {
        id: 'LOC-V1-02',
        name: 'South Mumbai Hawala Settlement Office',
        category: 'Suspect Location',
        address: 'Kalbadevi Bullion Exchange Market, Mumbai',
        latitude: 18.9480,
        longitude: 72.8270,
        accuracyRadiusMeters: 30,
        timestamp: '2026-01-05 11:00',
        notes: 'Intercept point where coded token serial #HWL-DXB-9912 was transmitted to foreign exchange broker.',
        associatedEntities: [
          { id: 'P00101', label: 'Person_00101', type: 'Person' }
        ]
      },
      {
        id: 'LOC-V1-03',
        name: 'Jio Tower BKC Sector 2 (Cell 44102)',
        category: 'Cell Tower',
        address: 'BKC Bandra East Exchange Mast',
        latitude: 19.0680,
        longitude: 72.8710,
        accuracyRadiusMeters: 300,
        timestamp: '2026-01-05 09:00 - 12:30',
        notes: 'Dual burn-phone IMSI switch logged within 4 minutes of RTGS settlement.',
        cellTowerDetails: {
          towerId: 'JIO-BKC-44102',
          lac: '404-MH-12',
          azimuthDegrees: 90,
          cdrCount: 22
        },
        associatedEntities: [
          { id: 'P00101', label: 'Person_00101', type: 'Person' }
        ]
      }
    ]
  },

  'CASE-2025-M3-SYNTHETIC': {
    corridor: 'Cross-Border Narcotics Axis: Mumbai Sea Basin - Surat Coastal Belt',
    centerLat: '19.8500° N',
    centerLng: '72.8000° E',
    gridRef: 'WEST-COAST-SEA-09',
    markers: [
      {
        id: 'LOC-SYN-01',
        name: 'Surat Hazira Port Terminal Berth 2',
        category: 'Port / Terminal',
        address: 'Hazira Industrial Port Belt, Surat',
        latitude: 21.0967,
        longitude: 72.6375,
        accuracyRadiusMeters: 20,
        timestamp: '2026-01-04 03:20',
        notes: 'Unmanifested dhow offloaded chemical pre-cursor containers into coastal bonded warehouse.',
        associatedEntities: [
          { id: 'P00201', label: 'Person_00201 (Consignee)', type: 'Person' }
        ]
      },
      {
        id: 'LOC-SYN-02',
        name: 'Vodafone Cell Tower Hazira Coastal',
        category: 'Cell Tower',
        address: 'Coastal Highway Tower 104, Hazira',
        latitude: 21.1120,
        longitude: 72.6500,
        accuracyRadiusMeters: 500,
        timestamp: '2026-01-04 02:45 - 04:10',
        notes: 'Satellite VoIP handset relayed GPS coordinates to deep-sea fishing vessel.',
        cellTowerDetails: {
          towerId: 'VI-GUJ-HAZ-104',
          lac: '404-GJ-88',
          azimuthDegrees: 220,
          cdrCount: 18
        },
        associatedEntities: [
          { id: 'P00201', label: 'Person_00201', type: 'Person' }
        ]
      }
    ]
  },

  'CASE-2026-TERR-01': {
    corridor: 'Cyber Infiltration & SIM Box Ring: Mumbai Suburban - Pune Safehouse',
    centerLat: '18.7000° N',
    centerLng: '73.3000° E',
    gridRef: 'MH-EXPR-TECH-03',
    markers: [
      {
        id: 'LOC-V4-01',
        name: 'Andheri East SIM Box Farm',
        category: 'Suspect Location',
        address: 'MIDC Cross Road 12, Andheri East, Mumbai',
        latitude: 19.1197,
        longitude: 72.8700,
        accuracyRadiusMeters: 20,
        timestamp: '2026-01-09 14:10',
        notes: '32-port GSM gateway seized running illegal international VOIP bypass routing.',
        associatedEntities: [
          { id: 'P00401', label: 'Person_00401', type: 'Person' }
        ]
      },
      {
        id: 'LOC-V4-02',
        name: 'Kothrud Pune Safehouse',
        category: 'Suspect Location',
        address: 'Paud Road Sector 7, Kothrud, Pune',
        latitude: 18.5074,
        longitude: 73.8077,
        accuracyRadiusMeters: 15,
        timestamp: '2026-01-09 17:42',
        notes: 'Staging safehouse breached by AHTU team; 6 victims rescued and duplicate visas seized.',
        associatedEntities: [
          { id: 'P00401', label: 'Person_00401', type: 'Person' }
        ]
      },
      {
        id: 'LOC-V4-03',
        name: 'Highway Police Surveillance Checkpoint NH48',
        category: 'Suspect Location',
        address: 'Expressway Interchange Toll Barrier, Lonavala Sector',
        latitude: 18.7500,
        longitude: 73.4000,
        accuracyRadiusMeters: 40,
        timestamp: '2026-01-09 16:15',
        notes: 'Automated ANPR camera captured transport vehicle MH-12-TR-9902 carrying victims.',
        associatedEntities: [
          { id: 'P00401', label: 'Person_00401', type: 'Person' }
        ]
      }
    ]
  }
};

export const GISMapView: React.FC = () => {
  const { selectedCaseId, selectEntity, setView } = useNavigationStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const towersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const activeCase = selectedCaseId || 'CASE-2025-M3-DATASET';
  const fallbackCaseData = CASE_LOCI[activeCase] || CASE_LOCI['CASE-2025-M3-DATASET'];

  const [markers, setMarkers] = useState<MapMarkerLocation[]>(fallbackCaseData.markers);
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerLocation | null>(fallbackCaseData.markers[0] || null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [showCellTowers, setShowCellTowers] = useState<boolean>(true);
  const [showTransitRoute, setShowTransitRoute] = useState<boolean>(true);
  const [dataSourceMode, setDataSourceMode] = useState<'LIVE' | 'CURATED'>('LIVE');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load and merge live entities with curated loci
  const loadCaseMarkers = async () => {
    setIsLoading(true);
    const curatedLoci = CASE_LOCI[activeCase]?.markers || CASE_LOCI['CASE-2025-M3-DATASET'].markers;

    if (dataSourceMode === 'CURATED') {
      setMarkers(curatedLoci);
      setSelectedMarker(curatedLoci[0] || null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiRequest<any[]>(`/entities?case_id=${encodeURIComponent(activeCase)}&pageSize=100`);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const liveMarkers: MapMarkerLocation[] = [];
        const seenNames = new Set<string>();

        // Include curated loci first
        curatedLoci.forEach(m => {
          seenNames.add(m.name.toLowerCase());
          seenNames.add(m.id.toLowerCase());
          liveMarkers.push(m);
        });

        // Convert backend entities to geo-tagged markers
        res.data.forEach((ent: any) => {
          const entId = String(ent.id || ent.entityId || '');
          const entName = ent.canonicalName || ent.fullName || ent.locationName || ent.orgName || ent.name || entId;
          const entType = ent.entityType || ent.type || 'Location';

          if (seenNames.has(entName.toLowerCase()) || seenNames.has(entId.toLowerCase())) {
            return;
          }

          let lat = typeof ent.latitude === 'number' ? ent.latitude : null;
          let lng = typeof ent.longitude === 'number' ? ent.longitude : null;
          let matchedCity = '';

          const searchTarget = `${entName} ${ent.address || ''} ${ent.city || ''} ${ent.locationName || ''}`.toLowerCase();
          for (const [cityName, coords] of Object.entries(CITY_COORDINATES)) {
            if (searchTarget.includes(cityName)) {
              matchedCity = cityName;
              const [baseLat, baseLng] = coords;
              const [offLat, offLng] = getDeterministicOffset(entId);
              lat = baseLat + offLat;
              lng = baseLng + offLng;
              break;
            }
          }

          // If no city match, anchor around Mumbai / JNPT corridor with deterministic jitter
          if (lat === null || lng === null) {
            const [offLat, offLng] = getDeterministicOffset(entId);
            lat = 18.9498 + offLat;
            lng = 72.9512 + offLng;
          }

          let category: MapMarkerLocation['category'] = 'Suspect Location';
          if (entType === 'Port' || entName.toLowerCase().includes('port') || entName.toLowerCase().includes('terminal')) {
            category = 'Port / Terminal';
          } else if (entType === 'Phone' || entType === 'Communication' || entName.toLowerCase().includes('tower')) {
            category = 'Cell Tower';
          } else if (entType === 'BankAccount' || entType === 'Transaction' || entName.toLowerCase().includes('bank')) {
            category = 'Financial Branch';
          } else if (entType === 'Crime' || entType === 'FIR') {
            category = 'Crime Scene';
          }

          seenNames.add(entName.toLowerCase());
          liveMarkers.push({
            id: entId,
            name: entName,
            category,
            address: ent.address || (matchedCity ? `${matchedCity.toUpperCase()}, India` : 'Tactical Geo-Anchor Corridor'),
            latitude: Number(lat.toFixed(5)),
            longitude: Number(lng.toFixed(5)),
            accuracyRadiusMeters: category === 'Cell Tower' ? 450 : 25,
            timestamp: ent.timestamp || ent.filingDate || 'Live Telemetry',
            notes: ent.notes || ent.description || `Synchronized live entity [${entType}] associated with ${activeCase}.`,
            associatedEntities: [
              { id: entId, label: entName, type: entType }
            ]
          });
        });

        setMarkers(liveMarkers);
        setSelectedMarker(liveMarkers[0] || null);
      } else {
        setMarkers(curatedLoci);
        setSelectedMarker(curatedLoci[0] || null);
      }
    } catch (err) {
      console.warn('[GIS] Error loading entities from backend, using curated loci:', err);
      setMarkers(curatedLoci);
      setSelectedMarker(curatedLoci[0] || null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCaseMarkers();
  }, [activeCase, dataSourceMode]);

  // Categories
  const categories = [
    { key: 'ALL', label: 'All Loci' },
    { key: 'Port / Terminal', label: 'Ports & Seizures' },
    { key: 'Cell Tower', label: 'Cell Towers (CDR)' },
    { key: 'Financial Branch', label: 'Banking Loci' },
    { key: 'Suspect Location', label: 'Transit Coordinates' }
  ];

  const filteredMarkers = useMemo(() => {
    return markers.filter(m => {
      if (activeCategory !== 'ALL' && m.category !== activeCategory) return false;
      if (!showCellTowers && m.category === 'Cell Tower') return false;
      return true;
    });
  }, [markers, activeCategory, showCellTowers]);

  // Leaflet Marker Icon Generator
  const createMarkerIcon = (category: string, isSelected: boolean) => {
    let bg = '#06b6d4';
    let border = '#67e8f9';
    let glow = 'rgba(6, 182, 212, 0.45)';

    if (category === 'Port / Terminal' || category === 'Crime Scene') {
      bg = '#f43f5e';
      border = '#fda4af';
      glow = 'rgba(244, 63, 94, 0.45)';
    } else if (category === 'Cell Tower') {
      bg = '#10b981';
      border = '#6ee7b7';
      glow = 'rgba(16, 185, 129, 0.45)';
    } else if (category === 'Financial Branch') {
      bg = '#3b82f6';
      border = '#93c5fd';
      glow = 'rgba(59, 130, 246, 0.45)';
    } else if (category === 'Suspect Location') {
      bg = '#f59e0b';
      border = '#fcd34d';
      glow = 'rgba(245, 158, 11, 0.45)';
    }

    const ringSize = isSelected ? 34 : 26;
    const dotSize = isSelected ? 14 : 10;

    return L.divIcon({
      className: 'tactical-custom-marker',
      html: `
        <div style="position: relative; width: ${ringSize}px; height: ${ringSize}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; inset: 0; border-radius: 9999px; background: ${glow}; ${isSelected ? 'box-shadow: 0 0 16px ' + bg + ';' : ''}"></div>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${dotSize}px; height: ${dotSize}px; border-radius: 9999px; background: ${bg}; border: 2px solid ${border};"></div>
        </div>
      `,
      iconSize: [ringSize, ringSize],
      iconAnchor: [ringSize / 2, ringSize / 2],
      popupAnchor: [0, -ringSize / 2]
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = markers[0]?.latitude || 18.9498;
    const initialLng = markers[0]?.longitude || 72.9512;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialLat, initialLng], 10);

    // CartoDB Dark Matter tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Top-right zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const towersGroup = L.layerGroup().addTo(map);

    markersLayerRef.current = markersGroup;
    towersLayerRef.current = towersGroup;
    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers, Popups, and Overlays on Map
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersLayerRef.current;
    const towersGroup = towersLayerRef.current;
    if (!map || !markersGroup || !towersGroup) return;

    markersGroup.clearLayers();
    towersGroup.clearLayers();

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (filteredMarkers.length === 0) return;

    const bounds = L.latLngBounds([]);

    filteredMarkers.forEach(m => {
      const isSelected = selectedMarker?.id === m.id;
      const marker = L.marker([m.latitude, m.longitude], {
        icon: createMarkerIcon(m.category, isSelected)
      });

      // Interactive popup
      const popupHtml = `
        <div style="background: #0f172a; color: #f8fafc; border: 1px solid #1e293b; border-radius: 12px; padding: 12px; min-width: 210px; font-family: Inter, system-ui, sans-serif;">
          <div style="font-size: 10px; font-family: monospace; font-weight: 700; color: #38bdf8; text-transform: uppercase;">${m.category}</div>
          <div style="font-size: 13px; font-weight: 700; margin-top: 3px; color: #ffffff;">${m.name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; line-height: 1.3;">${m.address}</div>
          <div style="font-size: 10px; font-family: monospace; color: #f59e0b; margin-top: 6px;">${m.latitude.toFixed(4)}° N, ${m.longitude.toFixed(4)}° E</div>
          <button id="popup-btn-${m.id}" style="margin-top: 10px; width: 100%; padding: 6px 10px; background: #0284c7; color: white; border: none; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
            Open Entity Dossier →
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'custom-tactical-popup' });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${m.id}`);
        if (btn) {
          btn.onclick = () => {
            const targetId = m.associatedEntities?.[0]?.id || m.id;
            selectEntity(targetId);
            setView('entity');
          };
        }
      });

      marker.on('click', () => {
        setSelectedMarker(m);
      });

      markersGroup.addLayer(marker);
      bounds.extend([m.latitude, m.longitude]);

      // Cell tower radius beam circle
      if (showCellTowers && (m.category === 'Cell Tower' || m.cellTowerDetails)) {
        const towerCircle = L.circle([m.latitude, m.longitude], {
          radius: m.accuracyRadiusMeters || 500,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 4'
        });
        towersGroup.addLayer(towerCircle);
      }
    });

    // Transit Corridors Route Polyline
    if (showTransitRoute && filteredMarkers.length >= 2) {
      const routeCoords = filteredMarkers.map(m => [m.latitude, m.longitude] as [number, number]);
      const polyline = L.polyline(routeCoords, {
        color: '#06b6d4',
        weight: 2.5,
        opacity: 0.6,
        dashArray: '6, 8',
        lineCap: 'round'
      });
      polyline.addTo(map);
      routeLayerRef.current = polyline;
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [filteredMarkers, selectedMarker?.id, showCellTowers, showTransitRoute]);

  const handleFitBounds = () => {
    const map = mapRef.current;
    if (!map || filteredMarkers.length === 0) return;
    const bounds = L.latLngBounds(filteredMarkers.map(m => [m.latitude, m.longitude]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  };

  const handleSelectMarkerAndPan = (m: MapMarkerLocation) => {
    setSelectedMarker(m);
    if (mapRef.current) {
      mapRef.current.setView([m.latitude, m.longitude], 13, { animate: true });
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Title & Filter Bar */}
      <div className="bg-[var(--bg-card)] shadow-sm rounded-2xl p-4 border border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary)] font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Spatial Intelligence Engine</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-[var(--primary)] border border-cyan-800">
              Corridor: {fallbackCaseData.corridor.split(':')[0]}
            </span>
          </div>
          <h1 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
            GIS Tactical Map & Real-Time Geospatial Telemetry
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-mono">
            {fallbackCaseData.corridor}
          </p>
        </div>

        {/* Tactical Map Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Data Source Mode Toggle */}
          <div className="flex items-center rounded-xl bg-slate-900/60 p-1 border border-slate-700/60 text-xs font-medium">
            <button
              onClick={() => setDataSourceMode('LIVE')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                dataSourceMode === 'LIVE'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3 h-3" />
              <span>Live Case Telemetry</span>
            </button>
            <button
              onClick={() => setDataSourceMode('CURATED')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                dataSourceMode === 'CURATED'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Curated Ground Truth</span>
            </button>
          </div>

          <button
            onClick={() => setShowTransitRoute(!showTransitRoute)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              showTransitRoute 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm' 
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Transit Corridors</span>
          </button>

          <button
            onClick={() => setShowCellTowers(!showCellTowers)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              showCellTowers 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm' 
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Cell Tower Sectors</span>
          </button>

          <button
            onClick={handleFitBounds}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-slate-800 transition-colors"
            title="Fit Map to All Markers"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit Bounds</span>
          </button>

          <button
            onClick={loadCaseMarkers}
            disabled={isLoading}
            className="p-1.5 rounded-xl border bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-slate-800 transition-colors"
            title="Refresh Geo Markers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.key
                ? 'bg-[var(--surface-cyan)] text-cyan-300 border border-[var(--primary)] shadow-sm'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Map & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Tactical Map Canvas (2 Cols) */}
        <div className="lg:col-span-2 relative h-[580px] rounded-2xl overflow-hidden border border-cyan-900/60 bg-[#060a12] shadow-2xl flex flex-col justify-between">
          
          {/* Top Map Coordinates Bar */}
          <div className="z-10 flex items-center justify-between p-3 pointer-events-none">
            <div className="bg-[#0b1322]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-800/40 text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-3 pointer-events-auto">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>LAT: {selectedMarker ? `${selectedMarker.latitude}° N` : fallbackCaseData.centerLat}</span>
              <span>LNG: {selectedMarker ? `${selectedMarker.longitude}° E` : fallbackCaseData.centerLng}</span>
              <span className="text-cyan-400 font-semibold font-mono">GRID: {fallbackCaseData.gridRef}</span>
            </div>

            <div className="bg-[#0b1322]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-emerald-500/40 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LEAFLET DARK SATELLITE ENGINE</span>
            </div>
          </div>

          {/* Leaflet DOM Map Container */}
          <div 
            ref={mapContainerRef} 
            className="absolute inset-0 w-full h-full z-0" 
            style={{ width: '100%', height: '100%', minHeight: '580px' }} 
          />

          {/* Bottom Map Legend */}
          <div className="z-10 bg-[#0b1322]/90 backdrop-blur-md p-2.5 m-3 rounded-xl border border-cyan-800/40 text-[10px] flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
            <div className="flex items-center gap-4">
              <span className="font-mono text-cyan-400 uppercase font-semibold">Classification:</span>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Crime / Seizure Locus</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Cell Tower (CDR Intercept)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Banking / Hawala Node</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Transit Route Checkpoint</div>
            </div>
            <div className="font-mono text-slate-400 text-[9px]">
              {filteredMarkers.length} ACTIVE GEO-ANCHORED LOCI
            </div>
          </div>

        </div>

        {/* Selected Location Dossier Drawer (1 Col) */}
        <div className="space-y-4">
          {selectedMarker ? (
            <div className="bg-[var(--bg-card)] shadow-sm rounded-2xl p-5 border border-cyan-800/40 space-y-4 animate-in fade-in">
              
              <div className="border-b border-[var(--border)] pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {selectedMarker.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    [{selectedMarker.id}]
                  </span>
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mt-1.5">{selectedMarker.name}</h3>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">{selectedMarker.address}</div>
              </div>

              {/* Coordinates Grid */}
              <div className="space-y-2 text-xs bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border)] font-mono">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Geographic Coords:</span>
                  <span className="text-cyan-300 font-bold">{selectedMarker.latitude}° N, {selectedMarker.longitude}° E</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Radial Fix Accuracy:</span>
                  <span className="text-[var(--text-primary)]">±{selectedMarker.accuracyRadiusMeters} meters</span>
                </div>
                {selectedMarker.timestamp && (
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Recorded Timestamp:</span>
                    <span className="text-amber-400">{selectedMarker.timestamp}</span>
                  </div>
                )}
              </div>

              {/* Cell Tower Telemetry Box */}
              {selectedMarker.cellTowerDetails && (
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5 font-mono text-xs">
                  <div className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    <span>BTS Cell Tower Sector Telemetry</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">Sector ID: {selectedMarker.cellTowerDetails.towerId}</div>
                  <div className="text-slate-300 text-[11px]">Azimuth Angle: {selectedMarker.cellTowerDetails.azimuthDegrees}° Radiation Sector</div>
                  <div className="text-slate-300 text-[11px]">CDR Sessions Intercepted: {selectedMarker.cellTowerDetails.cdrCount} Calls</div>
                </div>
              )}

              {/* Field Note */}
              {selectedMarker.notes && (
                <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-xs text-[var(--text-secondary)] leading-relaxed">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 block mb-0.5 font-semibold">
                    Field Forensic Note:
                  </span>
                  {selectedMarker.notes}
                </div>
              )}

              {/* Linked Entities */}
              {selectedMarker.associatedEntities && selectedMarker.associatedEntities.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5 font-semibold">
                    Linked Entities At Coordinates:
                  </span>
                  <div className="space-y-1.5">
                    {selectedMarker.associatedEntities.map(ent => (
                      <button
                        key={ent.id}
                        onClick={() => { selectEntity(ent.id); setView('entity'); }}
                        className="w-full text-left p-2 rounded-lg bg-[var(--bg-primary)] hover:bg-slate-800 border border-[var(--border)] text-xs text-[var(--text-primary)] flex items-center justify-between transition-colors"
                      >
                        <span className="font-medium text-cyan-300">{ent.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">{ent.type} →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action: Open in Graph */}
              <button
                onClick={() => setView('graph')}
                className="w-full py-2.5 rounded-xl bg-[var(--primary)] hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <span>Cross-Examine in Network Graph</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

            </div>
          ) : (
            <div className="bg-[var(--bg-card)] rounded-2xl p-8 border border-[var(--border)] text-center text-slate-400 text-xs">
              <Crosshair className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p>Select any tactical marker on the map to inspect geospatial coordinates and CDR telemetry.</p>
            </div>
          )}

          {/* Quick Loci Picker List */}
          <div className="bg-[var(--bg-card)] rounded-2xl p-3 border border-[var(--border)] space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold px-1">
              Geospatial Manifest ({filteredMarkers.length})
            </span>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {filteredMarkers.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMarkerAndPan(m)}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between border transition-colors ${
                    selectedMarker?.id === m.id
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200'
                      : 'bg-[var(--bg-primary)] border-transparent text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="font-medium truncate">{m.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{m.category}</div>
                  </div>
                  <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${selectedMarker?.id === m.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

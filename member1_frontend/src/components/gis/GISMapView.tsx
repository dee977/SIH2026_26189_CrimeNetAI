import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
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
  Navigation,
  Activity,
  Maximize2,
  Route,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

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
        name: 'Foreign Exchange Telegraphic Clearing Desk',
        category: 'Financial Branch',
        address: 'Nariman Point Overseas Remittance Bureau',
        latitude: 18.9260,
        longitude: 72.8210,
        accuracyRadiusMeters: 15,
        timestamp: '2026-01-05 15:30',
        notes: 'Filing site for unbacked outward wire transfer under FIU STR scrutiny.',
        associatedEntities: [
          { id: 'ACC-HDFC-9921', label: 'ACC-9921', type: 'BankAccount' }
        ]
      }
    ]
  },

  'CASE-VIDEO-002': {
    corridor: 'Coastal Narcotics Corridor: Arabian Sea - Alibaug - Saswane Landing',
    centerLat: '18.9100° N',
    centerLng: '72.8200° E',
    gridRef: 'MH-SEA-CORR-03',
    markers: [
      {
        id: 'LOC-V2-01',
        name: 'Alibaug Offshore Drop Coordinates (18.91°N, 72.82°E)',
        category: 'Port / Terminal',
        address: 'Offshore Maritime Sector 12, 8 nautical miles west of Alibaug',
        latitude: 18.9100,
        longitude: 72.8200,
        accuracyRadiusMeters: 100,
        timestamp: '2026-01-07 01:18',
        notes: 'Coast Guard radar recorded vessel rendezvous with unflagged high-speed craft during AIS blackout.',
        associatedEntities: [
          { id: 'P00201', label: 'Person_00201 (Receiver)', type: 'Person' }
        ]
      },
      {
        id: 'LOC-V2-02',
        name: 'Coastal Satellite Radio Tracking Station #03',
        category: 'Cell Tower',
        address: 'Revdanda Coastal Signal Monitoring Post',
        latitude: 18.5500,
        longitude: 72.9300,
        accuracyRadiusMeters: 800,
        timestamp: '2026-01-07 01:15',
        notes: 'Intercepted encrypted voice packets from satellite terminal SAT-THURAYA-881.',
        cellTowerDetails: {
          towerId: 'ICG-SAT-SIG-03',
          lac: '404-MH-REV',
          azimuthDegrees: 270,
          cdrCount: 9
        },
        associatedEntities: [
          { id: 'SAT-THURAYA-881', label: 'Thuraya Unit #881', type: 'Phone' }
        ]
      },
      {
        id: 'LOC-V2-03',
        name: 'Saswane Beach Concealment Staging Area',
        category: 'Suspect Location',
        address: 'Isolated Mangrove Creek, Saswane Coastal Belt',
        latitude: 18.8200,
        longitude: 72.8500,
        accuracyRadiusMeters: 50,
        timestamp: '2026-01-07 04:45',
        notes: 'Tactical interdiction locus where landing crew was detained under NDPS Act §29.',
        associatedEntities: [
          { id: 'P00201', label: 'Person_00201', type: 'Person' }
        ]
      }
    ]
  },

  'CASE-VIDEO-003': {
    corridor: 'Cyber Infrastructure Corridor: Noida Hub - Bengaluru DC - NCR ATM Grid',
    centerLat: '28.5355° N',
    centerLng: '77.3910° E',
    gridRef: 'DL-NCR-CYBER-09',
    markers: [
      {
        id: 'LOC-V3-01',
        name: 'Noida Fake Call Center Operations Base',
        category: 'Suspect Location',
        address: 'Sector 62 IT Tech Complex, Noida, UP',
        latitude: 28.6280,
        longitude: 77.3649,
        accuracyRadiusMeters: 20,
        timestamp: '2026-01-08 02:00',
        notes: 'Physical hub operating VoIP spoofing dialers and harvesting victim credentials.',
        associatedEntities: [
          { id: 'P00301', label: 'Person_00301 (Mule Recruiter)', type: 'Person' }
        ]
      },
      {
        id: 'LOC-V3-02',
        name: 'C2 Phishing Domain Proxy Server Node',
        category: 'Suspect Location',
        address: 'Electronic City Cloud Hosting Center, Bengaluru',
        latitude: 12.8450,
        longitude: 77.6600,
        accuracyRadiusMeters: 50,
        timestamp: '2026-01-08 03:12',
        notes: 'Reverse proxy IP 198.51.100.42 used to tunnel exfiltrated net-banking session tokens.',
        associatedEntities: [
          { id: '198.51.100.42', label: 'C2 Phish Proxy Node', type: 'Alias' }
        ]
      },
      {
        id: 'LOC-V3-03',
        name: 'Metropolitan ATM Mule Cash-Out Cluster',
        category: 'Financial Branch',
        address: 'Connaught Place Commercial Banking Cluster, New Delhi',
        latitude: 28.6304,
        longitude: 77.2177,
        accuracyRadiusMeters: 30,
        timestamp: '2026-01-08 06:45',
        notes: 'Coordinated withdrawals of INR 8,50,000 from mule current accounts within 15 minutes.',
        associatedEntities: [
          { id: 'P00301', label: 'Person_00301', type: 'Person' }
        ]
      }
    ]
  },

  'CASE-VIDEO-004': {
    corridor: 'Transit Smuggling Corridor: Raxaul Land Customs - Pune Safehouse #04',
    centerLat: '26.5400° N',
    centerLng: '85.3800° E',
    gridRef: 'IND-BORDER-TR-04',
    markers: [
      {
        id: 'LOC-V4-01',
        name: 'Land Customs Station & Border Checkpost',
        category: 'Port / Terminal',
        address: 'Integrated Checkpost (ICP) Raxaul Gateway',
        latitude: 26.5400,
        longitude: 85.3800,
        accuracyRadiusMeters: 25,
        timestamp: '2026-01-09 14:00',
        notes: 'Immigration barrier where counterfeit passport serial #PASSPORT-Z992144 was logged.',
        associatedEntities: [
          { id: 'P00401', label: 'Person_00401 (Custodian)', type: 'Person' }
        ]
      },
      {
        id: 'LOC-V4-02',
        name: 'Rural Logistics Safehouse Facility #04',
        category: 'Suspect Location',
        address: 'Sector 9 Industrial Outskirts Safehouse Compound',
        latitude: 18.5204,
        longitude: 73.8567,
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
  
  const activeCase = selectedCaseId || 'CASE-2025-M3-DATASET';
  const caseData = CASE_LOCI[activeCase] || CASE_LOCI['CASE-2025-M3-DATASET'];

  const [markers, setMarkers] = useState<MapMarkerLocation[]>(caseData.markers);
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerLocation | null>(caseData.markers[0] || null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [showCellTowers, setShowCellTowers] = useState<boolean>(true);
  const [showTransitRoute, setShowTransitRoute] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(true);

  useEffect(() => {
    const data = CASE_LOCI[activeCase] || CASE_LOCI['CASE-2025-M3-DATASET'];
    setMarkers(data.markers);
    setSelectedMarker(data.markers[0] || null);
  }, [activeCase]);

  const categories = [
    { key: 'ALL', label: 'All Loci' },
    { key: 'Port / Terminal', label: 'Ports & Seizures' },
    { key: 'Cell Tower', label: 'Cell Towers (CDR)' },
    { key: 'Financial Branch', label: 'Banking Loci' },
    { key: 'Suspect Location', label: 'Transit Coordinates' }
  ];

  const filteredMarkers = markers.filter(m => {
    if (activeCategory !== 'ALL' && m.category !== activeCategory) return false;
    if (!showCellTowers && m.category === 'Cell Tower') return false;
    return true;
  });

  // Calculate percentage positions on tactical radar screen
  const getMarkerPositions = (idx: number, total: number) => {
    const positions = [
      { top: '48%', left: '50%' }, // Center 1
      { top: '32%', left: '60%' }, // Upper right 2
      { top: '65%', left: '34%' }, // Lower left 3
      { top: '22%', left: '78%' }, // Far top right 4
      { top: '75%', left: '68%' }, // Far bottom right 5
      { top: '25%', left: '25%' }  // Far top left 6
    ];
    return positions[idx % positions.length];
  };

  const getMarkerColor = (cat: string) => {
    switch (cat) {
      case 'Port / Terminal': return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', shadow: 'shadow-red-500/30' };
      case 'Cell Tower': return { bg: 'bg-emerald-500/20', border: 'border-emerald-400', text: 'text-emerald-300', shadow: 'shadow-emerald-500/30' };
      case 'Financial Branch': return { bg: 'bg-blue-500/20', border: 'border-blue-400', text: 'text-blue-300', shadow: 'shadow-blue-500/30' };
      default: return { bg: 'bg-amber-500/20', border: 'border-amber-400', text: 'text-amber-300', shadow: 'shadow-amber-500/30' };
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
              Corridor: {caseData.corridor.split(':')[0]}
            </span>
          </div>
          <h1 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
            GIS Tactical Map & Tower Sector Telemetry
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-mono">
            {caseData.corridor}
          </p>
        </div>

        {/* Tactical Map Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
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
            onClick={() => setIsScanning(!isScanning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              isScanning 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm' 
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Radar Sweep</span>
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
        <div className="lg:col-span-2 relative h-[560px] rounded-2xl overflow-hidden border border-cyan-900/60 bg-[#060a12] shadow-2xl flex flex-col justify-between p-4">
          
          {/* High-Tech Grid & Background Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
          
          {/* Top Map Coordinates Bar */}
          <div className="z-10 flex items-center justify-between">
            <div className="bg-[#0b1322]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-800/40 text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-3">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>LAT: {caseData.centerLat}</span>
              <span>LNG: {caseData.centerLng}</span>
              <span className="text-cyan-400 font-semibold font-mono">GRID: {caseData.gridRef}</span>
            </div>

            <div className="bg-[#0b1322]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-emerald-500/40 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>RADAR SYNCHRONIZED</span>
            </div>
          </div>

          {/* Interactive Tactical Radar Visualization */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div className="relative w-full h-full max-w-2xl max-h-[500px]">
              
              {/* Concentric Sonar Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-cyan-500/20 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-cyan-500/15 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full border border-cyan-500/10 pointer-events-none" />
              
              {/* Crosshair Axes */}
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-500/20 pointer-events-none" />
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-cyan-500/20 pointer-events-none" />

              {/* Radar Sweep Effect */}
              {isScanning && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full overflow-hidden pointer-events-none">
                  <div className="w-full h-full animate-[spin_6s_linear_infinite] origin-center bg-[conic-gradient(from_0deg,rgba(6,182,212,0.18)_0deg,transparent_60deg)]" />
                </div>
              )}

              {/* Transit Route Polylines */}
              {showTransitRoute && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <polyline
                    points="320,240 384,160 217,325 499,110 435,375"
                    fill="none"
                    stroke="#0891b2"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="opacity-40 animate-[dash_20s_linear_infinite]"
                  />
                </svg>
              )}

              {/* Rendered Geospatial Loci Markers */}
              {filteredMarkers.map((marker, idx) => {
                const pos = getMarkerPositions(idx, filteredMarkers.length);
                const color = getMarkerColor(marker.category);
                const isSelected = selectedMarker?.id === marker.id;

                return (
                  <div
                    key={marker.id}
                    onClick={() => setSelectedMarker(marker)}
                    style={{ top: pos.top, left: pos.left }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                  >
                    {/* Tower Beam Arc if Cell Tower */}
                    {marker.cellTowerDetails && showCellTowers && (
                      <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full border border-emerald-500/30 bg-emerald-500/10 pointer-events-none" />
                    )}

                    {/* Outer Pulse Ring */}
                    <div className={`w-9 h-9 rounded-full ${color.bg} border-2 ${color.border} flex items-center justify-center ${color.text} shadow-lg ${color.shadow} transition-all ${
                      isSelected ? 'scale-125 ring-4 ring-cyan-400/40' : 'group-hover:scale-115'
                    }`}>
                      {marker.category === 'Port / Terminal' ? (
                        <ShieldAlert className="w-4 h-4 animate-pulse" />
                      ) : marker.category === 'Cell Tower' ? (
                        <Radio className="w-4 h-4" />
                      ) : marker.category === 'Financial Branch' ? (
                        <Building className="w-4 h-4" />
                      ) : (
                        <Navigation className="w-4 h-4" />
                      )}
                    </div>

                    {/* Marker Badge Tag */}
                    <div className={`absolute left-1/2 -translate-x-1/2 top-10 whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                      isSelected 
                        ? 'bg-cyan-950 text-cyan-200 border-cyan-400 shadow-md' 
                        : 'bg-[#0f172a]/95 text-slate-300 border-slate-700/80 group-hover:border-cyan-500'
                    }`}>
                      {marker.name.length > 25 ? marker.name.slice(0, 23) + '...' : marker.name}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Bottom Map Legend */}
          <div className="z-10 bg-[#0b1322]/90 backdrop-blur-md p-2.5 rounded-xl border border-cyan-800/40 text-[10px] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="font-mono text-cyan-400 uppercase font-semibold">Classification:</span>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Crime / Seizure Locus</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Cell Tower (CDR Intercept)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Banking / Hawala Node</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Transit Route Checkpoint</div>
            </div>
            <div className="font-mono text-slate-400 text-[9px]">
              GPS SATELLITE LOCK: 12 CONSTELLATIONS ACTIVE
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
              <p>Select any tactical marker on the radar screen to inspect geospatial coordinates and CDR telemetry.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

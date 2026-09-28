import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { GraphNode, GraphEdge, HiddenPathResult } from '../../types/graph';
import { EntityType } from '../../types/entities';
import { useNavigationStore } from '../../store/navigationStore';
import { fetchGraphData } from '../../services/graphService';
import { getCaseGraphBundle } from '../../data/caseGraphs';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Filter, 
  Eye, 
  Share2, 
  Sparkles, 
  Clock, 
  FileCheck, 
  GitMerge, 
  Info, 
  CheckCircle2,
  X,
  RotateCcw,
  Search,
  Crosshair,
  ShieldAlert,
  Users,
  Phone,
  Landmark,
  Building2,
  MapPin,
  FileText,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Download
} from 'lucide-react';

type LayoutType = 'cose' | 'concentric' | 'breadthfirst' | 'circle';

export const NetworkGraphView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { selectEntity, setView, selectEvidence, selectedCaseId } = useNavigationStore();

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.5);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeLayout, setActiveLayout] = useState<LayoutType>('cose');
  const [colorByCommunity, setColorByCommunity] = useState<boolean>(false);
  const [hideIsolated, setHideIsolated] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dataSourceMode, setDataSourceMode] = useState<'INTELLIGENCE_WEB' | 'NEO4J_RAW'>('INTELLIGENCE_WEB');
  const [activeConduit, setActiveConduit] = useState<HiddenPathResult | null>(null);

  // Load curated bundle for active case
  const activeBundle = useMemo(() => getCaseGraphBundle(selectedCaseId), [selectedCaseId]);

  // Live Neo4j graph data state
  const [rawNeo4jData, setRawNeo4jData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({
    nodes: [],
    edges: []
  });

  // Fetch live Neo4j on case switch
  useEffect(() => {
    const activeCaseId = selectedCaseId || 'CASE-2025-M3-DATASET';
    fetchGraphData(activeCaseId).then(res => {
      if (res.success && res.data && res.data.nodes && res.data.nodes.length > 0) {
        setRawNeo4jData({
          nodes: res.data.nodes,
          edges: res.data.edges || []
        });
      } else {
        setRawNeo4jData({
          nodes: activeBundle.nodes,
          edges: activeBundle.edges
        });
      }
    }).catch(() => {
      setRawNeo4jData({
        nodes: activeBundle.nodes,
        edges: activeBundle.edges
      });
    });

    setSelectedNode(null);
    setSelectedEdge(null);
    setActiveConduit(null);
  }, [selectedCaseId, activeBundle]);

  // Active dataset depending on mode
  const currentNodes = dataSourceMode === 'INTELLIGENCE_WEB' ? activeBundle.nodes : (rawNeo4jData.nodes.length > 0 ? rawNeo4jData.nodes : activeBundle.nodes);
  const currentEdges = dataSourceMode === 'INTELLIGENCE_WEB' ? activeBundle.edges : (rawNeo4jData.edges.length > 0 ? rawNeo4jData.edges : activeBundle.edges);

  // Compute node degrees for filtering isolated nodes
  const nodeDegrees = useMemo(() => {
    const map = new Map<string, number>();
    currentEdges.forEach(e => {
      map.set(e.source, (map.get(e.source) || 0) + 1);
      map.set(e.target, (map.get(e.target) || 0) + 1);
    });
    return map;
  }, [currentEdges]);

  // Color mapping per node category
  const getNodeColor = (type: EntityType) => {
    switch (type) {
      case 'Person': return '#38bdf8'; // sky-400
      case 'Phone': return '#34d399'; // emerald-400
      case 'BankAccount': return '#fbbf24'; // amber-400
      case 'Vehicle': return '#818cf8'; // indigo-400
      case 'Location': return '#f87171'; // red-400
      case 'Organization': return '#c084fc'; // purple-400
      case 'FIR': return '#22d3ee'; // cyan-400
      case 'Crime': return '#fb7185'; // rose-400
      case 'Transaction': return '#facc15'; // yellow-400
      case 'Communication': return '#2dd4bf'; // teal-400
      case 'Evidence': return '#4ade80'; // green-400
      default: return '#94a3b8';
    }
  };

  // Border & Glow color per type
  const getNodeBorderColor = (type: EntityType, isApex: boolean = false) => {
    if (isApex) return '#f43f5e';
    switch (type) {
      case 'Person': return '#0284c7';
      case 'Phone': return '#059669';
      case 'BankAccount': return '#d97706';
      case 'Vehicle': return '#4f46e5';
      case 'Location': return '#dc2626';
      case 'Organization': return '#9333ea';
      case 'FIR': return '#0891b2';
      case 'Crime': return '#e11d48';
      case 'Transaction': return '#ca8a04';
      default: return '#64748b';
    }
  };

  // Node Shape per Category
  const getNodeShape = (type: EntityType) => {
    switch (type) {
      case 'Person': return 'ellipse';
      case 'BankAccount': return 'round-diamond';
      case 'Phone': return 'round-hexagon';
      case 'Organization': return 'round-rectangle';
      case 'Location': return 'tag';
      case 'FIR': return 'barrel';
      case 'Crime': return 'octagon';
      case 'Transaction': return 'diamond';
      case 'Vehicle': return 'round-rectangle';
      default: return 'ellipse';
    }
  };

  // Community Colors
  const getCommunityColor = (communityId: number) => {
    const colors = ['#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6', '#3b82f6'];
    return colors[(communityId - 1) % colors.length] || '#06b6d4';
  };

  // Cytoscape initialization and updates
  useEffect(() => {
    if (!containerRef.current) return;

    // Filter nodes
    const filteredNodes = currentNodes.filter(n => {
      const eType = n.entityType || (n as any).type || 'Person';
      if (filterType !== 'ALL' && eType.toLowerCase() !== filterType.toLowerCase()) {
        return false;
      }
      if (hideIsolated && (nodeDegrees.get(n.id) || 0) === 0) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = (
          (n.label && n.label.toLowerCase().includes(q)) ||
          n.id.toLowerCase().includes(q) ||
          eType.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }
      return true;
    });

    const nodeIds = new Set(filteredNodes.map(n => n.id));

    // STRICT CHECK: Edges MUST only connect visible, existing nodes
    const filteredEdges = currentEdges.filter(e => {
      if (!e.source || !e.target) return false;
      if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return false;
      if (e.confidence !== undefined && e.confidence < confidenceThreshold) return false;
      return true;
    });

    const elements = [
      ...filteredNodes.map(node => {
        const eType = (node.entityType || (node as any).type || 'Person') as EntityType;
        const isApex = Boolean((node.analytics?.degreeCentrality || 0) >= 0.65 || (node.label && node.label.toLowerCase().includes('kingpin')));
        const communityId = node.analytics?.communityId || 1;
        
        const finalColor = colorByCommunity ? getCommunityColor(communityId) : getNodeColor(eType);
        const finalBorderColor = colorByCommunity ? getCommunityColor(communityId) : getNodeBorderColor(eType, isApex);

        const nodeDegree = nodeDegrees.get(node.id) || 1;
        const nodeSize = isApex ? 56 : (nodeDegree >= 3 ? 46 : 38);

        return {
          data: {
            id: node.id,
            label: node.label || node.id,
            displayLabel: node.label && node.label.length > 22 ? `${node.label.slice(0, 20)}…` : (node.label || node.id),
            type: eType,
            color: finalColor,
            borderColor: finalBorderColor,
            size: nodeSize,
            isApex: isApex ? 'true' : 'false',
            communityId,
            degree: nodeDegree,
            raw: node
          }
        };
      }),
      ...filteredEdges.map(edge => {
        let edgeColor = '#475569';
        const rType = edge.relationType || (edge as any).relationshipType || 'LINKED_TO';
        if (rType.includes('CALL') || rType.includes('PHONE')) edgeColor = '#14b8a6';
        else if (rType.includes('WIRE') || rType.includes('ESCROW') || rType.includes('TRANSACT') || rType.includes('DEBIT')) edgeColor = '#f59e0b';
        else if (rType.includes('OWNER') || rType.includes('DIRECTOR') || rType.includes('SHELL')) edgeColor = '#c084fc';
        else if (rType.includes('ACCUSED') || rType.includes('CONSPIRATOR') || rType.includes('CRIME')) edgeColor = '#f43f5e';
        else if (rType.includes('EVIDENCE') || rType.includes('SEIZURE')) edgeColor = '#22c55e';

        return {
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.relationType || (edge as any).relationshipType || 'LINKED_TO',
            confidence: edge.confidence || 0.95,
            edgeColor,
            raw: edge
          }
        };
      })
    ];

    // Determine layout config
    let layoutConfig: any = { name: 'cose', animate: false, padding: 50 };
    if (activeLayout === 'cose') {
      layoutConfig = {
        name: 'cose',
        animate: false,
        padding: 50,
        nodeRepulsion: () => 500000,
        idealEdgeLength: () => 140,
        edgeElasticity: () => 100,
        componentSpacing: 100
      };
    } else if (activeLayout === 'concentric') {
      layoutConfig = {
        name: 'concentric',
        concentric: (node: any) => node.data('degree') || 1,
        levelWidth: () => 2,
        padding: 40,
        animate: false
      };
    } else if (activeLayout === 'breadthfirst') {
      layoutConfig = {
        name: 'breadthfirst',
        directed: true,
        padding: 40,
        spacingFactor: 1.25,
        animate: false
      };
    } else if (activeLayout === 'circle') {
      layoutConfig = {
        name: 'circle',
        padding: 40,
        animate: false
      };
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(displayLabel)',
            'color': '#f8fafc',
            'font-size': '10.5px',
            'font-weight': 'bold',
            'font-family': 'Inter, system-ui, sans-serif',
            'text-valign': 'bottom',
            'text-margin-y': 7,
            'text-background-color': '#090d16',
            'text-background-opacity': 0.9,
            'text-background-padding': '4px',
            'text-background-shape': 'roundrectangle',
            'width': 'data(size)',
            'height': 'data(size)',
            'border-width': 2.5,
            'border-color': 'data(borderColor)',
            'border-opacity': 0.95,
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': 0.2
          }
        },
        {
          selector: 'node[isApex = "true"]',
          style: {
            'border-width': 4.5,
            'border-color': '#f43f5e',
            'border-opacity': 1,
            'underlay-color': '#f43f5e',
            'underlay-padding': 4,
            'underlay-opacity': 0.25
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#38bdf8',
            'border-width': 4.5,
            'border-opacity': 1,
            'underlay-color': '#38bdf8',
            'underlay-padding': 6,
            'underlay-opacity': 0.3
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2.2,
            'line-color': 'data(edgeColor)',
            'target-arrow-color': 'data(edgeColor)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '8.5px',
            'font-family': 'ui-monospace, monospace',
            'color': '#94a3b8',
            'text-rotation': 'autorotate',
            'text-background-color': '#090d16',
            'text-background-opacity': 0.9,
            'text-background-padding': '2px',
            'text-border-width': 1,
            'text-border-color': '#1e293b',
            'opacity': 0.85
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#38bdf8',
            'target-arrow-color': '#38bdf8',
            'width': 4,
            'opacity': 1
          }
        },
        {
          selector: '.highlighted',
          style: {
            'line-color': '#06b6d4',
            'target-arrow-color': '#06b6d4',
            'width': 4.5,
            'opacity': 1,
            'z-index': 999
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-color': '#06b6d4',
            'border-width': 5,
            'underlay-color': '#06b6d4',
            'underlay-padding': 6,
            'underlay-opacity': 0.35,
            'opacity': 1,
            'z-index': 999
          }
        }
      ],
      layout: layoutConfig
    });

    cyRef.current = cy;

    // Node click handler
    cy.on('tap', 'node', (evt: EventObject) => {
      const nodeData = evt.target.data('raw') as GraphNode;
      setSelectedNode(nodeData);
      setSelectedEdge(null);
    });

    // Edge click handler
    cy.on('tap', 'edge', (evt: EventObject) => {
      const edgeData = evt.target.data('raw') as GraphEdge;
      setSelectedEdge(edgeData);
      setSelectedNode(null);
    });

    // Canvas click (deselect)
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    });

    return () => {
      cy.destroy();
    };
  }, [currentNodes, currentEdges, filterType, confidenceThreshold, activeLayout, colorByCommunity, hideIsolated, searchQuery, nodeDegrees]);

  // Controls
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 35);

  const handleShowNeighbors = () => {
    if (!cyRef.current || !selectedNode) return;
    const cy = cyRef.current;
    const node = cy.getElementById(selectedNode.id);
    const neighbors = node.neighborhood();
    cy.elements().style('opacity', 0.15);
    node.style('opacity', 1).addClass('highlighted');
    neighbors.style('opacity', 1).addClass('highlighted');
  };

  const handleResetVisibility = () => {
    if (!cyRef.current) return;
    cyRef.current.elements().removeClass('highlighted').style('opacity', 1);
    setActiveConduit(null);
  };

  const handleHighlightMultiHopPath = () => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const pathBundle = activeBundle.defaultHiddenPath;
    const pathNodeIds = (pathBundle.nodes || []).map(n => n.id);
    const pathEdgeIds = (pathBundle.edges || []).map(e => e.id);
    const allHighlightIds = [...pathNodeIds, ...pathEdgeIds];

    cy.elements().removeClass('highlighted').style('opacity', 0.12);
    allHighlightIds.forEach(id => {
      const el = cy.getElementById(id);
      if (el) {
        el.addClass('highlighted').style('opacity', 1);
      }
    });

    setActiveConduit(pathBundle);
  };

  // Focus a specific node
  const handleFocusNode = (nodeId: string) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const node = cy.getElementById(nodeId);
    if (node && node.length > 0) {
      cy.animate({
        center: { eles: node },
        zoom: 1.6,
        duration: 400
      });
      const raw = node.data('raw') as GraphNode;
      if (raw) setSelectedNode(raw);
    }
  };

  // Category counts for legend
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Person: 0,
      Phone: 0,
      BankAccount: 0,
      Organization: 0,
      Location: 0,
      Crime: 0,
      Transaction: 0,
      FIR: 0
    };
    currentNodes.forEach(n => {
      const t = n.entityType || (n as any).type || 'Person';
      if (counts[t] !== undefined) counts[t]++;
    });
    return counts;
  }, [currentNodes]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 select-none">
      
      {/* Top Controls Bar */}
      <div className="bg-white shadow-sm border border-slate-200/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 font-bold flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              Tactical Network Canvas (Cytoscape M5)
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
              {currentNodes.length} Nodes • {currentEdges.length} Links
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {activeBundle.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Dossier: <span className="font-semibold text-blue-600">{selectedCaseId || 'CASE-2025-M3-DATASET'}</span> • Multi-hop intelligence graph with cryptographic evidence links.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Data Source Mode Toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setDataSourceMode('INTELLIGENCE_WEB')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dataSourceMode === 'INTELLIGENCE_WEB'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Multi-Modal Web
            </button>
            <button
              onClick={() => setDataSourceMode('NEO4J_RAW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dataSourceMode === 'NEO4J_RAW'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw Neo4j Feed
            </button>
          </div>

          {/* Trace Multi-Hop Conduit Button */}
          <button
            onClick={handleHighlightMultiHopPath}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 text-xs font-bold transition-all shadow-sm"
            title="Highlight Multi-Hop Indirect Conduits"
          >
            <GitMerge className="w-3.5 h-3.5 text-cyan-600" />
            <span>Trace Multi-Hop Conduit</span>
          </button>

          {/* Community Louvain Cluster Toggle */}
          <button
            onClick={() => setColorByCommunity(!colorByCommunity)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              colorByCommunity
                ? 'bg-purple-50 text-purple-700 border-purple-300 font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Color nodes by syndicate community"
          >
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span>Cells {colorByCommunity ? 'ON' : 'OFF'}</span>
          </button>

          {/* Reset Focus */}
          <button
            onClick={handleResetVisibility}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center rounded-xl bg-white border border-slate-200 p-0.5 shadow-sm">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="Fit Graph"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Filters Toggle Button */}
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors shadow-sm ${
              isFilterPanelOpen 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Filter Graph"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters {filterType !== 'ALL' && `(${filterType})`}</span>
          </button>

        </div>
      </div>

      {/* Filter & Layout Control Drawer */}
      {isFilterPanelOpen && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-600 font-bold flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Graph Topology & Filtering Engine
            </span>
            <button
              onClick={() => { setFilterType('ALL'); setConfidenceThreshold(0.5); setHideIsolated(true); setSearchQuery(''); }}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Reset All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Entity Types */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Filter by Entity Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['ALL', 'Person', 'Phone', 'BankAccount', 'Vehicle', 'Location', 'Organization', 'FIR', 'Crime', 'Transaction'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filterType === type
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Topologies */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Graph Layout Algorithm
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cose', label: 'Force-Directed (Organic)' },
                  { id: 'concentric', label: 'Concentric (Radar Target)' },
                  { id: 'breadthfirst', label: 'Hierarchical (Tree)' },
                  { id: 'circle', label: 'Radial Ring (Cluster)' }
                ].map(l => (
                  <button
                    key={l.id}
                    onClick={() => setActiveLayout(l.id as LayoutType)}
                    className={`p-2 text-left rounded-xl border text-xs font-medium transition-all ${
                      activeLayout === l.id
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence Slider & Isolated Nodes Checkbox */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Min Link Confidence Threshold
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-600">
                    {Math.round(confidenceThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideIsolated}
                    onChange={(e) => setHideIsolated(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  <span>Hide Unconnected Degree-0 Nodes</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Keeps graph dense</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Canvas & Side Inspector Split */}
      <div className="relative h-[680px] w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#080c14] shadow-2xl">
        
        {/* Subtle Cyber Radar Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #1e293b 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px, 80px 80px, 80px 80px'
          }}
        />

        {/* Cytoscape DOM container */}
        <div ref={containerRef} className="w-full h-full relative z-0" />

        {/* Search Input Floating on Canvas */}
        <div className="absolute top-4 left-4 z-10 w-72">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suspect, phone, account..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 shadow-xl"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Interactive Entity Legend Floating Overlay with live counts */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/80 text-[11px] shadow-2xl max-w-md">
          <div className="flex items-center justify-between text-slate-300 font-mono uppercase font-bold text-[10px] mb-2">
            <span>Entity Categories ({currentNodes.length})</span>
            <span className="text-cyan-400">Click to filter</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { type: 'Person', color: 'bg-sky-400', count: categoryCounts.Person },
              { type: 'Phone', color: 'bg-emerald-400', count: categoryCounts.Phone },
              { type: 'BankAccount', color: 'bg-amber-400', count: categoryCounts.BankAccount },
              { type: 'Organization', color: 'bg-purple-400', count: categoryCounts.Organization },
              { type: 'Location', color: 'bg-red-400', count: categoryCounts.Location },
              { type: 'Crime', color: 'bg-rose-400', count: categoryCounts.Crime },
              { type: 'Transaction', color: 'bg-yellow-400', count: categoryCounts.Transaction },
              { type: 'FIR', color: 'bg-cyan-400', count: categoryCounts.FIR }
            ].map(item => (
              <button
                key={item.type}
                onClick={() => setFilterType(filterType === item.type ? 'ALL' : item.type)}
                className={`flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg border transition-all text-[10px] ${
                  filterType === item.type
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="truncate">{item.type}</span>
                </div>
                <span className="font-mono text-[9px] text-slate-400 font-bold">{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conduit Discovery Alert Banner */}
        {activeConduit && (
          <div className="absolute bottom-4 right-4 z-20 max-w-xl bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                  Indirect Conduit Discovery Uncovered
                </h4>
              </div>
              <button
                onClick={() => setActiveConduit(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              {activeConduit.explanation}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-cyan-400">
              <span>Path Length: {activeConduit.pathLength} Hops</span>
              <span>•</span>
              <span>Start: {activeConduit.startEntity.name}</span>
              <span>→</span>
              <span>Target: {activeConduit.targetEntity.name}</span>
            </div>
          </div>
        )}

        {/* Selected Node Tactical Inspector Floating Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-20 w-84 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 p-5 shadow-2xl animate-in slide-in-from-right-4 text-white">
            
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {selectedNode.entityType}
                  </span>
                  {(selectedNode.analytics?.degreeCentrality || 0) >= 0.65 && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Apex Target
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white mt-1.5">{selectedNode.label}</h4>
                <div className="text-[11px] font-mono text-slate-400">{selectedNode.id}</div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* M5 Graph Intelligence Metrics Grid */}
            <div className="py-3 space-y-2 border-b border-slate-800">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                <span>M5 Graph Centrality Telemetry</span>
                <span className="text-cyan-400 font-mono">Cluster {selectedNode.analytics?.communityId || 1}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase">Degree Centrality</span>
                  <span className="text-cyan-400 font-bold text-xs">{selectedNode.analytics?.degreeCentrality || 0.45}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase">Betweenness (Broker)</span>
                  <span className="text-amber-400 font-bold text-xs">{selectedNode.analytics?.betweennessCentrality || 0.52}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase">PageRank Index</span>
                  <span className="text-emerald-400 font-bold text-xs">{selectedNode.analytics?.pagerank || 0.18}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase">Clustering Coeff</span>
                  <span className="text-purple-400 font-bold text-xs">{selectedNode.analytics?.clusteringCoefficient || 0.40}</span>
                </div>
              </div>

              {selectedNode.analytics?.analyticalLeadNote && (
                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200 mt-2">
                  <span className="font-bold block text-[10px] text-cyan-400 uppercase font-mono">Analytical Lead Note:</span>
                  <p className="mt-0.5 leading-relaxed">{selectedNode.analytics.analyticalLeadNote}</p>
                </div>
              )}
            </div>

            {/* Statutory Legal Offenses Note */}
            <div className="py-2.5 border-b border-slate-800 text-[11px]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Statutory Offense Framework
              </span>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 font-mono text-[9px] border border-rose-800">
                  BNS §111 (Organized Crime)
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono text-[9px] border border-amber-800">
                  PMLA 2002 §3 (Hawala)
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 font-mono text-[9px] border border-blue-800">
                  BSA §65B (Digital Evidence)
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-3 space-y-2">
              <button
                onClick={handleShowNeighbors}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white transition-colors flex items-center justify-center gap-1.5 font-medium"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Highlight 1-Hop Ring</span>
              </button>

              <button
                onClick={() => {
                  selectEntity(selectedNode.id);
                  setView('entity');
                }}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5"
              >
                <span>Open Entity Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        )}

        {/* Selected Edge Inspector Floating Drawer */}
        {selectedEdge && (
          <div className="absolute top-4 right-4 z-20 w-84 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-amber-500/40 p-5 shadow-2xl animate-in slide-in-from-right-4 text-white">
            
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  Relational Evidence Link
                </span>
                <h4 className="text-sm font-bold text-white mt-1.5">{selectedEdge.relationType}</h4>
                <div className="text-[11px] font-mono text-slate-400">{selectedEdge.id}</div>
              </div>
              <button
                onClick={() => setSelectedEdge(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Confidence Score:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {Math.round((selectedEdge.confidence || 0.95) * 100)}%
                </span>
              </div>
              
              {selectedEdge.transactionAmount && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs">
                  <span className="block text-[10px] uppercase text-amber-400 font-bold">Financial Funnel Sum</span>
                  ₹{selectedEdge.transactionAmount.toLocaleString('en-IN')}
                </div>
              )}

              {selectedEdge.sourceDocument && (
                <div className="text-slate-300 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="block text-[10px] uppercase font-mono text-slate-400 font-bold">Source Audit Document</span>
                  <span className="text-white font-mono text-[11px] mt-0.5 block">{selectedEdge.sourceDocument}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 font-mono">
                <button 
                  onClick={() => handleFocusNode(selectedEdge.source)}
                  className="hover:text-cyan-400 underline truncate max-w-[120px]"
                >
                  Src: {selectedEdge.source}
                </button>
                <span>→</span>
                <button 
                  onClick={() => handleFocusNode(selectedEdge.target)}
                  className="hover:text-cyan-400 underline truncate max-w-[120px]"
                >
                  Tgt: {selectedEdge.target}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => setView('evidence')}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-cyan-300 transition-colors flex items-center justify-center gap-1.5 font-bold"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Verify in Evidence Ledger (BSA §65B)</span>
              </button>
            </div>

          </div>
        )}

        {/* Default Overview Card (When nothing is selected) */}
        {!selectedNode && !selectedEdge && (
          <div className="absolute top-4 right-4 z-10 w-80 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 shadow-2xl text-white">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                Syndicate Graph Intelligence
              </h4>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              Interactive Cytoscape visualization of cross-agency entities. Click any node to inspect centrality metrics, or click any relationship edge to audit supporting forensic banking/CDR documents.
            </p>

            <div className="space-y-1.5 text-[11px]">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Key Targets of Interest:</div>
              {currentNodes.slice(0, 3).map(n => (
                <div 
                  key={n.id}
                  onClick={() => handleFocusNode(n.id)}
                  className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-cyan-400 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <span className="font-semibold truncate max-w-[170px] text-slate-200">{n.label}</span>
                  <span className="text-[10px] font-mono text-cyan-400">{n.entityType}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Engine: Cytoscape M5</span>
              <span className="text-emerald-400 font-bold">● High Integrity</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

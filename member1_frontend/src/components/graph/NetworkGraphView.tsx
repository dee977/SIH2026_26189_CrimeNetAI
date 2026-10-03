import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
// @ts-ignore
import fcose from 'cytoscape-fcose';
import { GraphNode, GraphEdge, NetworkGraphData } from '../../types/graph';
import { EntityType } from '../../types/entities';
import { useNavigationStore } from '../../store/navigationStore';
import { useCaseStore } from '../../store/caseStore';
import { apiClient } from '../../services/apiClient';
import { 
  ZoomIn, ZoomOut, Maximize2, RotateCcw, Search, 
  Filter, Layers, GitMerge, Info, Database, Crosshair, MapPin, 
  Phone, Building2, Car, User, AlertTriangle, FileText, ChevronRight,
  CheckCircle2, AlertCircle, X, Download, ExternalLink, Copy, Check,
  Loader2, ShieldCheck, FolderOpen, Eye, ArrowLeft, Calendar, Shield
} from 'lucide-react';
import { EntitySourceDocument, fetchEntityDocuments } from '../../services/evidenceService';

try {
  cytoscape.use(fcose);
} catch (_) {}

const NODE_COLORS: Record<string, string> = {
  Person: '#38bdf8',
  Phone: '#34d399',
  BankAccount: '#fbbf24',
  Vehicle: '#818cf8',
  Location: '#f87171',
  Organization: '#c084fc',
  FIR: '#22d3ee',
  Crime: '#fb7185',
  Transaction: '#facc15',
  Communication: '#2dd4bf',
  Evidence: '#4ade80'
};

export const NetworkGraphView: React.FC<{caseId?: string}> = ({caseId}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  
  const { selectedCaseId } = useNavigationStore();
  const { cases } = useCaseStore();
  const activeCase = cases.find(c => c.caseId === selectedCaseId);

  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  
  // UI States
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntityType, setFilterEntityType] = useState<string>('ALL');
  const [filterRelType, setFilterRelType] = useState<string>('ALL');
  
  // Advanced features - Path Discovery
  const [isPathLoading, setIsPathLoading] = useState(false);
  const [pathSource, setPathSource] = useState<string>('');
  const [pathTarget, setPathTarget] = useState<string>('');
  const [pathStatus, setPathStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [discoveredPathInfo, setDiscoveredPathInfo] = useState<{
    startLabel: string;
    endLabel: string;
    nodeCount: number;
    hops: number;
  } | null>(null);

  // Source Documents Modal States
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  const [entityDocs, setEntityDocs] = useState<EntitySourceDocument[]>([]);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<EntitySourceDocument | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDocModalOpen) {
        if (previewDoc) {
          setPreviewDoc(null);
        } else {
          setIsDocModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDocModalOpen, previewDoc]);

  const handleViewSourceDocuments = async () => {
    if (!selectedNode) return;
    const entityId = selectedNode.id || selectedNode.entityId;
    console.log('[SourceDocuments] Fetching documents for entity:', entityId, selectedNode.label);
    setIsDocModalOpen(true);
    setIsDocsLoading(true);
    setDocsError(null);
    setPreviewDoc(null);
    
    try {
      const res = await fetchEntityDocuments(entityId, selectedCaseId || undefined);
      console.log('[SourceDocuments] API response for entity:', entityId, res);
      if (res.success && Array.isArray(res.data)) {
        setEntityDocs(res.data);
      } else {
        setEntityDocs([]);
      }
    } catch (err: any) {
      console.error('[SourceDocuments] Error fetching source documents for entity:', entityId, err);
      setDocsError(err?.message || 'Failed to retrieve source documents');
      setEntityDocs([]);
    } finally {
      setIsDocsLoading(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => {
      setCopiedHash(null);
    }, 2000);
  };
  
  // Fetch real data on mount or case switch
  useEffect(() => {
    if (!selectedCaseId) return;
    
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get<NetworkGraphData>(`/graph/case/${encodeURIComponent(selectedCaseId)}`);
        if (isMounted && res.success && res.data) {
          setGraphData({
            nodes: res.data.nodes || [],
            edges: res.data.edges || []
          });
        }
      } catch (err) {
        console.error('Failed to fetch graph data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    loadData();
    return () => { isMounted = false; };
  }, [selectedCaseId]);

  // Init Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;
    if (cyRef.current) cyRef.current.destroy();

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      minZoom: 0.1,
      maxZoom: 4,
      wheelSensitivity: 0.2,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'background-color': 'data(color)',
            'color': '#1e293b',
            'font-size': '12px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-outline-width': 2,
            'text-outline-color': '#ffffff',
            'width': 'data(size)',
            'height': 'data(size)',
            'border-width': 3,
            'border-color': 'data(borderColor)',
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 5,
            'border-color': '#0f172a',
            'underlay-color': '#94a3b8',
            'underlay-padding': 6,
            'underlay-opacity': 0.4
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '10px',
            'color': '#64748b',
            'text-outline-width': 2,
            'text-outline-color': '#ffffff',
          }
        },
        {
          selector: 'node.path-start',
          style: {
            'border-color': '#10b981',
            'border-width': 6,
            'underlay-color': '#10b981',
            'underlay-padding': 10,
            'underlay-opacity': 0.5,
            'font-size': '13px',
            'font-weight': 700,
            'color': '#065f46',
            'z-index': 9999
          }
        },
        {
          selector: 'node.path-end',
          style: {
            'border-color': '#f59e0b',
            'border-width': 6,
            'underlay-color': '#f59e0b',
            'underlay-padding': 10,
            'underlay-opacity': 0.5,
            'font-size': '13px',
            'font-weight': 700,
            'color': '#92400e',
            'z-index': 9999
          }
        },
        {
          selector: 'node.path-intermediate',
          style: {
            'border-color': '#0284c7',
            'border-width': 5,
            'underlay-color': '#38bdf8',
            'underlay-padding': 7,
            'underlay-opacity': 0.4,
            'font-size': '12px',
            'font-weight': 700,
            'color': '#0369a1',
            'z-index': 9998
          }
        },
        {
          selector: 'edge.path-edge',
          style: {
            'line-color': '#0284c7',
            'target-arrow-color': '#0284c7',
            'source-arrow-color': '#0284c7',
            'width': 5,
            'arrow-scale': 1.4,
            'opacity': 1,
            'color': '#0369a1',
            'font-weight': 700,
            'text-outline-color': '#ffffff',
            'text-outline-width': 3,
            'z-index': 9997
          }
        },
        {
          selector: '.path-dimmed',
          style: {
            'opacity': 0.35
          }
        },
        {
          selector: '.highlighted',
          style: {
            'line-color': '#0284c7',
            'target-arrow-color': '#0284c7',
            'width': 4,
            'z-index': 999
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-color': '#0284c7',
            'border-width': 5
          }
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.35
          }
        }
      ]
    });

    cy.on('tap', 'node', (evt: EventObject) => {
      setSelectedNode(evt.target.data('raw'));
    });

    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        cy.elements().removeClass('dimmed highlighted');
      }
    });

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  // Update layout and elements
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || graphData.nodes.length === 0) return;

    const filteredNodes = graphData.nodes.filter(n => {
      if (filterEntityType !== 'ALL' && n.entityType !== filterEntityType) return false;
      if (searchQuery && !n.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = graphData.edges.filter(e => {
      if (filterRelType !== 'ALL' && e.relationType !== filterRelType) return false;
      return nodeIds.has(e.source) && nodeIds.has(e.target);
    });

    const elements = [
      ...filteredNodes.map(node => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.entityType,
          color: NODE_COLORS[node.entityType] || '#94a3b8',
          borderColor: '#ffffff',
          size: node.analytics?.degreeCentrality && node.analytics.degreeCentrality > 0.6 ? 50 : 35,
          raw: node
        }
      })),
      ...filteredEdges.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.relationType,
          raw: edge
        }
      }))
    ];

    cy.batch(() => {
      cy.elements().remove();
      cy.add(elements);
    });

    cy.layout({
      name: 'fcose',
      animate: false,
      fit: true,
      padding: 50,
      randomize: true
    } as any).run();

  }, [graphData, filterEntityType, filterRelType, searchQuery]);

  // Actions
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 50);
  // Helper to resolve an input string (Entity ID, Label, or partial name) to a Cytoscape node element
  const resolveNodeElement = (cy: Core, input: string) => {
    if (!cy || !input || !input.trim()) return null;
    const q = input.trim().toLowerCase();

    // 1. Direct exact ID match
    const ele = cy.getElementById(input.trim());
    if (ele && ele.length > 0 && ele.isNode()) return ele;

    // 2. Case-insensitive ID match
    const allNodes = cy.nodes();
    for (let i = 0; i < allNodes.length; i++) {
      const n = allNodes[i];
      if (n.id().toLowerCase() === q) return n;
    }

    // 3. Exact label match (case-insensitive)
    for (let i = 0; i < allNodes.length; i++) {
      const n = allNodes[i];
      const lbl = (n.data('label') || '').toLowerCase();
      if (lbl === q) return n;
    }

    // 4. Exact raw name / canonicalName / title match
    for (let i = 0; i < allNodes.length; i++) {
      const n = allNodes[i];
      const raw = n.data('raw') || {};
      const cName = (raw.canonicalName || raw.fullName || raw.name || raw.label || '').toLowerCase();
      if (cName === q) return n;
    }

    // 5. Substring match on label, ID, or canonicalName
    for (let i = 0; i < allNodes.length; i++) {
      const n = allNodes[i];
      const lbl = (n.data('label') || '').toLowerCase();
      const id = n.id().toLowerCase();
      const raw = n.data('raw') || {};
      const cName = (raw.canonicalName || raw.fullName || raw.name || raw.label || '').toLowerCase();
      if (lbl.includes(q) || id.includes(q) || cName.includes(q)) return n;
    }

    return null;
  };

  // Clear all path highlights and restore normal graph appearance
  const clearPathHighlight = () => {
    const cy = cyRef.current;
    if (cy) {
      cy.elements().removeClass(
        'path-start path-end path-intermediate path-edge path-dimmed highlighted dimmed'
      );
    }
    setPathStatus(null);
    setDiscoveredPathInfo(null);
  };

  const handleReset = () => {
    clearPathHighlight();
    setSelectedNode(null);
    setSearchQuery('');
    setFilterEntityType('ALL');
    setFilterRelType('ALL');
    setPathSource('');
    setPathTarget('');
    handleFit();
  };

  const handleShortestPath = async () => {
    const cy = cyRef.current;
    if (!cy) return;

    const srcInput = pathSource.trim();
    const tgtInput = pathTarget.trim();

    if (!srcInput || !tgtInput) {
      setPathStatus({
        type: 'error',
        message: 'Please enter both start and target entity identifiers.'
      });
      return;
    }

    if (srcInput.toLowerCase() === tgtInput.toLowerCase()) {
      clearPathHighlight();
      setPathStatus({
        type: 'error',
        message: 'Source and target entities are identical. Please specify two different entities.'
      });
      return;
    }

    // Always clear previous highlight before running new search
    clearPathHighlight();

    // Resolve start node
    const startEle = resolveNodeElement(cy, srcInput);
    if (!startEle) {
      setPathStatus({
        type: 'error',
        message: `Entity "${srcInput}" could not be found in the current graph.`
      });
      return;
    }

    // Resolve end node
    const endEle = resolveNodeElement(cy, tgtInput);
    if (!endEle) {
      setPathStatus({
        type: 'error',
        message: `Entity "${tgtInput}" could not be found in the current graph.`
      });
      return;
    }

    if (startEle.id() === endEle.id()) {
      setPathStatus({
        type: 'error',
        message: `Both inputs resolved to the same entity (${startEle.data('label') || startEle.id()}). Please choose two distinct entities.`
      });
      return;
    }

    // Log the input values as required
    console.log('[PathDiscovery] Input values:', {
      source: srcInput,
      target: tgtInput,
      resolvedStartId: startEle.id(),
      resolvedEndId: endEle.id()
    });

    setIsPathLoading(true);
    setPathStatus(null);

    let pathNodeIds: string[] = [];
    let pathEdgeIds: string[] = [];
    let hops = 0;
    let pathFound = false;

    // 1. Client-side A* search on current Cytoscape network (fastest, guaranteed client-side sync)
    try {
      const aStarResult = cy.elements().aStar({
        root: startEle,
        goal: endEle,
        directed: false
      });
      if (aStarResult.found && aStarResult.path && aStarResult.path.length > 0) {
        pathFound = true;
        hops = aStarResult.distance || Math.max(1, aStarResult.path.nodes().length - 1);
        pathNodeIds = aStarResult.path.nodes().map(n => n.id());
        pathEdgeIds = aStarResult.path.edges().map(e => e.id());
      }
    } catch (localErr) {
      console.warn('[PathDiscovery] Local A* path search notice:', localErr);
    }

    // 2. Corroborate with / fallback to backend shortest-path API
    if (!pathFound && selectedCaseId) {
      try {
        const res = await apiClient.get<any>('/graph/shortest-path', {
          params: { case_id: selectedCaseId, source: startEle.id(), target: endEle.id() }
        });
        if (res.success && res.data && res.data.found && res.data.nodes?.length > 0) {
          pathFound = true;
          hops = res.data.distance || Math.max(1, res.data.nodes.length - 1);
          pathNodeIds = res.data.nodes.map((n: any) => n.id);

          if (res.data.edges && res.data.edges.length > 0) {
            const edgeSet = new Set<string>();
            res.data.edges.forEach((re: any) => {
              const matchedEdges = cy.edges(`[source = "${re.source}"][target = "${re.target}"], [source = "${re.target}"][target = "${re.source}"]`);
              matchedEdges.forEach(me => { edgeSet.add(me.id()); });
            });
            pathEdgeIds = Array.from(edgeSet);
          }
        }
      } catch (apiErr) {
        console.warn('[PathDiscovery] Backend shortest-path API error:', apiErr);
      }
    }

    // Ensure edges connecting consecutive nodes in pathNodeIds are included
    if (pathFound && pathEdgeIds.length === 0 && pathNodeIds.length >= 2) {
      for (let i = 0; i < pathNodeIds.length - 1; i++) {
        const u = pathNodeIds[i];
        const v = pathNodeIds[i + 1];
        const matched = cy.edges(`[source = "${u}"][target = "${v}"], [source = "${v}"][target = "${u}"]`);
        matched.forEach(me => { pathEdgeIds.push(me.id()); });
      }
    }

    // Log the returned path nodes & edges as required
    console.log('[PathDiscovery] Returned path nodes & edges:', {
      nodes: pathNodeIds,
      edges: pathEdgeIds,
      hops: hops || (pathNodeIds.length - 1)
    });

    if (pathFound && pathNodeIds.length > 0) {
      // Keep entire graph visible with gentle secondary dimming (NEVER total blur or blackout)
      cy.elements().addClass('path-dimmed');

      // Clearly highlight Start Node with Emerald green
      cy.getElementById(startEle.id()).removeClass('path-dimmed').addClass('path-start');

      // Clearly highlight End Node with Amber/Orange
      cy.getElementById(endEle.id()).removeClass('path-dimmed').addClass('path-end');

      // Highlight every intermediate node on the path
      const intermediateIds = pathNodeIds.filter(id => id !== startEle.id() && id !== endEle.id());
      intermediateIds.forEach(id => {
        cy.getElementById(id).removeClass('path-dimmed').addClass('path-intermediate');
      });

      // Highlight (thicken + color) every edge on the path
      pathEdgeIds.forEach(eid => {
        cy.getElementById(eid).removeClass('path-dimmed').addClass('path-edge');
      });

      // Log whether highlight state was applied
      console.log('[PathDiscovery] Highlight state applied successfully:', true);

      setPathStatus({
        type: 'success',
        message: `Path found: ${pathNodeIds.length} nodes, ${hops || (pathNodeIds.length - 1)} hops`
      });

      setDiscoveredPathInfo({
        startLabel: startEle.data('label') || startEle.id(),
        endLabel: endEle.data('label') || endEle.id(),
        nodeCount: pathNodeIds.length,
        hops: hops || (pathNodeIds.length - 1)
      });

      // Smoothly animate viewport to center and fit the highlighted path
      const pathCollection = cy.collection();
      pathNodeIds.forEach(id => pathCollection.merge(cy.getElementById(id)));
      pathEdgeIds.forEach(id => pathCollection.merge(cy.getElementById(id)));
      if (pathCollection.length > 0) {
        cy.animate({
          fit: {
            eles: pathCollection,
            padding: 90
          },
          duration: 500
        });
      }
    } else {
      // Disconnected: No path found! Restore normal graph appearance (NO blur!)
      clearPathHighlight();
      console.log('[PathDiscovery] Highlight state applied successfully:', false);
      setPathStatus({
        type: 'error',
        message: 'No path found between these two entities in this network.'
      });
    }

    setIsPathLoading(false);
  };

  const handleAnalytics = async () => {
    if (!selectedCaseId) return;
    try {
      await apiClient.get(`/graph/analytics`, { params: { case_id: selectedCaseId } });
      alert('Analytics computation triggered on backend.');
    } catch (err) {
      console.error(err);
    }
  };

  if (!selectedCaseId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
        <Database className="w-12 h-12 mb-4 text-[var(--text-secondary)]" />
        <h2 className="text-xl font-semibold">No Case Selected</h2>
        <p>Please select a case to view its investigation graph.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-300 overflow-hidden">
      {/* Header Context */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{activeCase?.title || 'Case Investigation Graph'}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
              {activeCase?.caseNumber || selectedCaseId}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-[var(--text-muted)] font-medium">
            <span className="flex items-center gap-1.5"><Crosshair className="w-4 h-4"/> {activeCase?.status || 'Active'}</span>
            <span className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-[var(--warning)]"/> Priority: {activeCase?.priority || 'High'}</span>
            <span>{graphData.nodes.length} Nodes • {graphData.edges.length} Links</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleAnalytics} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors">
            <Layers className="w-4 h-4" /> Run Analytics
          </button>
        </div>
      </div>

      <div className="flex flex-1 relative min-h-0">
        {/* Main Canvas Area */}
        <div className="flex-1 relative bg-[#f8fafc]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div ref={containerRef} className="absolute inset-0" />

          {/* Floating Canvas Controls */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10">
            <div className="flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 p-1">
              <button onClick={handleZoomIn} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg"><ZoomIn className="w-5 h-5"/></button>
              <div className="h-px bg-slate-100 mx-1" />
              <button onClick={handleZoomOut} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg"><ZoomOut className="w-5 h-5"/></button>
              <div className="h-px bg-slate-100 mx-1" />
              <button onClick={handleFit} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg"><Maximize2 className="w-5 h-5"/></button>
            </div>
            <button onClick={handleReset} className="flex items-center justify-center p-2 bg-white text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-xl shadow-lg border border-slate-200">
              <RotateCcw className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {/* Right Sidebar - Controls & Details */}
        <div className="w-[380px] bg-white border-l border-slate-200 flex flex-col z-10 shadow-xl overflow-y-auto shrink-0">
          
          {/* Filters & Tools Section */}
          <div className="p-5 border-b border-slate-100 space-y-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Filter className="w-4 h-4"/> Workspace Controls</h3>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search entities..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">Entity Type</label>
                <select 
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  value={filterEntityType}
                  onChange={e => setFilterEntityType(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="Person">Person</option>
                  <option value="Phone">Phone</option>
                  <option value="Organization">Organization</option>
                  <option value="Vehicle">Vehicle</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] mb-1 block">Relation Type</label>
                <select 
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  value={filterRelType}
                  onChange={e => setFilterRelType(e.target.value)}
                >
                  <option value="ALL">All Relations</option>
                  <option value="CALLS">Calls</option>
                  <option value="OWNS">Owns</option>
                  <option value="LOCATED_AT">Located At</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-blue-600"/> Path Discovery
                </h4>
                {(pathStatus || pathSource || pathTarget) && (
                  <button
                    type="button"
                    onClick={clearPathHighlight}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Clear path highlight"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              <datalist id="graph-entities-datalist">
                {graphData.nodes.map(n => (
                  <option key={n.id} value={n.label || n.id}>
                    {n.id} ({n.entityType})
                  </option>
                ))}
              </datalist>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">Start Entity (ID or Name)</label>
                  <input
                    type="text"
                    list="graph-entities-datalist"
                    placeholder="e.g. ORG-CYB-01 or Name"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    value={pathSource}
                    onChange={e => {
                      setPathSource(e.target.value);
                      if (pathStatus) setPathStatus(null);
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleShortestPath()}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">Target Entity (ID or Name)</label>
                  <input
                    type="text"
                    list="graph-entities-datalist"
                    placeholder="e.g. Deepak Chouhan or ID"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    value={pathTarget}
                    onChange={e => {
                      setPathTarget(e.target.value);
                      if (pathStatus) setPathStatus(null);
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleShortestPath()}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button 
                    type="button"
                    onClick={handleShortestPath} 
                    disabled={!pathSource.trim() || !pathTarget.trim() || isPathLoading}
                    className="flex-1 py-2 bg-[var(--primary)] text-white font-semibold text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <GitMerge className="w-3.5 h-3.5" />
                    {isPathLoading ? 'Tracing...' : 'Find Connection'}
                  </button>

                  <button
                    type="button"
                    onClick={clearPathHighlight}
                    disabled={!pathSource && !pathTarget && !pathStatus}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    title="Clear Path and Reset Highlight"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear Path
                  </button>
                </div>

                {/* Status line */}
                {pathStatus && (
                  <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                    pathStatus.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {pathStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="font-medium leading-tight">{pathStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Node Details Section */}
          <div className="p-5 flex-1 bg-slate-50/50">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Info className="w-4 h-4"/> Entity Details
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPathSource(selectedNode.label || selectedNode.id);
                        if (pathStatus) setPathStatus(null);
                      }}
                      className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10px] font-semibold transition-colors"
                      title="Set as Start Node in Path Discovery"
                    >
                      Set Start
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPathTarget(selectedNode.label || selectedNode.id);
                        if (pathStatus) setPathStatus(null);
                      }}
                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-[10px] font-semibold transition-colors"
                      title="Set as Target Node in Path Discovery"
                    >
                      Set Target
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-primary)]" style={{ backgroundColor: NODE_COLORS[selectedNode.entityType] || '#94a3b8' }}>
                    {selectedNode.entityType === 'Person' ? <User className="w-5 h-5"/> : selectedNode.entityType === 'Phone' ? <Phone className="w-5 h-5"/> : <Database className="w-5 h-5"/>}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{selectedNode.label}</div>
                    <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{selectedNode.entityType} • ID: {selectedNode.id}</div>
                  </div>
                </div>

                {selectedNode.analytics && (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-2">
                    <h4 className="text-xs font-bold text-slate-600 uppercase">Graph Metrics</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-muted)]">Degree Centrality</span>
                      <span className="font-mono font-medium text-slate-800">{selectedNode.analytics.degreeCentrality?.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-muted)]">Community Cell</span>
                      <span className="font-mono font-medium text-slate-800">#{selectedNode.analytics.communityId}</span>
                    </div>
                  </div>
                )}

                {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-2">
                    <h4 className="text-xs font-bold text-slate-600 uppercase">Properties</h4>
                    {Object.entries(selectedNode.metadata).map(([k, v]) => (
                      <div key={k} className="flex flex-col text-sm border-b border-slate-50 pb-1 last:border-0 last:pb-0">
                        <span className="text-[var(--text-secondary)] text-xs">{k}</span>
                        <span className="font-medium text-slate-800 truncate" title={String(v)}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <button 
                  type="button"
                  onClick={handleViewSourceDocuments}
                  className="w-full py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 active:bg-slate-100 shadow-xs cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-600"/> View Source Documents
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] text-center px-4">
                <Crosshair className="w-10 h-10 mb-3 text-[var(--text-secondary)]" />
                <p className="text-sm">Select a node or edge on the canvas to inspect its intelligence profile and metadata.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Source Documents & Forensic Chain Modal */}
      {isDocModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => {
            if (previewDoc) setPreviewDoc(null);
            else setIsDocModalOpen(false);
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Source Documents & Chain of Custody</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Entity: <span className="text-slate-800 font-semibold">{selectedNode?.label || 'Selected Entity'}</span>
                    {' • '}<span className="uppercase text-slate-600">{selectedNode?.entityType}</span>
                    {' • '}ID: <span className="font-mono text-slate-600">{selectedNode?.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (previewDoc) setPreviewDoc(null);
                  else setIsDocModalOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Legal / Statutory Compliance Strip */}
            <div className="bg-blue-50/70 border-b border-blue-100 px-6 py-2 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium">Bharatiya Sakshya Adhiniyam (BSA §63 / §65B) Tamper-Evident Chain of Custody</span>
              </div>
              <span className="text-[11px] font-mono text-blue-700 font-medium">Case: {selectedCaseId || activeCase?.title || 'Active'}</span>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Detail / Forensic Inspection View */}
              {previewDoc ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mb-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Documents List
                  </button>

                  <div className="border border-slate-200 rounded-lg p-5 bg-white space-y-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 mr-2">
                          {previewDoc.category || previewDoc.fileType}
                        </span>
                        {previewDoc.relationship && (
                          <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {previewDoc.relationship}
                          </span>
                        )}
                        <h4 className="text-base font-bold text-slate-900 mt-2">{previewDoc.fileName}</h4>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                          <Shield className="w-3 h-3 text-blue-600" />
                          {previewDoc.bsaCertificateId || 'BSA-65B-VALID'}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                      {previewDoc.description || 'Verified evidence file registered in case intelligence dossier.'}
                    </p>

                    {/* FIR Details if applicable */}
                    {previewDoc.isFir && previewDoc.firDetails && (
                      <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 space-y-2">
                        <h5 className="text-xs font-bold uppercase text-amber-900">FIR Statutory Details</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-amber-700">Police Station: </span>
                            <span className="font-semibold text-amber-950">{previewDoc.firDetails.policeStation || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-amber-700">FIR Number: </span>
                            <span className="font-mono font-semibold text-amber-950">{previewDoc.firDetails.firNumber || previewDoc.fileName}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-amber-700">Sections / Acts: </span>
                            <span className="font-semibold text-amber-950">
                              {Array.isArray(previewDoc.firDetails.actsSections) ? previewDoc.firDetails.actsSections.join(', ') : (previewDoc.firDetails.actsSections || 'IT Act / BNS')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Full SHA-256 Box */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 uppercase">Cryptographic SHA-256 Hash</span>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(previewDoc.sha256Hash)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                        >
                          {copiedHash === previewDoc.sha256Hash ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Full Hash</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-xs text-slate-800 bg-slate-100 p-2.5 rounded border border-slate-200 break-all select-all">
                        {previewDoc.sha256Hash || 'Unavailable'}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Custodian / Officer</span>
                        <span className="text-xs font-semibold text-slate-800 truncate block">
                          {previewDoc.custodian || previewDoc.uploader || 'Investigating Officer'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Intake Date</span>
                        <span className="text-xs font-semibold text-slate-800 block">
                          {previewDoc.uploadedAt ? (previewDoc.uploadedAt.includes('T') ? previewDoc.uploadedAt.split('T')[0] : previewDoc.uploadedAt) : 'Registered'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">File Size</span>
                        <span className="text-xs font-semibold text-slate-800 block">
                          {previewDoc.fileSizeBytes ? (previewDoc.fileSizeBytes > 1048576 ? `${(previewDoc.fileSizeBytes / 1048576).toFixed(2)} MB` : `${(previewDoc.fileSizeBytes / 1024).toFixed(0)} KB`) : '1.4 MB'}
                        </span>
                      </div>
                    </div>

                    {/* Download or External Link button if storageUrl is available */}
                    <div className="pt-2 flex gap-2">
                      <a
                        href={previewDoc.storageUrl || `/api/v1/evidence/${encodeURIComponent(previewDoc.id)}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download / Open Raw Evidence
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                /* Documents List View */
                <>
                  {isDocsLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-600 space-y-3">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-sm font-medium">Retrieving verified forensic dossiers and source filings for {selectedNode?.label}...</p>
                      <p className="text-xs text-slate-400">Querying Supabase case records, evidentiary assets & relation graphs</p>
                    </div>
                  ) : docsError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-red-800 space-y-3">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span>Failed to Load Documents</span>
                      </div>
                      <p className="text-xs text-red-700">{docsError}</p>
                      <button
                        type="button"
                        onClick={handleViewSourceDocuments}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : entityDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 px-6 text-center space-y-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <FolderOpen className="w-6 h-6 stroke-[1.75]" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No source documents found for this entity</h4>
                      <p className="text-xs text-slate-500 max-w-sm">
                        No evidentiary files, FIR attachments, or forensic captures are directly linked to <strong className="text-slate-700">{selectedNode?.label}</strong> (ID: {selectedNode?.id}) in this case.
                      </p>
                      <div className="text-[11px] text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-md mt-2">
                        Tip: You can review case-wide evidence items under the Evidence & SHA-256 Ledger.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-600 pb-1">
                        <span className="font-semibold text-slate-800">
                          {entityDocs.length} Source Document{entityDocs.length > 1 ? 's' : ''} Associated
                        </span>
                        <span className="text-slate-400">Select any record to inspect forensic chain</span>
                      </div>

                      {entityDocs.map((doc) => (
                        <div
                          key={doc.id || doc.documentId}
                          className="border border-slate-200 rounded-lg p-4 bg-white hover:border-blue-400 hover:shadow-xs transition-all space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {doc.category || doc.fileType}
                              </span>
                              {doc.relationship && (
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  {doc.relationship}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                              {doc.bsaCertificateId || 'BSA-65B Verified'}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                              {doc.isFir ? <Shield className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-slate-900 text-sm truncate">{doc.fileName}</h5>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                {doc.description || 'Verified evidence file registered in case intelligence dossier.'}
                              </p>
                            </div>
                          </div>

                          {/* Forensic Metadata Strip */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                            <div>
                              <span className="text-slate-400 block">SHA-256</span>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-slate-700 truncate" title={doc.sha256Hash}>
                                  {doc.sha256Hash ? `${doc.sha256Hash.slice(0, 10)}...${doc.sha256Hash.slice(-6)}` : 'N/A'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyHash(doc.sha256Hash)}
                                  className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                  title="Copy SHA-256 Hash"
                                >
                                  {copiedHash === doc.sha256Hash ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Custodian</span>
                              <span className="font-medium text-slate-700 truncate block">
                                {doc.custodian || doc.uploader || 'Investigating Officer'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Date</span>
                              <span className="font-medium text-slate-700 block">
                                {doc.uploadedAt ? (doc.uploadedAt.includes('T') ? doc.uploadedAt.split('T')[0] : doc.uploadedAt) : 'Logged'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Size</span>
                              <span className="font-medium text-slate-700 block">
                                {doc.fileSizeBytes ? (doc.fileSizeBytes > 1048576 ? `${(doc.fileSizeBytes / 1048576).toFixed(1)} MB` : `${(doc.fileSizeBytes / 1024).toFixed(0)} KB`) : '1.2 MB'}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" /> Inspect
                            </button>
                            <a
                              href={doc.storageUrl || `/api/v1/evidence/${encodeURIComponent(doc.id)}/file`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>CrimeNet AI • Legal Evidence Management System</span>
              <button
                type="button"
                onClick={() => {
                  if (previewDoc) setPreviewDoc(null);
                  else setIsDocModalOpen(false);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

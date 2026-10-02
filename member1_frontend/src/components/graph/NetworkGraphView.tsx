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
  Phone, Building2, Car, User, AlertTriangle, FileText, ChevronRight
} from 'lucide-react';

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
  
  // Advanced features
  const [isPathLoading, setIsPathLoading] = useState(false);
  const [pathSource, setPathSource] = useState<string>('');
  const [pathTarget, setPathTarget] = useState<string>('');
  
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
          selector: '.highlighted',
          style: {
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'width': 4,
            'z-index': 999
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-color': '#ef4444',
            'border-width': 5
          }
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.15
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
  const handleReset = () => {
    cyRef.current?.elements().removeClass('dimmed highlighted');
    setSelectedNode(null);
    setSearchQuery('');
    setFilterEntityType('ALL');
    setFilterRelType('ALL');
    setPathSource('');
    setPathTarget('');
    handleFit();
  };

  const handleShortestPath = async () => {
    if (!pathSource || !pathTarget || !selectedCaseId) return;
    setIsPathLoading(true);
    try {
      const res = await apiClient.get<any>(`/graph/shortest-path`, {
        params: { case_id: selectedCaseId, source: pathSource, target: pathTarget }
      });
      if (res.success && res.data && cyRef.current) {
        const pathNodes = res.data.nodes.map((n: any) => n.id);
        const cy = cyRef.current;
        cy.elements().addClass('dimmed').removeClass('highlighted');
        pathNodes.forEach((id: string) => cy.getElementById(id).removeClass('dimmed').addClass('highlighted'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPathLoading(false);
    }
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
              <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2"><GitMerge className="w-4 h-4"/> Path Discovery</h4>
              <div className="space-y-2">
                <input type="text" placeholder="Source Node ID" className="w-full p-2 text-sm border rounded bg-white" value={pathSource} onChange={e => setPathSource(e.target.value)} />
                <input type="text" placeholder="Target Node ID" className="w-full p-2 text-sm border rounded bg-white" value={pathTarget} onChange={e => setPathTarget(e.target.value)} />
                <button 
                  onClick={handleShortestPath} 
                  disabled={!pathSource || !pathTarget || isPathLoading}
                  className="w-full py-2 bg-[var(--primary)] text-[var(--text-primary)] font-semibold text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isPathLoading ? 'Tracing...' : 'Find Connection'}
                </button>
              </div>
            </div>
          </div>

          {/* Node Details Section */}
          <div className="p-5 flex-1 bg-slate-50/50">
            {selectedNode ? (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2"><Info className="w-4 h-4"/> Entity Details</h3>
                
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
                
                <button className="w-full py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4"/> View Source Documents
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
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { GRAPH_NODES, GRAPH_EDGES } from '../../data/syntheticData';
import { GraphNode, GraphEdge } from '../../types/graph';
import { EntityType } from '../../types/entities';
import { useNavigationStore } from '../../store/navigationStore';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Filter, 
  Eye, 
  EyeOff, 
  Layers, 
  Share2, 
  Sparkles, 
  Clock, 
  FileCheck, 
  GitMerge, 
  Info, 
  CheckCircle2,
  X
} from 'lucide-react';

export const NetworkGraphView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { selectEntity, setView, selectEvidence } = useNavigationStore();

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.8);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

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

  useEffect(() => {
    if (!containerRef.current) return;

    // Build Cytoscape elements from synthetic/M3 graph data
    const elements = [
      ...GRAPH_NODES.map(node => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.entityType,
          color: getNodeColor(node.entityType),
          degree: node.degree || 1,
          raw: node
        }
      })),
      ...GRAPH_EDGES.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.relationType,
          confidence: edge.confidence,
          raw: edge
        }
      }))
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-size': '11px',
            'font-family': 'Inter, sans-serif',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-background-color': '#090d16',
            'text-background-opacity': 0.85,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'width': '38px',
            'height': '38px',
            'border-width': 2,
            'border-color': '#ffffff',
            'border-opacity': 0.2,
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': 0.2
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#38bdf8',
            'border-width': 4,
            'border-opacity': 1,
            'width': '46px',
            'height': '46px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#334155',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'color': '#94a3b8',
            'text-rotation': 'autorotate',
            'text-background-color': '#090d16',
            'text-background-opacity': 0.7,
            'text-background-padding': '2px',
            'opacity': 0.8
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#38bdf8',
            'target-arrow-color': '#38bdf8',
            'width': 3.5,
            'opacity': 1
          }
        },
        {
          selector: '.highlighted',
          style: {
            'line-color': '#38bdf8',
            'target-arrow-color': '#38bdf8',
            'width': 4,
            'z-index': 999
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        padding: 40,
        nodeRepulsion: () => 450000,
        idealEdgeLength: () => 120,
        edgeElasticity: () => 100
      }
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
  }, []);

  // Controls
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 30);

  const handleShowNeighbors = () => {
    if (!cyRef.current || !selectedNode) return;
    const cy = cyRef.current;
    const node = cy.getElementById(selectedNode.id);
    const neighbors = node.neighborhood();
    cy.elements().style('opacity', 0.2);
    node.style('opacity', 1);
    neighbors.style('opacity', 1);
  };

  const handleResetVisibility = () => {
    if (!cyRef.current) return;
    cyRef.current.elements().style('opacity', 1);
  };

  const handleHighlightMultiHopPath = () => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    
    // Highlight the path from Vikram to BlueSea
    const pathIds = ['ENT-PERS-001', 'EDGE-01', 'ENT-PHON-001', 'EDGE-02', 'ENT-COMM-001', 'EDGE-03', 'ENT-PERS-002', 'EDGE-04', 'ENT-BANK-001', 'EDGE-05', 'ENT-TXN-001', 'EDGE-06', 'ENT-ORG-001'];
    
    cy.elements().removeClass('highlighted').style('opacity', 0.15);
    pathIds.forEach(id => {
      cy.getElementById(id).addClass('highlighted').style('opacity', 1);
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 select-none">
      
      {/* Top Controls Bar */}
      <div className="glass-panel rounded-2xl p-4 border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-100">Interactive Network Graph (Cytoscape.js)</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Graph Engine: Neo4j (M3) • Centrality: M5
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Click nodes to inspect degree centrality & multi-hop links. High centrality denotes network connectivity, not culpability.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={handleHighlightMultiHopPath}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors"
            title="Highlight 6-Hop Indirect Connection"
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>Trace Hidden Path</span>
          </button>

          <button
            onClick={handleResetVisibility}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition-colors"
          >
            Reset Focus
          </button>

          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              title="Fit Graph"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isFilterPanelOpen ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
            title="Filter Graph"
          >
            <Filter className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Main Canvas & Side Inspector Split */}
      <div className="relative h-[650px] w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-2xl">
        
        {/* Cytoscape DOM container */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 z-10 glass-panel bg-slate-950/80 p-2.5 rounded-xl border-slate-800 text-[10px] space-y-1">
          <div className="font-mono text-slate-400 uppercase font-semibold mb-1">Entity Categories</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Person</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Phone</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Bank Account</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Organization</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Location</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Crime</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Transaction</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> FIR Record</div>
          </div>
        </div>

        {/* Node Inspector Floating Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-20 w-80 rounded-2xl glass-panel bg-slate-950/95 border-cyan-500/40 p-4 shadow-2xl animate-in slide-in-from-right-4">
            
            <div className="flex items-start justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {selectedNode.entityType}
                </span>
                <h4 className="text-sm font-bold text-slate-100 mt-1">{selectedNode.label}</h4>
                <div className="text-[11px] font-mono text-slate-500">{selectedNode.id}</div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* M5 Analytics Metrics */}
            <div className="py-3 space-y-2 border-b border-slate-800 text-xs">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                M5 Graph Intelligence Metrics
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">Degree Centrality</span>
                  <span className="text-cyan-300 font-bold">{selectedNode.analytics?.degreeCentrality || 0.40}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">Betweenness Centrality</span>
                  <span className="text-amber-300 font-bold">{selectedNode.analytics?.betweennessCentrality || 0.52}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">PageRank Index</span>
                  <span className="text-emerald-300 font-bold">{selectedNode.analytics?.pagerank || 0.18}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[9px]">Louvain Community</span>
                  <span className="text-purple-300 font-bold">Cluster {selectedNode.analytics?.communityId || 1}</span>
                </div>
              </div>

              {selectedNode.analytics?.analyticalLeadNote && (
                <div className="p-2 rounded bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-200">
                  <span className="font-semibold block text-[10px] text-cyan-400">Analytical Lead:</span>
                  {selectedNode.analytics.analyticalLeadNote}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 space-y-2">
              <button
                onClick={handleShowNeighbors}
                className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Highlight Immediate Neighbors</span>
              </button>

              <button
                onClick={() => {
                  selectEntity(selectedNode.id);
                  setView('entity');
                }}
                className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow"
              >
                Open Entity Dossier →
              </button>
            </div>

          </div>
        )}

        {/* Edge Inspector Floating Drawer */}
        {selectedEdge && (
          <div className="absolute top-4 right-4 z-20 w-80 rounded-2xl glass-panel bg-slate-950/95 border-amber-500/40 p-4 shadow-2xl animate-in slide-in-from-right-4">
            
            <div className="flex items-start justify-between pb-2 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  Relationship Edge
                </span>
                <h4 className="text-sm font-bold text-slate-100 mt-1">{selectedEdge.relationType}</h4>
                <div className="text-[11px] font-mono text-slate-500">{selectedEdge.id}</div>
              </div>
              <button
                onClick={() => setSelectedEdge(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Confidence Score:</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedEdge.confidence * 100}%</span>
              </div>
              {selectedEdge.timestamp && (
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Recorded Timestamp:</span>
                  <span className="font-mono text-slate-200">{selectedEdge.timestamp}</span>
                </div>
              )}
              {selectedEdge.sourceDocument && (
                <div className="text-slate-400 pt-1">
                  <span className="block text-[10px] uppercase font-mono">Source Document:</span>
                  <span className="text-slate-200 font-mono">{selectedEdge.sourceDocument}</span>
                </div>
              )}
              {selectedEdge.transactionAmount && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs">
                  Debit Sum: ₹{selectedEdge.transactionAmount.toLocaleString('en-IN')}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => setView('evidence')}
                className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Inspect Supporting Evidence</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

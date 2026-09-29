import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { GRAPH_NODES, SYNTHETIC_COMMUNITIES } from '../../data/syntheticData';
import { fetchGraphData } from '../../services/graphService';
import { GraphNode } from '../../types/graph';
import { 
  BarChart3, 
  GitCommit, 
  Layers, 
  Share2, 
  Network, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:8000/api/v1');

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('crimenet_auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const GraphAnalyticsView: React.FC = () => {
  const { selectEntity, setView, selectedCaseId } = useNavigationStore();
  const [caseNodes, setCaseNodes] = useState<GraphNode[]>(GRAPH_NODES);
  const [netStats, setNetStats] = useState<any>({
    density: 0.182,
    connectedComponents: 1,
    louvainClusters: 2,
    bridgeNodes: 3
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const targetCase = selectedCaseId || 'CASE-2025-M3-DATASET';
    setIsLoading(true);

    Promise.all([
      fetch(`${API_BASE}/graph/analytics?case_id=${encodeURIComponent(targetCase)}`, { headers: getAuthHeaders() })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      fetch(`${API_BASE}/graph/communities?case_id=${encodeURIComponent(targetCase)}`, { headers: getAuthHeaders() })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      fetchGraphData(targetCase)
    ]).then(([statsRes, commRes, graphRes]) => {
      if (graphRes.success && graphRes.data && graphRes.data.nodes && graphRes.data.nodes.length > 0) {
        setCaseNodes(graphRes.data.nodes);
      } else {
        setCaseNodes(GRAPH_NODES);
      }

      const clusterCount = (commRes && commRes.data && commRes.data.clusters) ? commRes.data.clusters.length : 2;
      const densityVal = (statsRes && statsRes.data && typeof statsRes.data.density === 'number') ? statsRes.data.density : 0.182;
      const connComp = (statsRes && statsRes.data && statsRes.data.connectedComponents) ? statsRes.data.connectedComponents : 1;
      const bridges = (statsRes && statsRes.data && statsRes.data.topDegreeNodes) ? statsRes.data.topDegreeNodes.length : 3;

      setNetStats({
        density: densityVal,
        connectedComponents: connComp,
        louvainClusters: clusterCount,
        bridgeNodes: bridges
      });
    }).finally(() => {
      setIsLoading(false);
    });
  }, [selectedCaseId]);

  const centralityData = caseNodes.map(n => ({
    name: n.label.length > 14 ? n.label.slice(0, 12) + '...' : n.label,
    betweenness: n.analytics?.betweennessCentrality || 0.35,
    degree: n.analytics?.degreeCentrality || 0.40,
    pagerank: (n.analytics?.pagerank || 0.15) * 2, // normalized for chart
    raw: n
  })).sort((a, b) => b.betweenness - a.betweenness);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary)] font-semibold">
            M5 Graph Machine Learning Results
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-[var(--primary)] border border-cyan-800">
            Network Centrality Engine
          </span>
        </div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] mt-1">
          Graph Intelligence & Centrality Analytics
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Algorithmic network metrics calculated by M5 Graph ML models to identify liaison bridges and cluster bottlenecks.
        </p>
      </div>

      {/* MANDATORY ETHICAL PRINCIPLE NOTICE */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-amber-300 uppercase tracking-wide font-mono block">
            ANALYTICAL INTERPRETATION GUIDELINE:
          </span>
          <p className="text-amber-200/90 mt-1 leading-relaxed">
            A highly connected node indicates high topological betweenness or information flow within the indexed dataset. <strong>High Centrality ≠ Criminal Guilt.</strong> Network centrality is strictly an investigative lead to prioritize evidence collection, never an automated accusation.
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-xl rounded-xl p-4 border-[var(--border)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">Network Density</div>
          <div className="text-2xl font-bold text-[var(--primary)] font-mono mt-1">{netStats.density}</div>
          <span className="text-[10px] text-slate-500">Intra-Cluster Metric</span>
        </div>

        <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-xl rounded-xl p-4 border-[var(--border)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">Connected Components</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{netStats.connectedComponents} Giant</div>
          <span className="text-[10px] text-slate-500">Reachable Subgraphs</span>
        </div>

        <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-xl rounded-xl p-4 border-[var(--border)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">Louvain Communities</div>
          <div className="text-2xl font-bold text-purple-400 font-mono mt-1">{netStats.louvainClusters} Clusters</div>
          <span className="text-[10px] text-slate-500">Dynamic Modular Cells</span>
        </div>

        <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-xl rounded-xl p-4 border-[var(--border)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">Bridge Nodes Detected</div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{netStats.bridgeNodes} Liaison Hubs</div>
          <span className="text-[10px] text-slate-500">Cross-Cluster Intermediaries</span>
        </div>

      </div>

      {/* Centrality Distribution Chart */}
      <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-2xl p-5 border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Betweenness vs. Degree Centrality (Top Entities)
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">Computed via Brandes algorithm & random walk PageRank</p>
          </div>
          <span className="text-[10px] font-mono text-[var(--primary)] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            Source: M5 Subsystem
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={centralityData}>
              <XAxis dataKey="name" stroke="#475569" fontSize={10} />
              <YAxis stroke="#475569" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }}
              />
              <Bar dataKey="betweenness" name="Betweenness Centrality" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="degree" name="Degree Centrality" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Analytical Leads Table */}
      <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-2xl p-5 border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Algorithmic Bridge Nodes & Analytical Leads
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] text-[10px] font-mono uppercase text-[var(--text-secondary)] bg-[var(--bg-card)]">
              <tr>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Degree</th>
                <th className="py-2.5 px-3">Betweenness</th>
                <th className="py-2.5 px-3">PageRank</th>
                <th className="py-2.5 px-3">Liaison Role / Analytical Note</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {caseNodes.map(node => (
                <tr key={node.id} className="hover:bg-[var(--bg-card)] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">{node.label}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-50 text-cyan-300">
                      {node.entityType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[var(--text-secondary)]">{node.analytics?.degreeCentrality}</td>
                  <td className="py-2.5 px-3 text-[var(--primary)] font-bold">{node.analytics?.betweennessCentrality}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{node.analytics?.pagerank}</td>
                  <td className="py-2.5 px-3 font-sans text-[var(--text-secondary)] text-[11px] max-w-xs truncate">
                    {node.analytics?.analyticalLeadNote || (node.analytics?.isBridge ? 'Bridge node bridging operations' : 'Peripheral node')}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        selectEntity(node.id);
                        setView('entity');
                      }}
                      className="px-2 py-1 rounded bg-slate-50 hover:bg-slate-200 text-[var(--primary)] text-[10px] font-semibold transition-colors"
                    >
                      Dossier →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

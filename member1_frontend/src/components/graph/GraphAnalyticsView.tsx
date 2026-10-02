import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { apiClient } from '../../services/apiClient';
import { 
  Network, 
  RefreshCw, 
  Download, 
  AlertTriangle,
  Users,
  Link,
  Activity,
  Layers,
  Search
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface TopDegreeNode {
  id: string;
  degree: number;
}

interface GraphAnalytics {
  totalNodes: number;
  totalEdges: number;
  density: number;
  connectedComponents: number;
  topDegreeNodes: TopDegreeNode[];
}

interface GraphCommunities {
  algorithm: string;
  clusters: any[];
}

export const GraphAnalyticsView: React.FC<{caseId?: string}> = ({caseId}) => {
  const { selectEntity, setView, selectedCaseId } = useNavigationStore();
  
  const [stats, setStats] = useState<GraphAnalytics | null>(null);
  const [communities, setCommunities] = useState<GraphCommunities | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (caseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, commRes] = await Promise.all([
        apiClient.get<GraphAnalytics>(`/graph/analytics?case_id=${encodeURIComponent(caseId)}`),
        apiClient.get<GraphCommunities>(`/graph/communities?case_id=${encodeURIComponent(caseId)}`)
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setError('Failed to load graph analytics.');
      }

      if (commRes.success && commRes.data) {
        setCommunities(commRes.data);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('An error occurred while fetching graph analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) {
      fetchAnalytics(selectedCaseId);
    } else {
      setStats(null);
      setCommunities(null);
      setLastUpdated(null);
    }
  }, [selectedCaseId]);

  const handleRefresh = () => {
    if (selectedCaseId) {
      fetchAnalytics(selectedCaseId);
    }
  };

  const handleExport = () => {
    console.log('Exporting graph analytics...', { stats, communities });
  };

  const handleNodeClick = (id: string) => {
    selectEntity(id);
    setView('case-workspace');
  };

  if (!selectedCaseId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[var(--text-muted)] animate-in fade-in duration-300">
        <Search className="w-12 h-12 mb-4 text-slate-600" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Select a Case to view Analytics</h2>
        <p className="mt-2 max-w-md text-sm">
          Please select an active case from the workspace to view real-time graph analytics, network topologies, and algorithmic intelligence.
        </p>
      </div>
    );
  }

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-full animate-in fade-in">
        <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
        <span className="ml-3 text-[var(--text-secondary)] font-mono text-sm">Analyzing Network Topology...</span>
      </div>
    );
  }

  const hasData = stats && (stats.totalNodes > 0 || stats.totalEdges > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary)] font-semibold flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5" /> Network Analytics
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/50 text-[var(--primary)] border border-cyan-800/50">
              Live Data
            </span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Case Intelligence Dashboard
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Analyzing topological structures and centrality metrics for Case {selectedCaseId}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--primary)] hover:bg-cyan-600 text-slate-900 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
          {lastUpdated && (
            <div className="text-[10px] font-mono text-[var(--text-muted)]">
              Last Analysis: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-950/30 border border-red-900/50 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!hasData ? (
        <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-center flex flex-col items-center">
          <Network className="w-10 h-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-[var(--text-secondary)]">No Graph Relationships Available</h3>
          <p className="text-xs text-[var(--text-muted)] mt-2 max-w-sm">
            No graph relationships available for this case. Ingest data to analyze network topologies.
          </p>
        </div>
      ) : (
        <>
          {/* Overview Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                <Users className="w-3 h-3" /> Node Count
              </div>
              <div className="text-xl font-bold text-[var(--text-primary)] font-mono">{stats.totalNodes}</div>
            </div>
            
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                <Link className="w-3 h-3" /> Relationship Count
              </div>
              <div className="text-xl font-bold text-[var(--primary)] font-mono">{stats.totalEdges}</div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                <Activity className="w-3 h-3" /> Density
              </div>
              <div className="text-xl font-bold text-[var(--warning)] font-mono">
                {stats.density ? stats.density.toFixed(4) : '0.0000'}
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                <Layers className="w-3 h-3" /> Connected Comps
              </div>
              <div className="text-xl font-bold text-[var(--success)] font-mono">{stats.connectedComponents}</div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                <Network className="w-3 h-3" /> Community Count
              </div>
              <div className="text-xl font-bold text-purple-400 font-mono">
                {communities?.clusters?.length || 0}
              </div>
            </div>
          </div>

          {/* Top Degree Nodes Visualization */}
          {stats.topDegreeNodes && stats.topDegreeNodes.length > 0 && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center justify-between">
                Top Degree Nodes
                <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-card)] px-2 py-0.5 rounded">
                  Highest Direct Connectivity
                </span>
              </h3>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topDegreeNodes} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis 
                      dataKey="id" 
                      type="category" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                    />
                    <Tooltip 
                      cursor={{ fill: '#1e293b' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.375rem', fontSize: '12px' }}
                      itemStyle={{ color: '#38bdf8' }}
                    />
                    <Bar 
                      dataKey="degree" 
                      name="Degree" 
                      fill="#38bdf8" 
                      radius={[0, 4, 4, 0]}
                      onClick={(data) => {
                        if (data && data.id) {
                          handleNodeClick(data.id);
                        }
                      }}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Key Analytical Leads Table */}
          {stats.topDegreeNodes && stats.topDegreeNodes.length > 0 && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                Key Entities
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[var(--border)] text-[10px] font-mono uppercase text-[var(--text-secondary)] bg-[var(--bg-card)]">
                    <tr>
                      <th className="py-2.5 px-3">Entity ID</th>
                      <th className="py-2.5 px-3">Degree</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-mono">
                    {stats.topDegreeNodes.map((node) => (
                      <tr key={node.id} className="hover:bg-[var(--bg-card)] transition-colors">
                        <td className="py-2.5 px-3 font-medium text-[var(--text-secondary)]">{node.id}</td>
                        <td className="py-2.5 px-3 text-[var(--primary)]">{node.degree}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleNodeClick(node.id)}
                            className="px-2.5 py-1 rounded bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-semibold transition-colors border border-[var(--primary)]/20"
                          >
                            Investigate →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

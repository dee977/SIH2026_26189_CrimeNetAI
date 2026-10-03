import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { apiClient } from '../../services/apiClient';
import { fetchEntityById } from '../../services/entityService';
import { AnyEntity } from '../../types/entities';
import { PersonProfile } from '../entity/PersonProfile';
import { GenericEntityProfile } from '../entity/GenericEntityProfile';
import { 
  Network, 
  RefreshCw, 
  Download, 
  AlertTriangle,
  Users,
  Link,
  Activity,
  Layers,
  Search,
  FileText,
  ChevronDown,
  Loader2,
  ArrowUpRight,
  X,
  AlertCircle,
  ArrowLeft
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectEntity, setView, selectedCaseId } = useNavigationStore();
  const { addToast } = useNotificationStore();
  
  const effectiveCaseId = caseId || selectedCaseId || searchParams.get('caseId') || 'CASE-2026-HWL-001';

  const [stats, setStats] = useState<GraphAnalytics | null>(null);
  const [communities, setCommunities] = useState<GraphCommunities | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // BUG 1 Export States
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState<boolean>(false);

  // BUG 2 Dossier Modal States for Key Entities Investigation
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [isDossierLoading, setIsDossierLoading] = useState<boolean>(false);
  const [dossierError, setDossierError] = useState<string | null>(null);
  const [dossierEntity, setDossierEntity] = useState<AnyEntity | null>(null);
  const [activeDossierNode, setActiveDossierNode] = useState<{ id: string; name: string } | null>(null);
  const [dossierHistory, setDossierHistory] = useState<{ id: string; name: string }[]>([]);

  const fetchAnalytics = async (targetCaseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, commRes] = await Promise.all([
        apiClient.get<GraphAnalytics>(`/graph/analytics?case_id=${encodeURIComponent(targetCaseId)}`),
        apiClient.get<GraphCommunities>(`/graph/communities?case_id=${encodeURIComponent(targetCaseId)}`)
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
    if (effectiveCaseId) {
      fetchAnalytics(effectiveCaseId);
    } else {
      setStats(null);
      setCommunities(null);
      setLastUpdated(null);
    }
  }, [effectiveCaseId]);

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

  const handleRefresh = () => {
    if (effectiveCaseId) {
      fetchAnalytics(effectiveCaseId);
    }
  };

  // Helper to trigger browser download
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // BUG 1 FIX: Export analytics data as CSV (Metrics + Top Degree Entities)
  const exportAsCSV = () => {
    if (!stats) return;
    setIsExporting(true);
    setIsExportDropdownOpen(false);

    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `${effectiveCaseId}_analytics_${dateStr}.csv`;

      let csv = `CRIMENET AI - GRAPH ANALYTICS DOSSIER\n`;
      csv += `Case ID,${effectiveCaseId}\n`;
      csv += `Export Timestamp,${now.toISOString()}\n`;
      csv += `Classification,Official Law Enforcement Dossier\n\n`;

      csv += `SECTION 1: GRAPH TOPOLOGICAL METRICS\n`;
      csv += `Metric,Value\n`;
      csv += `Total Entities (Nodes),${stats.totalNodes}\n`;
      csv += `Total Relationships (Edges),${stats.totalEdges}\n`;
      csv += `Graph Density,${stats.density ? stats.density.toFixed(4) : '0.0000'}\n`;
      csv += `Connected Components,${stats.connectedComponents}\n`;
      csv += `Algorithmic Communities,${communities?.clusters?.length || 0}\n\n`;

      csv += `SECTION 2: TOP DEGREE NODES (KEY ANALYTICAL LEADS)\n`;
      csv += `Rank,Entity ID,Direct Connections (Degree),Network Share (%)\n`;
      
      const totalDegreeSum = stats.topDegreeNodes.reduce((acc, curr) => acc + curr.degree, 0) || 1;
      stats.topDegreeNodes.forEach((node, index) => {
        const share = ((node.degree / totalDegreeSum) * 100).toFixed(1);
        csv += `${index + 1},"${node.id}",${node.degree},${share}%\n`;
      });

      triggerDownload(csv, filename, 'text/csv');

      addToast({
        type: 'success',
        title: 'Export Complete',
        message: `Graph analytics CSV saved as ${filename}`
      });
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not generate CSV export.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // BUG 1 FIX: Export full analytics data payload as JSON
  const exportAsJSON = () => {
    if (!stats) return;
    setIsExporting(true);
    setIsExportDropdownOpen(false);

    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = `${effectiveCaseId}_analytics_${dateStr}.json`;

      const payload = {
        system: "CrimeNet AI - Criminal Network Analysis System (SIH26189)",
        classification: "CONFIDENTIAL / LAW ENFORCEMENT DOSSIER",
        caseId: effectiveCaseId,
        exportedAt: now.toISOString(),
        topologicalMetrics: {
          totalNodes: stats.totalNodes,
          totalEdges: stats.totalEdges,
          density: stats.density,
          connectedComponents: stats.connectedComponents,
          communityCount: communities?.clusters?.length || 0
        },
        topDegreeNodes: stats.topDegreeNodes.map((n, idx) => ({
          rank: idx + 1,
          entityId: n.id,
          degree: n.degree
        })),
        communities: communities?.clusters || []
      };

      triggerDownload(JSON.stringify(payload, null, 2), filename, 'application/json');

      addToast({
        type: 'success',
        title: 'Export Complete',
        message: `Graph analytics JSON saved as ${filename}`
      });
    } catch (err: any) {
      console.error('Failed to export JSON:', err);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not generate JSON export.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // BUG 2 FIX: Handler to fetch and open the complete intelligence dossier for any key entity
  const handleViewDossier = async (nodeId: string, nodeName?: string, resetHistory: boolean = true) => {
    if (!nodeId || !effectiveCaseId) return;
    console.log('[GraphAnalyticsView] Opening dossier for entity:', nodeId, nodeName);

    if (resetHistory) {
      setDossierHistory([]);
    }
    setActiveDossierNode({ id: nodeId, name: nodeName || nodeId });
    setIsDossierOpen(true);
    setIsDossierLoading(true);
    setDossierError(null);
    setDossierEntity(null);

    try {
      const res = await fetchEntityById(nodeId, effectiveCaseId);
      console.log('[GraphAnalyticsView] Dossier response for entity:', nodeId, res);
      if (res.success && res.data) {
        const raw = res.data as any;
        const mappedEntity: AnyEntity = {
          ...raw,
          type: raw.type || raw.entityType || 'Person',
          label: raw.label || raw.canonicalName || raw.name || raw.fullName || nodeName || nodeId,
          fullName: raw.fullName || raw.canonicalName || raw.name || nodeName || nodeId,
          id: raw.id || raw.entityId || nodeId,
          source: raw.source || 'Case Intelligence Graph',
          caseIds: raw.caseIds || (raw.caseId ? [raw.caseId] : [effectiveCaseId]),
          firstObserved: raw.firstObserved || raw.created_at || 'Registered',
          lastUpdated: raw.lastUpdated || raw.created_at || 'Active',
          evidenceCount: raw.evidenceCount || 0
        };
        setDossierEntity(mappedEntity);
      } else {
        setDossierError('Intelligence dossier not found for this entity in the active case.');
      }
    } catch (err: any) {
      console.error('[GraphAnalyticsView] Error fetching entity dossier:', nodeId, err);
      setDossierError(err?.message || 'Failed to load entity dossier.');
    } finally {
      setIsDossierLoading(false);
    }
  };

  // Drilldown to connected entities from within the modal
  const handleDrilldownDossier = (targetId: string, targetName?: string) => {
    if (activeDossierNode) {
      setDossierHistory(prev => [...prev, { id: activeDossierNode.id, name: activeDossierNode.name }]);
    }
    handleViewDossier(targetId, targetName || targetId, false);
  };

  // Step back to previous entity in dossier history
  const handleBackDossier = () => {
    if (dossierHistory.length === 0) return;
    const historyCopy = [...dossierHistory];
    const previous = historyCopy.pop()!;
    setDossierHistory(historyCopy);
    handleViewDossier(previous.id, previous.name, false);
  };

  // Navigate to full-page entity explorer
  const handleOpenInEntityExplorer = () => {
    if (!activeDossierNode) return;
    selectEntity(activeDossierNode.id);
    setView('entity');
    setIsDossierOpen(false);
    navigate(`/entities?entityId=${encodeURIComponent(activeDossierNode.id)}&caseId=${encodeURIComponent(effectiveCaseId)}`);
  };

  if (!effectiveCaseId) {
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
            Analyzing topological structures and centrality metrics for Case {effectiveCaseId}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--bg-card)] border border-[var(--border)] hover:bg-slate-800 text-[var(--text-primary)] rounded transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* BUG 1 FIX: Working Export Button with CSV & JSON options */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                disabled={isExporting || !hasData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--primary)] hover:bg-cyan-600 text-slate-900 font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                title="Export Graph Analytics (CSV / JSON)"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {isExportDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1 w-52 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setIsExportDropdownOpen(false)}
                >
                  <button
                    type="button"
                    onClick={exportAsCSV}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold block">Export as CSV</span>
                      <span className="text-[10px] text-slate-400">Metrics & Key Entities Table</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={exportAsJSON}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer transition-colors border-t border-slate-800"
                  >
                    <Download className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="font-semibold block">Export as JSON</span>
                      <span className="text-[10px] text-slate-400">Full Analytics Payload</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
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
                  Highest Direct Connectivity (Click bar to investigate)
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
                          handleViewDossier(data.id, data.id);
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
                        <td className="py-2.5 px-3 text-[var(--primary)] font-bold">{node.degree}</td>
                        <td className="py-2.5 px-3 text-right">
                          {/* BUG 2 FIX: Working Investigate button opening official dossier */}
                          <button
                            type="button"
                            onClick={() => handleViewDossier(node.id, node.id)}
                            className="px-2.5 py-1 rounded bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-semibold transition-colors border border-[var(--primary)]/20 cursor-pointer inline-flex items-center gap-1 active:scale-95"
                            title={`Investigate intelligence dossier for ${node.id}`}
                          >
                            <span>Investigate</span>
                            <span>→</span>
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

      {/* BUG 2 FIX: Official Case Dossier Modal */}
      {isDossierOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setIsDossierOpen(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Case Dossier</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Entity: <span className="text-slate-800 font-semibold">{activeDossierNode?.name || 'Selected Entity'}</span>
                    {' • '}ID: <span className="font-mono text-slate-600">{activeDossierNode?.id}</span>
                    {' • '}Case: <span className="font-mono text-blue-700">{effectiveCaseId}</span>
                  </p>
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
                  title="Open in full Search & Entity Explorer view"
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
                    onClick={() => activeDossierNode && handleViewDossier(activeDossierNode.id, activeDossierNode.name, false)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : dossierEntity ? (
                <div>
                  {dossierEntity.type === 'Person' ? (
                    <PersonProfile 
                      person={dossierEntity as any} 
                      onSelectLinkedEntity={handleDrilldownDossier}
                      onCloseModal={() => setIsDossierOpen(false)}
                      caseId={effectiveCaseId}
                    />
                  ) : (
                    <GenericEntityProfile 
                      entity={dossierEntity} 
                      onSelectLinkedEntity={handleDrilldownDossier}
                      onCloseModal={() => setIsDossierOpen(false)}
                      caseId={effectiveCaseId}
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

    </div>
  );
};

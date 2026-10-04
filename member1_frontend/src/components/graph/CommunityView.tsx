import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/navigationStore';
import { apiClient } from '../../services/apiClient';
import { 
  Users, 
  Share2,
  ExternalLink,
  Network,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface Cluster {
  clusterId: string;
  nodeIds: string[];
  memberCount: number;
  density: number;
}

interface EntityData {
  id: string;
  canonical_name?: string;
  label?: string;
  name?: string;
  entity_type?: string;
  type?: string;
}

export const CommunityView: React.FC = () => {
  const navigate = useNavigate();
  const { selectEntity, setView, selectedCaseId } = useNavigationStore();
  
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [entities, setEntities] = useState<Record<string, EntityData>>({});
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCaseId) {
      setClusters([]);
      setEntities({});
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      apiClient.get(`/graph/communities?case_id=${encodeURIComponent(selectedCaseId)}`),
      apiClient.get(`/entities?case_id=${encodeURIComponent(selectedCaseId)}`)
    ]).then(([commRes, entRes]) => {
      if (!isMounted) return;

      if (!commRes.success || !commRes.data?.clusters) {
        setClusters([]);
      } else {
        setClusters(commRes.data.clusters);
        if (commRes.data.clusters.length > 0) {
          setSelectedClusterId(commRes.data.clusters[0].clusterId);
        }
      }

      const entityMap: Record<string, EntityData> = {};
      if (entRes.success && Array.isArray(entRes.data)) {
        entRes.data.forEach((ent: any) => {
          entityMap[ent.id] = ent;
        });
      }
      setEntities(entityMap);
    }).catch(err => {
      if (isMounted) {
        console.error(err);
        setError('Failed to fetch data.');
        setClusters([]);
      }
    }).finally(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [selectedCaseId]);

  if (!selectedCaseId || (!isLoading && clusters.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-slate-50 border-slate-200">
        <Network className="w-12 h-12 text-[var(--text-secondary)] mb-4" />
        <h3 className="text-lg font-bold text-slate-800">No communities detected for this case.</h3>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Ensure relationships exist in the graph.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-[#0a192f] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  const activeCluster = clusters.find(c => c.clusterId === selectedClusterId) || clusters[0];
  const activeMembers = activeCluster?.nodeIds.map(id => entities[id] || { id }) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[#0a192f] font-semibold">
            Graph Analysis
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#0a192f] border border-blue-100">
            Community Detection
          </span>
        </div>
        <h1 className="text-xl font-bold text-[#0a192f] mt-1">
          Community Clusters
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Identified dense subgraphs and coordinated networks within the selected case.
        </p>
      </div>

      {/* Community Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clusters.map(cluster => {
          const isSelected = cluster.clusterId === selectedClusterId;
          return (
            <div
              key={cluster.clusterId}
              onClick={() => setSelectedClusterId(cluster.clusterId)}
              className={`p-5 rounded-2xl cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-50/90 border-2 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white shadow-sm border-2 border-slate-200 hover:border-blue-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                    isSelected 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {cluster.clusterId}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                      SELECTED
                    </span>
                  )}
                </div>
                <span className={`text-xs font-mono flex items-center font-medium ${isSelected ? 'text-blue-900 font-semibold' : 'text-slate-500'}`}>
                  <Users className={`w-3.5 h-3.5 mr-1 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  {cluster.memberCount} Members
                </span>
              </div>

              <div className={`flex items-center gap-3 text-[11px] mt-3 pt-2 border-t font-mono ${isSelected ? 'border-blue-200/80 text-blue-800' : 'border-slate-100 text-slate-500'}`}>
                <div>Density: <span className={`font-bold ${isSelected ? 'text-blue-950 font-mono' : 'text-slate-900'}`}>{cluster.density ? cluster.density.toFixed(3) : '0.000'}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Community Members & Analysis */}
      {activeCluster && (
        <div className="bg-white shadow-sm rounded-2xl p-6 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {activeCluster.clusterId} Member Entities
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {activeMembers.length} identified network nodes in this cluster
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setView('graph');
                navigate(`/graph?caseId=${encodeURIComponent(selectedCaseId)}&cluster=${encodeURIComponent(activeCluster.clusterId)}&isolate=${encodeURIComponent(activeCluster.nodeIds.join(','))}`);
              }}
              style={{ backgroundColor: '#FFFFFF' }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:border-blue-600 hover:bg-slate-50 text-slate-800 hover:text-slate-950 font-bold text-xs transition-all shadow-sm cursor-pointer shrink-0"
              title="Isolate and inspect this cluster in the Network Graph Canvas"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Isolate Graph in Canvas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeMembers.map(member => (
              <div
                key={member.id}
                onClick={() => {
                  selectEntity(member.id);
                  setView('entity');
                  navigate(`/entities?entityId=${encodeURIComponent(member.id)}`);
                }}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 transition-all group flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="text-blue-700 font-semibold px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                      {member.entity_type || member.type || 'Entity'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate mt-2 group-hover:text-blue-600 transition-colors">
                    {member.canonical_name || member.label || member.name || member.id}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{member.id}</p>
                </div>
                
                <div className="mt-3 pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectEntity(member.id);
                      setView('entity');
                      navigate(`/entities?entityId=${encodeURIComponent(member.id)}`);
                    }}
                    className="flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer py-1 px-2 rounded hover:bg-blue-100/50"
                  >
                    View Dossier <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

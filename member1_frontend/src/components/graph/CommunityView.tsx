import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { SYNTHETIC_COMMUNITIES, GRAPH_NODES } from '../../data/syntheticData';
import { 
  Layers, 
  Users, 
  Share2, 
  GitMerge, 
  ArrowRight, 
  CheckCircle2, 
  Network,
  Clock,
  ExternalLink
} from 'lucide-react';

export const CommunityView: React.FC = () => {
  const { selectEntity, setView } = useNavigationStore();
  const [selectedCommunityId, setSelectedCommunityId] = useState<number>(1);

  const activeCommunity = SYNTHETIC_COMMUNITIES.find(c => c.communityId === selectedCommunityId) || SYNTHETIC_COMMUNITIES[0];

  const communityMembers = GRAPH_NODES.filter(n => activeCommunity.memberEntityIds.includes(n.id));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            M5 Louvain Modularity Partition
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            Unsupervised Community Detection
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-100 mt-1">
          Syndicate Sub-Community Clusters
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Algorithmic detection of densely connected modular sub-graphs separating port logistics operations from financial hawala conduits.
        </p>
      </div>

      {/* Community Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYNTHETIC_COMMUNITIES.map(comm => {
          const isSelected = comm.communityId === selectedCommunityId;
          return (
            <div
              key={comm.communityId}
              onClick={() => setSelectedCommunityId(comm.communityId)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'glass-panel bg-slate-900/90 border-cyan-500/50 shadow-xl'
                  : 'glass-card bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Cluster #{comm.communityId}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {comm.size} Member Nodes
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-100">{comm.label}</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{comm.analyticalSummary}</p>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/80 font-mono">
                <div>Inter-Cluster Links: <span className="text-slate-300 font-bold">{comm.interCommunityConnections}</span></div>
                <div>Dominant Types: <span className="text-cyan-400">{comm.dominantEntityTypes.join(', ')}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Community Members & Analysis */}
      <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Cluster #{activeCommunity.communityId} Member Entities
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{activeCommunity.analyticalSummary}</p>
          </div>
          <button
            onClick={() => setView('graph')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Isolate in Graph Canvas</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {communityMembers.map(member => (
            <div
              key={member.id}
              onClick={() => {
                selectEntity(member.id);
                setView('entity');
              }}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="text-cyan-400 font-semibold">{member.entityType}</span>
                <span className="text-slate-500">{member.id}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100 truncate">{member.label}</h4>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2">
                <span>Degree: {member.analytics?.degreeCentrality || 0.2}</span>
                <span className="text-cyan-400">View Dossier →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

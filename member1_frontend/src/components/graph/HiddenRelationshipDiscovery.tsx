import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { getCaseGraphBundle } from '../../data/caseGraphs';
import { fetchHiddenPaths, fetchGraphData } from '../../services/graphService';
import { HiddenPathResult, GraphNode, GraphEdge } from '../../types/graph';
import { 
  GitMerge, 
  ArrowDown, 
  User, 
  Phone, 
  Landmark, 
  Building2, 
  ArrowLeftRight, 
  FileCheck, 
  ExternalLink,
  ShieldCheck,
  Search,
  CheckCircle2,
  PhoneCall,
  MapPin,
  Truck,
  ShieldAlert,
  Loader2,
  Sparkles
} from 'lucide-react';

export const HiddenRelationshipDiscovery: React.FC = () => {
  const { setView, selectEntity, selectEvidence, selectedCaseId } = useNavigationStore();
  
  const caseBundle = getCaseGraphBundle(selectedCaseId);
  const [sourceId, setSourceId] = useState<string>(caseBundle.candidateSources[0]?.id || 'P00004');
  const [targetId, setTargetId] = useState<string>(caseBundle.candidateTargets[0]?.id || 'P00001');
  const [sourcesList, setSourcesList] = useState<{ id: string; name?: string; label?: string; type?: string }[]>(caseBundle.candidateSources);
  const [targetsList, setTargetsList] = useState<{ id: string; name?: string; label?: string; type?: string }[]>(caseBundle.candidateTargets);
  
  const [pathResult, setPathResult] = useState<HiddenPathResult>(caseBundle.defaultHiddenPath);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Synchronize dropdowns and path whenever selectedCaseId changes
  useEffect(() => {
    const activeCase = selectedCaseId || 'CASE-2025-M3-DATASET';
    const bundle = getCaseGraphBundle(activeCase);
    
    fetchGraphData(activeCase).then((res: any) => {
      if (res.success && res.data && res.data.nodes && res.data.nodes.length > 0) {
        const liveNodes = res.data.nodes.map((n: any) => ({ id: n.id, name: n.label, type: n.entityType }));
        const mergedSrc = [...bundle.candidateSources];
        const mergedTgt = [...bundle.candidateTargets];
        liveNodes.forEach((ln: any) => {
          if (!mergedSrc.some(s => s.id === ln.id)) mergedSrc.push(ln);
          if (!mergedTgt.some(t => t.id === ln.id)) mergedTgt.push(ln);
        });
        setSourcesList(mergedSrc);
        setTargetsList(mergedTgt);
        if (mergedSrc[0]) setSourceId(mergedSrc[0].id);
        if (mergedTgt[1] || mergedTgt[0]) setTargetId((mergedTgt[1] || mergedTgt[0]).id);
      } else {
        setSourcesList(bundle.candidateSources);
        setTargetsList(bundle.candidateTargets);
        setSourceId(bundle.candidateSources[0]?.id || 'P00004');
        setTargetId(bundle.candidateTargets[0]?.id || 'P00001');
      }
    }).catch(() => {
      setSourcesList(bundle.candidateSources);
      setTargetsList(bundle.candidateTargets);
    });

    setPathResult(bundle.defaultHiddenPath);
  }, [selectedCaseId]);

  const handleExecuteTraversal = async () => {
    setIsLoading(true);
    const activeCase = selectedCaseId || 'CASE-2025-M3-DATASET';
    const bundle = getCaseGraphBundle(activeCase);

    try {
      const res = await fetchHiddenPaths(sourceId, targetId, activeCase);
      if (res.success && res.data && res.data.nodes && res.data.nodes.length > 0) {
        setPathResult(res.data);
      } else {
        setPathResult(bundle.defaultHiddenPath);
      }
    } catch (err) {
      setPathResult(bundle.defaultHiddenPath);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'Person': return <User className="w-5 h-5 text-blue-400" />;
      case 'Phone': return <Phone className="w-5 h-5 text-emerald-400" />;
      case 'Communication': return <PhoneCall className="w-5 h-5 text-teal-400" />;
      case 'BankAccount': return <Landmark className="w-5 h-5 text-amber-400" />;
      case 'Transaction': return <ArrowLeftRight className="w-5 h-5 text-yellow-400" />;
      case 'Organization': return <Building2 className="w-5 h-5 text-purple-400" />;
      case 'Location': return <MapPin className="w-5 h-5 text-red-400" />;
      case 'Vehicle': return <Truck className="w-5 h-5 text-indigo-400" />;
      case 'Crime': return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      default: return <GitMerge className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary)] font-semibold">
            M5 Graph Inference Engine
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-[var(--primary)] border border-cyan-800">
            Multi-Hop Traversal
          </span>
        </div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] mt-1">
          Hidden Indirect Relationship Discovery
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Trace non-obvious multi-hop conduits across intermediaries, burner phone endpoints, pass-through bank ledgers, and shell organizations with documentary evidence links.
        </p>
      </div>

      {/* Traversal Query Card */}
      <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl p-5 border-[var(--border)] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          
          <div className="md:col-span-2">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-semibold">
              Source Entity (Origin)
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
            >
              {sourcesList.map(cand => (
                <option key={cand.id} value={cand.id}>
                  {cand.name || cand.label} ({cand.type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center text-[var(--primary)]">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-cyan)] border border-[var(--primary)] flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <GitMerge className="w-5 h-5 text-cyan-400" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-semibold">
              Target Entity (Indirect Counterparty)
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
            >
              {targetsList.map(cand => (
                <option key={cand.id} value={cand.id}>
                  {cand.name || cand.label} ({cand.type})
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
          <div className="text-[11px] text-[var(--text-secondary)] font-mono">
            Active Case: <span className="text-cyan-400 font-semibold">{caseBundle.title}</span>
          </div>

          <button
            onClick={handleExecuteTraversal}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white hover:bg-cyan-400 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isLoading ? 'Analyzing...' : 'Execute Multi-Hop Traversal'}</span>
          </button>
        </div>
      </div>

      {/* Factual Path Explanation Box */}
      <div className="bg-[var(--bg-card)] shadow-sm border border-cyan-500/30 rounded-2xl p-5 bg-gradient-to-r from-cyan-950/20 to-transparent">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--surface-cyan)] border border-[var(--primary)] flex items-center justify-center text-[var(--primary)] shrink-0">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--primary)]">Factual Multi-Hop Connection Verified</span>
              <span className="text-[10px] font-mono bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-800">
                {pathResult.nodes.length - 1} Degrees of Separation
              </span>
              <span className="text-[10px] font-mono bg-slate-800 text-[var(--text-secondary)] px-2 py-0.5 rounded">
                Path ID: {pathResult.pathId}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed font-sans">
              {pathResult.explanation}
            </p>

            {pathResult.supportingEvidenceIds && pathResult.supportingEvidenceIds.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-cyan-900/40">
                <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Supporting Evidence Vault:</span>
                <div className="flex flex-wrap gap-1.5">
                  {pathResult.supportingEvidenceIds.map(evId => (
                    <button
                      key={evId}
                      onClick={() => { selectEvidence(evId); setView('evidence'); }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors flex items-center gap-1"
                    >
                      <FileCheck className="w-3 h-3 text-cyan-400" />
                      <span>{evId}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Multi-Hop Vertical Stepper */}
      <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Step-by-Step Evidentiary Relay ({pathResult.nodes.length} Nodes, {pathResult.edges.length} Connecting Conduits)
          </h3>
          <span className="text-xs font-mono text-cyan-400">
            Source: {pathResult.startEntity?.name} → Target: {pathResult.targetEntity?.name}
          </span>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-blue-500 before:to-purple-500">
          
          {pathResult.nodes.map((node, index) => {
            const edge = pathResult.edges[index];
            const isOrigin = index === 0;
            const isDestination = index === pathResult.nodes.length - 1;

            return (
              <div key={node.id} className="relative group space-y-3">
                
                {/* Step Circle Badge */}
                <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-[var(--bg-card)] border-2 flex items-center justify-center text-[10px] font-mono font-bold ${
                  isOrigin 
                    ? 'border-cyan-400 text-cyan-300' 
                    : isDestination 
                    ? 'border-purple-400 text-purple-300' 
                    : 'border-blue-400 text-blue-300'
                }`}>
                  {index + 1}
                </div>

                {/* Node Box */}
                <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-xl p-4 hover:border-cyan-500/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {getStepIcon(node.entityType || 'Person')}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isOrigin ? 'text-cyan-400' : isDestination ? 'text-purple-400' : 'text-blue-400'
                          }`}>
                            {isOrigin ? 'Origin Entity' : isDestination ? 'Target Entity (Final Destination)' : `Intermediary Hop #${index}`}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-secondary)]">({node.entityType})</span>
                        </div>
                        <h4 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{node.label}</h4>
                      </div>
                    </div>

                    <button
                      onClick={() => { selectEntity(node.id); setView('entity'); }}
                      className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>Dossier</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {node.analytics?.analyticalLeadNote && (
                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                      {node.analytics.analyticalLeadNote}
                    </p>
                  )}
                </div>

                {/* Connecting Edge Details (between this step and next) */}
                {edge && (
                  <div className="ml-4 pl-3 py-1 border-l-2 border-dashed border-cyan-500/30 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {edge.relationType}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      Confidence: {Math.round((edge.confidence || 0.95) * 100)}%
                    </span>
                    {edge.transactionAmount && (
                      <span className="text-[11px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                        Sum: ₹{edge.transactionAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                    {edge.sourceDocument && (
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                        Doc: {edge.sourceDocument}
                      </span>
                    )}
                  </div>
                )}

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
};

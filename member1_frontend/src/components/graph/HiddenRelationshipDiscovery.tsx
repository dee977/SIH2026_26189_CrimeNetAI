import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/navigationStore';
import { fetchHiddenPaths, fetchGraphData } from '../../services/graphService';
import { fetchEntityById } from '../../services/entityService';
import { HiddenPathResult } from '../../types/graph';
import { AnyEntity } from '../../types/entities';
import { PersonProfile } from '../entity/PersonProfile';
import { GenericEntityProfile } from '../entity/GenericEntityProfile';
import { 
  GitMerge, 
  User, 
  Phone, 
  Landmark, 
  Building2, 
  ArrowLeftRight, 
  FileCheck, 
  ExternalLink,
  Search,
  CheckCircle2,
  PhoneCall,
  MapPin,
  Truck,
  ShieldAlert,
  Loader2,
  Sparkles,
  Info,
  X,
  AlertCircle,
  ArrowUpRight,
  ArrowLeft
} from 'lucide-react';

export const HiddenRelationshipDiscovery: React.FC = () => {
  const { setView, selectEntity, selectEvidence, selectedCaseId } = useNavigationStore();
  const navigate = useNavigate();
  
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [nodes, setNodes] = useState<{ id: string; name?: string; label?: string; type?: string; entityType?: string }[]>([]);
  
  const [pathResult, setPathResult] = useState<HiddenPathResult | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState<boolean>(false);
  const [isPathLoading, setIsPathLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dossier Modal States for multi-hop nodes
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [isDossierLoading, setIsDossierLoading] = useState<boolean>(false);
  const [dossierError, setDossierError] = useState<string | null>(null);
  const [dossierEntity, setDossierEntity] = useState<AnyEntity | null>(null);
  const [activeDossierNode, setActiveDossierNode] = useState<{ id: string; name: string } | null>(null);
  const [dossierHistory, setDossierHistory] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!selectedCaseId) {
      setNodes([]);
      setSourceId('');
      setTargetId('');
      setPathResult(null);
      return;
    }
    
    let active = true;
    setIsGraphLoading(true);
    setError(null);
    setPathResult(null);
    
    fetchGraphData(selectedCaseId)
      .then((res: any) => {
        if (!active) return;
        if (res.success && res.data && res.data.nodes && res.data.nodes.length > 0) {
          const liveNodes = res.data.nodes.map((n: any) => ({ 
            id: n.id, 
            name: n.name || n.label, 
            type: n.entityType || n.type,
            entityType: n.entityType || n.type
          }));
          setNodes(liveNodes);
          if (liveNodes.length > 0) setSourceId(liveNodes[0].id);
          if (liveNodes.length > 1) setTargetId(liveNodes[1].id);
          else if (liveNodes.length === 1) setTargetId(liveNodes[0].id);
        } else {
          setNodes([]);
          setError("No entities found for the selected case.");
        }
      })
      .catch((err) => {
        if (!active) return;
        setNodes([]);
        setError("Failed to load entities.");
      })
      .finally(() => {
        if (active) setIsGraphLoading(false);
      });
      
    return () => { active = false; };
  }, [selectedCaseId]);

  const handleExecuteTraversal = async () => {
    if (!selectedCaseId || !sourceId || !targetId) return;
    
    setIsPathLoading(true);
    setPathResult(null);
    setError(null);

    try {
      const res = await fetchHiddenPaths(sourceId, targetId, selectedCaseId);
      if (res.success && res.data && res.data.nodes && res.data.nodes.length > 0) {
        setPathResult(res.data);
      } else {
        setPathResult(null);
        setError("No hidden path found between the selected entities.");
      }
    } catch (err) {
      setPathResult(null);
      setError("Failed to calculate hidden path. Please try again.");
    } finally {
      setIsPathLoading(false);
    }
  };

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

  // Handler to fetch and open the complete intelligence dossier for any path node
  const handleViewDossier = async (nodeId: string, nodeName: string, resetHistory: boolean = true) => {
    if (!nodeId || !selectedCaseId) return;
    console.log('[HiddenRelationship] View Dossier triggered for entity ID:', nodeId, nodeName);
    
    if (resetHistory) {
      setDossierHistory([]);
    }
    setActiveDossierNode({ id: nodeId, name: nodeName });
    setIsDossierOpen(true);
    setIsDossierLoading(true);
    setDossierError(null);
    setDossierEntity(null);

    try {
      const res = await fetchEntityById(nodeId, selectedCaseId);
      console.log('[HiddenRelationship] Dossier API response for entity ID:', nodeId, res);
      if (res.success && res.data) {
        const raw = res.data as any;
        const mappedEntity: AnyEntity = {
          ...raw,
          type: raw.type || raw.entityType || 'Person',
          label: raw.label || raw.canonicalName || raw.name || raw.fullName || nodeName,
          fullName: raw.fullName || raw.canonicalName || raw.name || nodeName,
          id: raw.id || raw.entityId || nodeId,
          source: raw.source || 'Case Intelligence Graph',
          caseIds: raw.caseIds || (raw.caseId ? [raw.caseId] : [selectedCaseId]),
          firstObserved: raw.firstObserved || raw.created_at || 'Registered',
          lastUpdated: raw.lastUpdated || raw.created_at || 'Active',
          evidenceCount: raw.evidenceCount || 0
        };
        setDossierEntity(mappedEntity);
      } else {
        setDossierError('Intelligence dossier not found for this entity in the active case.');
      }
    } catch (err: any) {
      console.error('[HiddenRelationship] Error fetching entity dossier:', nodeId, err);
      setDossierError(err?.message || 'Failed to load entity dossier.');
    } finally {
      setIsDossierLoading(false);
    }
  };

  // In-modal drill-down navigation when clicking linked entities inside dossier
  const handleDrilldownDossier = (targetId: string, targetName?: string) => {
    if (activeDossierNode) {
      setDossierHistory(prev => [...prev, { id: activeDossierNode.id, name: activeDossierNode.name }]);
    }
    handleViewDossier(targetId, targetName || targetId, false);
  };

  // In-modal back-navigation returning to previous dossier in the stack
  const handleBackDossier = () => {
    if (dossierHistory.length === 0) return;
    const historyCopy = [...dossierHistory];
    const previous = historyCopy.pop()!;
    setDossierHistory(historyCopy);
    handleViewDossier(previous.id, previous.name, false);
  };

  // Navigate to full-page entity search with selected entity
  const handleOpenInEntityExplorer = () => {
    if (!activeDossierNode) return;
    selectEntity(activeDossierNode.id);
    setView('entity');
    setIsDossierOpen(false);
    navigate('/entities');
  };

  const getStepIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'person': return <User className="w-5 h-5 text-blue-600" />;
      case 'phone': return <Phone className="w-5 h-5 text-[var(--primary)]" />;
      case 'communication': return <PhoneCall className="w-5 h-5 text-[var(--primary)]" />;
      case 'bankaccount': return <Landmark className="w-5 h-5 text-indigo-600" />;
      case 'transaction': return <ArrowLeftRight className="w-5 h-5 text-[var(--secondary)]" />;
      case 'organization': return <Building2 className="w-5 h-5 text-blue-700" />;
      case 'location': return <MapPin className="w-5 h-5 text-blue-600" />;
      case 'vehicle': return <Truck className="w-5 h-5 text-indigo-700" />;
      case 'crime': return <ShieldAlert className="w-5 h-5 text-red-600" />;
      default: return <GitMerge className="w-5 h-5 text-[var(--primary)]" />;
    }
  };

  if (!selectedCaseId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        <Info className="w-10 h-10 text-[var(--primary)] mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">No Case Selected</h3>
        <p className="text-sm text-[var(--text-muted)] mt-2">Please select an active case to discover hidden relationships.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold">
            M5 Graph Inference Engine
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Multi-Hop Traversal
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-2">
          Hidden Indirect Relationship Discovery
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Trace non-obvious multi-hop conduits across intermediaries, endpoints, bank ledgers, and organizations.
        </p>
      </div>

      {/* Traversal Query Card */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Source Entity
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              disabled={isGraphLoading || nodes.length === 0}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium disabled:opacity-50"
            >
              {nodes.map(cand => (
                <option key={cand.id} value={cand.id}>
                  {cand.name} ({cand.type || 'Unknown'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shadow-sm">
              <GitMerge className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Target Entity
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              disabled={isGraphLoading || nodes.length === 0}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium disabled:opacity-50"
            >
              {nodes.map(cand => (
                <option key={cand.id} value={cand.id}>
                  {cand.name} ({cand.type || 'Unknown'})
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
          <div className="text-xs text-[var(--text-muted)] font-medium">
            Active Case: <span className="text-blue-700 font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-100">{selectedCaseId}</span>
          </div>

          {/* BUG 1 FIX: Primary blue background matching the app's action buttons */}
          <button
            type="button"
            onClick={handleExecuteTraversal}
            disabled={isPathLoading || !sourceId || !targetId || sourceId === targetId}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isPathLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isPathLoading ? 'Analyzing Path...' : 'Execute Traversal'}</span>
          </button>
        </div>
      </div>

      {error && !pathResult && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-3">
          <Info className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Factual Path Explanation Box */}
      {pathResult && (
        <div className="bg-white shadow-sm border border-blue-200 rounded-2xl p-5 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-bold text-slate-900">Path Connection Verified</span>
                <span className="text-[10px] font-mono bg-blue-100 px-2.5 py-0.5 rounded text-blue-700 border border-blue-200 font-bold">
                  {pathResult.nodes.length - 1} Degrees of Separation
                </span>
                {pathResult.pathId && (
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded border border-slate-200">
                    ID: {pathResult.pathId}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {pathResult.explanation || 'A structural connection path was identified between the selected entities.'}
              </p>

              {pathResult.supportingEvidenceIds && pathResult.supportingEvidenceIds.length > 0 && (
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-blue-100">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Supporting Evidence:</span>
                  <div className="flex flex-wrap gap-2">
                    {pathResult.supportingEvidenceIds.map(evId => (
                      <button
                        key={evId}
                        onClick={() => { selectEvidence(evId); setView('evidence'); }}
                        className="text-[11px] font-mono px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1.5 font-semibold shadow-sm"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>{evId}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visual Multi-Hop Vertical Stepper */}
      {pathResult && (
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-blue-600" />
              Relay Sequence ({pathResult.nodes.length} Nodes)
            </h3>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-blue-200">
            
            {pathResult.nodes.map((node, index) => {
              const edge = pathResult.edges[index];
              const isOrigin = index === 0;
              const isDestination = index === pathResult.nodes.length - 1;

              return (
                <div key={node.id} className="relative group space-y-3">
                  
                  {/* Step Circle Badge */}
                  <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center text-[10px] font-bold ${
                    isOrigin 
                      ? 'border-blue-600 text-blue-700' 
                      : isDestination 
                      ? 'border-indigo-600 text-indigo-700' 
                      : 'border-slate-300 text-slate-600'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Node Box */}
                  <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
                          {getStepIcon(node.entityType || 'Person')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              isOrigin ? 'text-blue-700' : isDestination ? 'text-indigo-700' : 'text-[var(--text-muted)]'
                            }`}>
                              {isOrigin ? 'Origin Entity' : isDestination ? 'Target Entity' : `Intermediary #${index}`}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                              {node.entityType || 'Unknown'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">{node.label || (node as any).name}</h4>
                        </div>
                      </div>

                      {/* BUG 2 FIX: Working View Dossier button that opens entity dossier modal and supports full-page explorer navigation */}
                      <button
                        type="button"
                        onClick={() => handleViewDossier(node.id, node.label || (node as any).name || node.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1.5 font-bold bg-blue-50 hover:bg-blue-100 active:bg-blue-200 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors shrink-0 cursor-pointer shadow-xs"
                        title={`View intelligence dossier for ${node.label || (node as any).name || node.id}`}
                      >
                        <span>View Dossier</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {node.analytics?.analyticalLeadNote && (
                      <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {node.analytics.analyticalLeadNote}
                      </div>
                    )}
                  </div>

                  {/* Connecting Edge Details */}
                  {edge && (
                    <div className="ml-4 pl-4 py-2 border-l-2 border-dashed border-blue-200 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {edge.relationType || 'CONNECTED_TO'}
                      </span>
                      {edge.confidence && (
                        <span className="text-[11px] font-medium text-[var(--text-muted)] bg-white px-2 py-1 rounded border border-slate-200">
                          Confidence: {Math.round((edge.confidence) * 100)}%
                        </span>
                      )}
                      {edge.transactionAmount && (
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                          ₹{edge.transactionAmount.toLocaleString('en-IN')}
                        </span>
                      )}
                      {edge.sourceDocument && (
                        <span className="text-[11px] text-[var(--text-muted)] font-mono bg-white px-2 py-1 rounded border border-slate-200 truncate max-w-[200px]">
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
      )}

      {/* Entity Dossier Modal */}
      {isDossierOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setIsDossierOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Case Dossier</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Entity: <span className="text-slate-800 font-semibold">{activeDossierNode?.name || 'Selected Entity'}</span>
                    {' • '}ID: <span className="font-mono text-slate-600">{activeDossierNode?.id}</span>
                    {' • '}Case: <span className="font-mono text-blue-700">{selectedCaseId}</span>
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
                      caseId={selectedCaseId || undefined}
                    />
                  ) : (
                    <GenericEntityProfile 
                      entity={dossierEntity} 
                      onSelectLinkedEntity={handleDrilldownDossier}
                      onCloseModal={() => setIsDossierOpen(false)}
                      caseId={selectedCaseId || undefined}
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

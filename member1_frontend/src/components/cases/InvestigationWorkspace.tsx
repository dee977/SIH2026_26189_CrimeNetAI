import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { SYNTHETIC_CASES, ALL_ENTITIES, SYNTHETIC_EVIDENCE_RECORDS, SYNTHETIC_ALERTS } from '../../data/syntheticData';
import { NetworkGraphView } from '../graph/NetworkGraphView';
import { TimelineView } from '../timeline/TimelineView';
import { GISMapView } from '../gis/GISMapView';
import { EntityExplorer } from '../entity/EntityExplorer';
import { EvidenceView } from '../evidence/EvidenceView';
import { AlertsView } from '../alerts/AlertsView';
import { AIAssistantView } from '../assistant/AIAssistantView';
import { ReportView } from '../reports/ReportView';
import { 
  Briefcase, 
  Share2, 
  Clock, 
  MapPin, 
  Database, 
  FileCheck, 
  Bell, 
  Bot, 
  FileText, 
  History,
  Lock,
  ArrowLeft
} from 'lucide-react';

export const InvestigationWorkspace: React.FC = () => {
  const { selectedCaseId, setView } = useNavigationStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'timeline' | 'map' | 'entities' | 'evidence' | 'alerts' | 'assistant' | 'reports' | 'audit'>('overview');

  const activeCase = SYNTHETIC_CASES.find(c => c.id === selectedCaseId) || SYNTHETIC_CASES[0];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'graph', label: 'Network Graph', icon: <Share2 className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
    { id: 'map', label: 'GIS Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'entities', label: 'Entities', icon: <Database className="w-4 h-4" /> },
    { id: 'evidence', label: 'Evidence (SHA-256)', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-4 h-4" /> },
    { id: 'assistant', label: 'AI Assistant', icon: <Bot className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit History', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Dossier Header */}
      <div className="glass-panel rounded-2xl p-6 border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => setView('cases')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-mono transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Cases List</span>
            </button>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {activeCase.caseNumber}
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                {activeCase.status}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Classification: {activeCase.accessClassification}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100">{activeCase.title}</h1>
          </div>

          <div className="text-right text-xs font-mono text-slate-400 self-start sm:self-auto">
            <div>Lead: <span className="text-slate-200 font-semibold">{activeCase.leadInvestigator}</span></div>
            <div>Opened: <span className="text-slate-300">{activeCase.openedDate}</span></div>
            <div>Station: <span className="text-cyan-400">{activeCase.policeStation}</span></div>
          </div>
        </div>

        {/* Workspace Tab Bar */}
        <div className="flex items-center gap-1 overflow-x-auto mt-6 pt-4 border-t border-slate-800 scrollbar-none">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'overview' && (
          <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Investigation Summary & Scope</h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                {activeCase.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Associated FIRs</span>
                <span className="text-xs font-mono font-bold text-cyan-300">{activeCase.associatedFIRs.join(', ')}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Assigned Team Officers</span>
                <span className="text-xs text-slate-200">{activeCase.assignedTeam.join(' • ')}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Jurisdiction Area</span>
                <span className="text-xs text-slate-200">{activeCase.jurisdiction}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'graph' && <NetworkGraphView />}
        {activeTab === 'timeline' && <TimelineView />}
        {activeTab === 'map' && <GISMapView />}
        {activeTab === 'entities' && <EntityExplorer />}
        {activeTab === 'evidence' && <EvidenceView />}
        {activeTab === 'alerts' && <AlertsView />}
        {activeTab === 'assistant' && <AIAssistantView />}
        {activeTab === 'reports' && <ReportView />}

        {activeTab === 'audit' && (
          <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
              Immutable Cryptographic Audit Trail (M6 Ledger)
            </h3>
            <div className="space-y-2">
              {activeCase.auditHistory.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-cyan-400 font-bold">{item.action}</span>
                    <span className="text-slate-400">{item.timestamp}</span>
                  </div>
                  <div className="text-slate-300 font-sans">{item.details}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Officer: {item.officer}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

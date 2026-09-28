import React from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { 
  Shield, 
  ArrowLeft, 
  Layers, 
  Cpu, 
  Database, 
  FileCode, 
  Lock, 
  AlertCircle, 
  CheckCircle2,
  Users
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { setView } = useNavigationStore();

  const teamArchitecture = [
    { member: 'M1', role: 'Frontend Engineer', folder: 'member1_frontend/', responsibility: 'Investigative UI, Cytoscape network canvas, temporal timeline, GIS tactical interface, Shadcn components & demo orchestration' },
    { member: 'M2', role: 'Backend / API Engineer', folder: 'member2_backend/', responsibility: 'FastAPI / Node services, orchestration routers, business logic & RESTful endpoints' },
    { member: 'M3', role: 'Data Engineering & Neo4j', folder: 'member3_data_graph/', responsibility: 'Graph data ingestion, Cypher schemas, CCTNS & CDR entity normalization' },
    { member: 'M4', role: 'OCR, NLP & Entity Resolution', folder: 'member4_ai_nlp/', responsibility: 'FIR document extraction, multilingual translation, named entity recognition & entity disambiguation' },
    { member: 'M5', role: 'Graph ML & Cross-Verification', folder: 'member5_graph_ml/', responsibility: 'Louvain community detection, centrality metrics, multi-hop pathfinding & cross-source discrepancy analysis' },
    { member: 'M6', role: 'Security, Evidence & Deployment', folder: 'member6_security_evidence_deployment/', responsibility: 'Supabase Auth, hierarchical RBAC, SHA-256 evidence ledger, BSA §63 certificates & deployment pipelines' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      
      {/* Header */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <button
          onClick={() => setView('landing')}
          className="flex items-center gap-2 text-xs font-semibold text-[var(--primary)] hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--text-secondary)]">Problem ID:</span>
          <span className="text-xs font-mono font-bold text-[var(--primary)] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            SIH26189
          </span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 flex-1 space-y-12">
        
        {/* Title */}
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary)] font-semibold">
            System Architecture & Principles
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] mt-2">
            CrimeNet AI: Investigator-Support Philosophy
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed max-w-3xl">
            CrimeNet AI is an analytical support workstation engineered for law enforcement investigators, intelligence analysts, and judicial liaison officers. The platform ingests multi-source investigative records (FIRs, CDRs, Bank Transactions, Customs Manifests) to assist in discovering latent relationships and verifying documentary consistency.
          </p>
        </div>

        {/* Global Ethical Guardrails (MANDATORY PROJECT POLICY) */}
        <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-2xl p-6 border-[var(--primary)] bg-[var(--bg-card)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Strict Ethical & Legal Boundaries</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                CrimeNet AI strictly adheres to fair investigation and judicial presumption standards:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs font-medium">
                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-start gap-2.5">
                  <span className="text-red-400 font-bold">✕</span>
                  <span className="text-[var(--text-secondary)]">
                    <strong className="text-white">NO Risk Scores or Criminal Labels:</strong> The system never computes arbitrary numerical "risk scores" or assigns automated guilt labels.
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-start gap-2.5">
                  <span className="text-red-400 font-bold">✕</span>
                  <span className="text-[var(--text-secondary)]">
                    <strong className="text-white">NO Automated Legal Decisions:</strong> The system does not make final legal adjudications or invent synthetic evidence.
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-start gap-2.5">
                  <span className="text-[var(--primary)] font-bold">✓</span>
                  <span className="text-[var(--text-secondary)]">
                    <strong className="text-white">Centrality = Analytical Lead:</strong> High graph connectivity indicates network bridging, not culpability.
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-start gap-2.5">
                  <span className="text-[var(--primary)] font-bold">✓</span>
                  <span className="text-[var(--text-secondary)]">
                    <strong className="text-white">Objective Discrepancy Highlighting:</strong> Highlights conflicts between sources without picking which source is truthful.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Six Member Architecture Breakdown */}
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Team Ownership & Modular Separation</h2>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            Under strict project ownership rules, each sub-system is maintained exclusively by designated team members:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamArchitecture.map(item => (
              <div key={item.member} className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-xl p-4 border-[var(--border)] hover:border-[var(--border)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[var(--surface-cyan)] text-cyan-300 font-mono text-xs font-bold">
                      {item.member}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{item.role}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--bg-card)] px-2 py-0.5 rounded border border-[var(--border)]">
                    {item.folder}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.responsibility}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

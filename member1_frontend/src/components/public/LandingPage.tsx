import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { 
  Shield, 
  Share2, 
  Search, 
  Lock, 
  FileCheck, 
  ArrowRight, 
  Layers, 
  GitMerge, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { useDemoStore } from '../../store/demoStore';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { toggleDemoMode } = useDemoStore();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      
      {/* Top Header */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-dark.png" alt="CrimeNet AI" className="h-12 sm:h-14 w-auto object-contain" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[var(--text-primary)] tracking-tight hidden">CrimeNet AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-cyan)] text-cyan-300 font-mono font-bold">SIH26189</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">AI-Powered Criminal Network Analysis System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/about')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            About Project
          </button>
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--text-primary)] hover:bg-cyan-400 text-slate-950 text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
            >
              <span>Investigator Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-slate-50 border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--text-primary)] hover:bg-cyan-400 text-slate-950 text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Register Officer
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-24 max-w-6xl mx-auto text-center flex-1 flex flex-col justify-center">
        
        {/* Radar & Grid glow */}
        <div className="absolute inset-0 -z-10 grid-bg opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--surface-cyan)] rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* SIH Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-mono mb-8 mx-auto shadow-sm shadow-cyan-900/40">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Smart India Hackathon • Problem ID: SIH26189</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--text-primary)] tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          AI-Powered Criminal <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">Network Analysis</span> & Link Discovery
        </h1>

        <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mt-6 leading-relaxed">
          Advanced investigative intelligence platform empowering law enforcement officers to synthesize multi-modal criminal records, reveal hidden multi-hop relationships, and verify chain-of-custody evidence under the Bharatiya Sakshya Adhiniyam (BSA).
        </p>

        {/* Primary CTA Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all hover:scale-105"
            >
              Officer Sign In (RBAC)
            </button>
          </div>

        {/* Core Principles (Strict Investigator Support) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-16 text-left">
          
          <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-xl p-5 border-[var(--primary)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-cyan)] border border-[var(--primary)] flex items-center justify-center text-[var(--primary)] mb-3">
              <Share2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Hidden Link Discovery</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              Detect indirect multi-hop pathways across persons, phones, bank accounts, and shell logistics without subjective speculation.
            </p>
          </div>

          <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-xl p-5 border-[var(--primary)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-cyan)] border border-[var(--primary)] flex items-center justify-center text-[var(--primary)] mb-3">
              <FileCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Cryptographic Evidence Integrity</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              Continuous SHA-256 hash tracking and BSA Section 63 electronic record certification ensuring tamper-evident court admissibility.
            </p>
          </div>

          <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-xl p-5 border-[var(--primary)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-cyan)] border border-[var(--primary)] flex items-center justify-center text-[var(--primary)] mb-3">
              <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
            </div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Strict Ethical AI Guardrails</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              Zero automated risk scores or accusatory labels. High centrality is an analytical lead, preserving investigator discretion.
            </p>
          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg-card)] py-6 px-6 text-center text-xs text-[var(--text-muted)]">
        <p>CrimeNet AI • Smart India Hackathon (SIH26189) • Synthetic Demo Data Only • Not for Production Legal Adjudication</p>
      </footer>

    </div>
  );
};

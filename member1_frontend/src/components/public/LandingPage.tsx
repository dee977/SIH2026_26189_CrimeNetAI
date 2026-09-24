import React from 'react';
import { useNavigationStore } from '../../store/navigationStore';
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

export const LandingPage: React.FC = () => {
  const { setView } = useNavigationStore();
  const { isAuthenticated } = useAuthStore();
  const { toggleDemoMode } = useDemoStore();

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col">
      
      {/* Top Header */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-100 tracking-tight">CrimeNet AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">SIH26189</span>
            </div>
            <p className="text-[11px] text-slate-400">AI-Powered Criminal Network Analysis System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('about')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            About Project
          </button>
          {isAuthenticated ? (
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
            >
              <span>Investigator Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('login')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setView('register')}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold uppercase tracking-wider transition-colors"
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* SIH Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-xs font-mono mb-8 mx-auto shadow-sm shadow-cyan-900/40">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Smart India Hackathon • Problem ID: SIH26189</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-100 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          AI-Powered Criminal <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">Network Analysis</span> & Link Discovery
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          Advanced investigative intelligence platform empowering law enforcement officers to synthesize multi-modal criminal records, reveal hidden multi-hop relationships, and verify chain-of-custody evidence under the Bharatiya Sakshya Adhiniyam (BSA).
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
          <button
            onClick={() => {
              toggleDemoMode(true);
              setView('dashboard');
            }}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all hover:scale-105"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Launch Continuous Demo Story</span>
          </button>

          <button
            onClick={() => setView('login')}
            className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
          >
            Officer Sign In (RBAC)
          </button>
        </div>

        {/* Core Principles (Strict Investigator Support) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-16 text-left">
          
          <div className="glass-panel rounded-xl p-5 border-cyan-500/20">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Share2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Hidden Link Discovery</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Detect indirect multi-hop pathways across persons, phones, bank accounts, and shell logistics without subjective speculation.
            </p>
          </div>

          <div className="glass-panel rounded-xl p-5 border-cyan-500/20">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <FileCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Cryptographic Evidence Integrity</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Continuous SHA-256 hash tracking and BSA Section 63 electronic record certification ensuring tamper-evident court admissibility.
            </p>
          </div>

          <div className="glass-panel rounded-xl p-5 border-cyan-500/20">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Strict Ethical AI Guardrails</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Zero automated risk scores or accusatory labels. High centrality is an analytical lead, preserving investigator discretion.
            </p>
          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 px-6 text-center text-xs text-slate-500">
        <p>CrimeNet AI • Smart India Hackathon (SIH26189) • Synthetic Demo Data Only • Not for Production Legal Adjudication</p>
      </footer>

    </div>
  );
};

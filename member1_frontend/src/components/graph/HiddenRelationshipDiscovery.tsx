import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { SYNTHETIC_HIDDEN_PATH, ALL_ENTITIES } from '../../data/syntheticData';
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
  PhoneCall
} from 'lucide-react';

export const HiddenRelationshipDiscovery: React.FC = () => {
  const { setView, selectEntity, selectEvidence } = useNavigationStore();
  const [sourceId, setSourceId] = useState('ENT-PERS-001'); // Vikram Malhotra
  const [targetId, setTargetId] = useState('ENT-ORG-001');  // BlueSea Logistics Shell Co.

  const path = SYNTHETIC_HIDDEN_PATH;

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'Person': return <User className="w-5 h-5 text-blue-400" />;
      case 'Phone': return <Phone className="w-5 h-5 text-emerald-400" />;
      case 'Communication': return <PhoneCall className="w-5 h-5 text-teal-400" />;
      case 'BankAccount': return <Landmark className="w-5 h-5 text-amber-400" />;
      case 'Transaction': return <ArrowLeftRight className="w-5 h-5 text-yellow-400" />;
      case 'Organization': return <Building2 className="w-5 h-5 text-purple-400" />;
      default: return <GitMerge className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            M5 Graph Inference Engine
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            Multi-Hop Traversal
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-100 mt-1">
          Hidden Indirect Relationship Discovery
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Trace non-obvious multi-hop conduits across intermediaries, burner phone endpoints, pass-through bank ledgers, and shell organizations with documentary evidence links.
        </p>
      </div>

      {/* Traversal Query Card */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          
          <div className="md:col-span-2">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Source Entity
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="ENT-PERS-001">Vikram Malhotra (Person - Logistics Operator)</option>
              <option value="ENT-PERS-002">Rajesh K. Sharma (Person - Hawala Intermediary)</option>
            </select>
          </div>

          <div className="flex justify-center text-cyan-400">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <GitMerge className="w-4 h-4" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Target Entity (Indirect Counterparty)
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="ENT-ORG-001">BlueSea Logistics Shell Co. (Organization)</option>
              <option value="ENT-CRIM-001">Contraband Interception CR-2024-0912 (Crime)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Factual Path Explanation Box */}
      <div className="glass-panel rounded-2xl p-5 border-cyan-500/30 bg-slate-900/60">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400">Factual Multi-Hop Connection Verified</span>
              <span className="text-[10px] font-mono bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-800">
                6 Degrees of Separation
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {path.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Multi-Hop Vertical Stepper */}
      <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-6">
        <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
          Step-by-Step Evidentiary Relay
        </h3>

        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-blue-500 before:to-purple-500">
          
          {/* STEP 1: Vikram Malhotra */}
          <div className="relative group">
            <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-[10px] font-mono text-cyan-300 font-bold">
              1
            </div>
            <div className="glass-card rounded-xl p-4 border-slate-800 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {getStepIcon('Person')}
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400">Person A (Origin)</span>
                    <h4 className="text-sm font-bold text-slate-100">Vikram Malhotra</h4>
                  </div>
                </div>
                <button
                  onClick={() => { selectEntity('ENT-PERS-001'); setView('entity'); }}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <span>Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                On-ground logistics coordinator registered as subscriber of primary communications device.
              </p>
            </div>
          </div>

          {/* STEP 2: Phone */}
          <div className="relative group">
            <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center text-[10px] font-mono text-emerald-300 font-bold">
              2
            </div>
            <div className="glass-card rounded-xl p-4 border-slate-800 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {getStepIcon('Phone')}
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400">Hardware Endpoint</span>
                    <h4 className="text-sm font-bold text-slate-100">+91-98201-99412 (OnePlus 11 5G)</h4>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  IMEI: 864201048821901
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Seized under Faraday isolation. Forensic extraction corroborates active call log at 01:04 AM.
              </p>
            </div>
          </div>

          {/* STEP 3: Communication Call */}
          <div className="relative group">
            <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-teal-400 flex items-center justify-center text-[10px] font-mono text-teal-300 font-bold">
              3
            </div>
            <div className="glass-card rounded-xl p-4 border-slate-800 hover:border-teal-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {getStepIcon('Communication')}
                  <div>
                    <span className="text-[10px] font-mono text-teal-400">Telecom Intercept</span>
                    <h4 className="text-sm font-bold text-slate-100">342s Voice Call (01:04:10 AM)</h4>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Nhava Sheva → Surat Tower
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Voice transmission concluded exactly 14 minutes prior to triggering the financial debit wire.
              </p>
            </div>
          </div>

          {/* STEP 4: Person B (Rajesh K. Sharma) */}
          <div className="relative group">
            <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-blue-400 flex items-center justify-center text-[10px] font-mono text-blue-300 font-bold">
              4
            </div>
            <div className="glass-card rounded-xl p-4 border-slate-800 hover:border-blue-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {getStepIcon('Person')}
                  <div>
                    <span className="text-[10px] font-mono text-blue-400">Intermediary Broker</span>
                    <h4 className="text-sm font-bold text-slate-100">Rajesh K. Sharma (Surat Hawala Hub)</h4>
                  </div>
                </div>
                <button
                  onClick={() => { selectEntity('ENT-PERS-002'); setView('entity'); }}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <span>Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Financial intermediary documented as authorized signatory for shell accounts.
              </p>
            </div>
          </div>

          {/* STEP 5: Bank Account & Transaction */}
          <div className="relative group">
            <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-[10px] font-mono text-amber-300 font-bold">
              5
            </div>
            <div className="glass-card rounded-xl p-4 border-slate-800 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {getStepIcon('BankAccount')}
                  <div>
                    <span className="text-[10px] font-mono text-amber-400">Financial Relay Conduit</span>
                    <h4 className="text-sm font-bold text-slate-100">
                      HDFC Account (9921-4820) → TXN-90214 (₹15,00,000)
                    </h4>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  NEFT Settlement
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                ₹15,00,000 debited under transaction ref #TXN-90214 for invoice settlement at 01:18 AM.
              </p>
            </div>
          </div>

          {/* STEP 6: Shell Organization Target */}
          <div className="relative group">
            <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-purple-400 flex items-center justify-center text-[10px] font-mono text-purple-300 font-bold">
              6
            </div>
            <div className="glass-card rounded-xl p-4 border-slate-800 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {getStepIcon('Organization')}
                  <div>
                    <span className="text-[10px] font-mono text-purple-400">Target Organization</span>
                    <h4 className="text-sm font-bold text-slate-100">BlueSea Logistics & Trading Pvt Ltd</h4>
                  </div>
                </div>
                <button
                  onClick={() => { selectEntity('ENT-ORG-001'); setView('entity'); }}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <span>Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Fictitious shell entity listed as consignee on intercepted refrigerated shipping manifest.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { SYNTHETIC_AI_KNOWLEDGE_BASE, GroundedAIResponse } from '../../data/syntheticData';
import { askGroundedAssistant } from '../../services/aiAssistantService';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Share2, 
  FileCheck, 
  Clock, 
  GitMerge, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'investigator' | 'assistant';
  text?: string;
  data?: GroundedAIResponse;
  timestamp: string;
}

export const AIAssistantView: React.FC = () => {
  const { selectEntity, selectEvidence, setView } = useNavigationStore();

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      timestamp: '10:00 AM',
      text: 'CrimeNet AI Investigator Assistant online. I provide evidence-grounded responses corroborated by CCTNS FIR filings, telecom CDR carrier dumps, and certified banking ledgers. Inquiries unsupported by recorded evidence will be explicitly flagged.'
    },
    {
      id: 'msg-1',
      sender: 'investigator',
      timestamp: '10:01 AM',
      text: 'How is Vikram Malhotra connected to BlueSea Logistics and FIR-2024-8841?'
    },
    {
      id: 'msg-2',
      sender: 'assistant',
      timestamp: '10:01 AM',
      data: SYNTHETIC_AI_KNOWLEDGE_BASE[0]
    }
  ]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'investigator',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await askGroundedAssistant(q);
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        data: response.data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'How is Vikram Malhotra connected to BlueSea Logistics and FIR-2024-8841?',
    'What data discrepancies exist regarding Vikram Malhotra?',
    'Is there any evidence linking Vikram to offshore cryptocurrency wallets? (Test Unsupported)'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            M4 Natural Language & Entity Grounding
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            Zero-Hallucination Evidence RAG
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-100 mt-1">
          Grounded AI Investigator Assistant
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Ask questions regarding entities, timeline sequences, and hidden links. Every assertion is transparently supported by source documents and SHA-256 verified evidence.
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-slate-500 uppercase">Suggested Inquiries:</span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-300 transition-colors text-left"
          >
            "{p.length > 50 ? p.slice(0, 48) + '...' : p}"
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-6 min-h-[460px]">
        {messages.map(msg => (
          <div key={msg.id} className="space-y-3">
            
            {/* Investigator Message */}
            {msg.sender === 'investigator' && (
              <div className="flex justify-end">
                <div className="max-w-xl p-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-slate-100 text-xs shadow-md">
                  <div className="text-[10px] font-mono text-cyan-400 mb-1 flex items-center justify-between">
                    <span>Officer Inquiry</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="font-medium">{msg.text}</p>
                </div>
              </div>
            )}

            {/* Assistant Simple Greeting */}
            {msg.sender === 'assistant' && msg.text && (
              <div className="flex items-start gap-3 max-w-2xl">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed shadow-sm">
                  <div className="text-[10px] font-mono text-slate-500 mb-1 flex items-center justify-between">
                    <span>CrimeNet AI Knowledge Daemon</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              </div>
            )}

            {/* Structured Grounded AI Response Card */}
            {msg.sender === 'assistant' && msg.data && (
              <div className="flex items-start gap-3 max-w-3xl">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>

                <div className="flex-1 glass-card rounded-2xl p-5 border-cyan-500/30 bg-slate-950/80 space-y-4 shadow-xl">
                  
                  {/* Top Grounding Status */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Evidence-Grounded Intelligence Synthesis</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Case: {msg.data.caseReferences.join(', ')}
                    </span>
                  </div>

                  {/* 1. Answer */}
                  <div className="text-xs text-slate-200 leading-relaxed bg-slate-900/90 p-4 rounded-xl border border-slate-800 font-sans">
                    {msg.data.answer}
                  </div>

                  {/* 2. Relevant Entities */}
                  {msg.data.relevantEntities.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5 font-semibold">
                        Relevant Entities ({msg.data.relevantEntities.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.data.relevantEntities.map(ent => (
                          <button
                            key={ent.id}
                            onClick={() => { selectEntity(ent.id); setView('entity'); }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-slate-700 font-mono text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <span>{ent.label}</span>
                            <span className="text-[9px] text-slate-500 font-sans">({ent.type})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Graph Path */}
                  {msg.data.graphPath.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-[11px] space-y-1">
                      <span className="text-[10px] uppercase text-cyan-400 font-bold block mb-1 flex items-center gap-1">
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>Factual Multi-Hop Path Traversal:</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-1 text-slate-300">
                        {msg.data.graphPath.map((step, sIdx) => (
                          <span key={sIdx} className={step.includes('↓') ? 'text-cyan-400 font-bold' : 'text-slate-200'}>
                            {step}{' '}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Source Records */}
                  {msg.data.sourceRecords.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5 font-semibold">
                        Underlying Source Documents (Never Hidden):
                      </span>
                      <div className="space-y-1.5">
                        {msg.data.sourceRecords.map((rec, rIdx) => (
                          <div key={rIdx} className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px]">
                            <div className="flex items-center justify-between text-slate-300 font-mono mb-0.5">
                              <span className="font-semibold text-cyan-400">{rec.source}</span>
                              <span className="text-slate-500">{rec.documentRef}</span>
                            </div>
                            <p className="text-slate-400 italic font-sans">{rec.excerpt}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Supporting Evidence & SHA-256 Checksums */}
                  {msg.data.supportingEvidence.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5 font-semibold">
                        Supporting Evidence Items & Hash Status:
                      </span>
                      <div className="space-y-1.5">
                        {msg.data.supportingEvidence.map(ev => (
                          <div key={ev.evidenceId} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
                            <div>
                              <span className="text-cyan-300 font-bold mr-2">{ev.evidenceId}:</span>
                              <span className="text-slate-200">{ev.title}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{ev.status}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. Confidence & Analytical Context */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <div>
                      <span className="text-cyan-400 font-semibold">Context: </span>
                      {msg.data.confidenceContext}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 py-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Scanning Neo4j graph nodes and evidence files...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask AI Assistant about target entities, fund flows, or evidence chains..."
          className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};

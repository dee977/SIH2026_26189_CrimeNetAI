import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { SYNTHETIC_TIMELINE_EVENTS, SYNTHETIC_ACTIVITY_BURSTS } from '../../data/syntheticData';
import { TimelineCategory, TimelineEvent } from '../../types/timeline';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Filter, 
  PhoneCall, 
  ArrowLeftRight, 
  MapPin, 
  ShieldAlert, 
  FileText, 
  Layers, 
  ExternalLink,
  Sparkles,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const TimelineView: React.FC = () => {
  const { selectEntity, setView, selectEvidence } = useNavigationStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(SYNTHETIC_TIMELINE_EVENTS.length - 1);

  const categories: { key: string; label: string }[] = [
    { key: 'ALL', label: 'All Event Streams' },
    { key: 'Communication', label: 'Communications (CDR)' },
    { key: 'Transaction', label: 'Transactions (Banking)' },
    { key: 'Location', label: 'Locations & FASTag' },
    { key: 'Crime', label: 'Crimes & Seizures' },
    { key: 'Relationship', label: 'FIR & Legal Links' },
    { key: 'Event', label: 'Berthing & Cargo Logs' }
  ];

  // Playback timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev < SYNTHETIC_TIMELINE_EVENTS.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const visibleEvents = SYNTHETIC_TIMELINE_EVENTS
    .slice(0, playbackIndex + 1)
    .filter(ev => selectedCategory === 'ALL' || ev.category === selectedCategory);

  const getCategoryIcon = (cat: TimelineCategory) => {
    switch (cat) {
      case 'Communication': return <PhoneCall className="w-4 h-4 text-emerald-400" />;
      case 'Transaction': return <ArrowLeftRight className="w-4 h-4 text-yellow-400" />;
      case 'Location': return <MapPin className="w-4 h-4 text-red-400" />;
      case 'Crime': return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'Relationship': return <FileText className="w-4 h-4 text-cyan-400" />;
      default: return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title & Playback Controls */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Temporal Intelligence Engine
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Synchronized Multi-Source Chronology
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1">
            Investigative Timeline & Burst Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological cross-correlation between intercepted calls, swift remittance wires, and port yard container movements.
          </p>
        </div>

        {/* Playback Button Group */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
            <span>{isPlaying ? 'Pause Playback' : 'Play Chronology'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setPlaybackIndex(0);
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
            title="Reset to Start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Daily Event & Activity Bursts Chart */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Activity Burst Analysis (August 10 - 16, 2024)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            Aug 14: Critical Anomaly Burst Detected
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SYNTHETIC_ACTIVITY_BURSTS}>
              <XAxis dataKey="date" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }}
              />
              <Bar dataKey="communicationCount" name="Calls & SMS" fill="#34d399" />
              <Bar dataKey="locationPings" name="Location Pings" fill="#f87171" />
              <Bar dataKey="totalEvents" name="Total Events Logged" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.key
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Chronological Stream */}
      <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-slate-200">
            Chronological Sequence ({visibleEvents.length} Events Displayed)
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Playback Progress: {playbackIndex + 1} / {SYNTHETIC_TIMELINE_EVENTS.length}
          </span>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {visibleEvents.map((event, idx) => (
            <div key={event.id} className="relative group animate-in slide-in-from-left-2">
              
              {/* Dot Icon */}
              <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-slate-950 border-2 flex items-center justify-center ${
                event.isBurstPoint ? 'border-amber-400 shadow-md shadow-amber-500/30 animate-pulse' : 'border-slate-700'
              }`}>
                {getCategoryIcon(event.category)}
              </div>

              {/* Event Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                event.isBurstPoint 
                  ? 'bg-amber-500/5 border-amber-500/30' 
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}>
                
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-200">{event.timestamp}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {event.category}
                    </span>
                    {event.isBurstPoint && (
                      <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                        Critical Window
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{event.source}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-100">{event.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{event.description}</p>

                {/* Linked Entity Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Entities:</span>
                  <button
                    onClick={() => { selectEntity(event.primaryEntity.id); setView('entity'); }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[11px] transition-colors"
                  >
                    {event.primaryEntity.label}
                  </button>
                  {event.secondaryEntity && (
                    <button
                      onClick={() => { selectEntity(event.secondaryEntity!.id); setView('entity'); }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[11px] transition-colors"
                    >
                      {event.secondaryEntity.label}
                    </button>
                  )}
                  {event.sourceEvidenceId && (
                    <button
                      onClick={() => { selectEvidence(event.sourceEvidenceId!); setView('evidence'); }}
                      className="ml-auto text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>Evidence Ref ({event.sourceEvidenceId})</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};

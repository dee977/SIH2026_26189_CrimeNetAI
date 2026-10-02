import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { TimelineCategory, TimelineEvent } from '../../types/timeline';
import { apiClient } from '../../services/apiClient';
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
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const TimelineView: React.FC<{caseId?: string}> = ({caseId}) => {
  const { selectedCaseId, selectEntity, setView, selectEvidence } = useNavigationStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bursts, setBursts] = useState<any[]>([]);

  const activeCase = selectedCaseId || 'CASE-2025-M3-DATASET';

  const fetchTimelineEvents = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<any>('/timeline', {
        params: { case_id: activeCase, caseId: activeCase }
      });

      const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);

      if (items && items.length > 0) {
        const mapped: TimelineEvent[] = items.map((item: any, idx: number) => {
          let cat: TimelineCategory = 'Event';
          const rawType = (item.eventType || '').toUpperCase();
          if (rawType.includes('COMMUNICATION') || rawType.includes('CALL')) cat = 'Communication';
          else if (rawType.includes('FINANCIAL') || rawType.includes('TRANSACTION')) cat = 'Transaction';
          else if (rawType.includes('LOCATION') || rawType.includes('TOLL')) cat = 'Location';
          else if (rawType.includes('CRIME') || rawType.includes('SEIZURE')) cat = 'Crime';
          else if (rawType.includes('RELATIONSHIP') || rawType.includes('FIR')) cat = 'Relationship';

          const ts = item.timestamp ? item.timestamp.replace('T', ' ').slice(0, 16) : '2026-01-08 12:00';
          const isBurst = idx === 0 || item.title?.toLowerCase().includes('burst') || item.title?.toLowerCase().includes('spike');

          return {
            id: item.eventId || item.id || `EVT-${idx}`,
            timestamp: ts,
            category: cat,
            title: item.title || 'Timeline Event',
            description: item.description || 'Recorded operational activity.',
            primaryEntity: {
              id: item.primaryEntityId || 'P00004',
              label: item.primaryEntityName || item.primaryEntityId || 'Primary Subject',
              type: 'Person'
            },
            secondaryEntity: item.secondaryEntityId ? {
              id: item.secondaryEntityId,
              label: item.secondaryEntityName || item.secondaryEntityId,
              type: 'Person'
            } : undefined,
            locationName: item.location || 'Central Corridor Grid',
            source: item.sourceDocument || 'M3 Carrier Ingestion Dump',
            sourceEvidenceId: item.evidenceId || undefined,
            isBurstPoint: isBurst
          };
        });

        // Compute hourly/daily density chart
        const countsByTime: Record<string, { total: number; comms: number; txns: number }> = {};
        mapped.forEach(e => {
          const key = e.timestamp.slice(11, 16) || e.timestamp.slice(0, 10);
          if (!countsByTime[key]) countsByTime[key] = { total: 0, comms: 0, txns: 0 };
          countsByTime[key].total += 1;
          if (e.category === 'Communication') countsByTime[key].comms += 1;
          if (e.category === 'Transaction') countsByTime[key].txns += 1;
        });

        const chartData = Object.entries(countsByTime).map(([timeWindow, counts]) => ({
          timeWindow,
          totalEvents: counts.total,
          comms: counts.comms,
          txns: counts.txns,
          isCritical: counts.total >= 2
        }));

        setBursts(chartData.length > 0 ? chartData : [
          { timeWindow: '08:30', totalEvents: 14, comms: 14, txns: 0, isCritical: true },
          { timeWindow: '10:15', totalEvents: 3, comms: 1, txns: 2, isCritical: false },
          { timeWindow: '11:45', totalEvents: 8, comms: 2, txns: 6, isCritical: true },
          { timeWindow: '14:10', totalEvents: 4, comms: 2, txns: 2, isCritical: false },
          { timeWindow: '17:30', totalEvents: 6, comms: 3, txns: 3, isCritical: true }
        ]);

        setEvents(mapped);
        setPlaybackIndex(mapped.length - 1);
      }
    } catch (err) {
      console.warn('Failed to load timeline from API, using case defaults:', err);
      const fallbackEvents: TimelineEvent[] = [
        {
          id: 'EVT-M3-01',
          timestamp: '2026-01-08 08:30',
          category: 'Communication',
          title: 'VoIP Encrypted Burst Call Intercept',
          description: '14 short-duration encrypted voice calls recorded between courier and handler preceding suspected shipment dispatch.',
          primaryEntity: { id: 'P00004', label: 'Person_00004 (Courier)', type: 'Person' },
          secondaryEntity: { id: 'P00005', label: 'Person_00005 (Handler)', type: 'Person' },
          locationName: 'Airtel Sector 4 Tower (Cell 19402)',
          source: 'carrier_cdr_dump.csv',
          sourceEvidenceId: 'EVD-2025-M3-01',
          isBurstPoint: true
        },
        {
          id: 'EVT-M3-02',
          timestamp: '2026-01-08 10:15',
          category: 'Location',
          title: 'Fastag Highway Toll Barrier Passage',
          description: 'Transport carrier vehicle crossed Khed Shivapur Toll Gate moving along southern corridor.',
          primaryEntity: { id: 'P00004', label: 'Person_00004', type: 'Person' },
          locationName: 'Khed Shivapur Toll Plaza (NH4)',
          source: 'nhai_fastag_transit_logs.csv',
          sourceEvidenceId: 'EVD-2025-M3-02'
        },
        {
          id: 'EVT-M3-03',
          timestamp: '2026-01-08 11:45',
          category: 'Transaction',
          title: 'Layered RTGS Fund Dispersion (INR 18,50,000)',
          description: 'Rapid smurfed transfers split across 4 intermediary accounts including ICICI Escrow Mule Account #8821.',
          primaryEntity: { id: 'ACC-FEEDER', label: 'ACC-FEEDER', type: 'BankAccount' },
          secondaryEntity: { id: 'ACC-90218821', label: 'ICICI Mule #8821', type: 'BankAccount' },
          locationName: 'ICICI Bank Mumbai',
          source: 'cbs_bank_statements.csv',
          sourceEvidenceId: 'EVD-2025-M3-03',
          isBurstPoint: true
        }
      ];
      setEvents(fallbackEvents);
      setPlaybackIndex(fallbackEvents.length - 1);
      setBursts([
        { timeWindow: '08:30', totalEvents: 14, isCritical: true },
        { timeWindow: '10:15', totalEvents: 3, isCritical: false },
        { timeWindow: '11:45', totalEvents: 8, isCritical: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelineEvents();
  }, [activeCase]);

  const categories: { key: string; label: string }[] = [
    { key: 'ALL', label: 'All Event Streams' },
    { key: 'Communication', label: 'Communications (CDR)' },
    { key: 'Transaction', label: 'Transactions (Banking)' },
    { key: 'Location', label: 'Locations & FASTag' },
    { key: 'Crime', label: 'Crimes & Seizures' },
    { key: 'Relationship', label: 'FIR & Legal Links' }
  ];

  // Playback timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev < events.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, events.length]);

  const visibleEvents = events
    .slice(0, playbackIndex + 1)
    .filter(ev => selectedCategory === 'ALL' || ev.category === selectedCategory);

  const getCategoryIcon = (cat: TimelineCategory) => {
    switch (cat) {
      case 'Communication': return <PhoneCall className="w-4 h-4 text-[var(--success)]" />;
      case 'Transaction': return <ArrowLeftRight className="w-4 h-4 text-yellow-400" />;
      case 'Location': return <MapPin className="w-4 h-4 text-red-400" />;
      case 'Crime': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'Relationship': return <FileText className="w-4 h-4 text-cyan-400" />;
      default: return <Clock className="w-4 h-4 text-[var(--text-secondary)]" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title & Playback Controls Header */}
      <div className="bg-[var(--bg-card)] shadow-sm rounded-2xl p-5 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary)] font-semibold">
              Temporal Intelligence Engine
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-[var(--primary)] border border-cyan-800">
              Case: {activeCase}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mt-1">
            Chronological Sequence & Temporal Density
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Synchronizes CDR intercepts, banking ledgers, FASTag highway passages, and FIR filings into an auditable timeline.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchTimelineEvents}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-cyan-300 transition-colors"
            title="Refresh Timeline"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => { setPlaybackIndex(0); setIsPlaying(true); }}
            className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-cyan-300 transition-colors"
            title="Restart Playback from Beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Play Sequence</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Temporal Event Density Chart (Recharts) */}
      <div className="bg-[var(--bg-card)] shadow-sm rounded-2xl p-5 border border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Temporal Event Density & Activity Bursts
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">
            {events.length} Telemetry Points Mapped
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bursts}>
              <XAxis dataKey="timeWindow" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#0891b2', borderRadius: '0.75rem', fontSize: '11px', color: '#f8fafc' }}
                cursor={{ fill: 'rgba(8, 145, 178, 0.1)' }}
              />
              <Bar dataKey="totalEvents" name="Events Volume" fill="#06b6d4" radius={[4, 4, 0, 0]} />
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
                ? 'bg-[var(--surface-cyan)] text-cyan-300 border border-[var(--primary)] shadow-sm'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Chronological Stream */}
      <div className="bg-[var(--bg-card)] shadow-sm rounded-2xl p-6 border border-[var(--border)] space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Chronological Sequence ({visibleEvents.length} Events Displayed)
          </h3>
          <span className="text-[11px] font-mono text-[var(--text-secondary)]">
            Playback Progress: {playbackIndex + 1} / {events.length}
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-cyan-400 font-mono text-xs flex items-center justify-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Assembling chronological event streams from case evidence...</span>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyan-900/40">
            {visibleEvents.map((event, idx) => (
              <div key={event.id} className="relative group animate-in slide-in-from-left-2">
                
                {/* Dot Icon */}
                <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-[var(--bg-card)] border-2 flex items-center justify-center ${
                  event.isBurstPoint ? 'border-amber-400 shadow-md shadow-amber-500/30 animate-pulse' : 'border-[var(--primary)]'
                }`}>
                  {getCategoryIcon(event.category)}
                </div>

                {/* Event Card */}
                <div className={`p-4 rounded-xl border transition-all ${
                  event.isBurstPoint 
                    ? 'bg-amber-500/5 border-amber-500/40' 
                    : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-cyan-800'
                }`}>
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-300">{event.timestamp}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {event.category}
                      </span>
                      {event.isBurstPoint && (
                        <span className="text-[10px] font-mono font-bold uppercase text-[var(--warning)] bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                          Critical Anomaly Window
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">{event.locationName}</span>
                  </div>

                  <h4 className="text-sm font-bold text-[var(--text-primary)]">{event.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{event.description}</p>

                  {/* Linked Entity Badges & Evidence Link */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-[var(--border)] text-xs">
                    <span className="text-[10px] uppercase font-mono text-[var(--text-muted)]">Entities:</span>
                    <button
                      onClick={() => { selectEntity(event.primaryEntity.id); setView('entity'); }}
                      className="px-2 py-0.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-card)] text-cyan-300 font-mono text-[11px] transition-colors"
                    >
                      {event.primaryEntity.label}
                    </button>
                    {event.secondaryEntity && (
                      <button
                        onClick={() => { selectEntity(event.secondaryEntity!.id); setView('entity'); }}
                        className="px-2 py-0.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-card)] text-cyan-300 font-mono text-[11px] transition-colors"
                      >
                        {event.secondaryEntity.label}
                      </button>
                    )}
                    {event.sourceEvidenceId && (
                      <button
                        onClick={() => { selectEvidence(event.sourceEvidenceId!); setView('evidence'); }}
                        className="ml-auto text-[11px] font-mono text-[var(--success)] hover:underline flex items-center gap-1"
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
        )}

      </div>

    </div>
  );
};

import React from 'react';
import { AnyEntity } from '../../types/entities';
import { useNavigationStore } from '../../store/navigationStore';
import { 
  Phone, 
  Landmark, 
  Truck, 
  MapPin, 
  Building2, 
  FileText, 
  ShieldAlert, 
  ArrowLeftRight, 
  PhoneCall, 
  FileCheck,
  Share2,
  Clock,
  ExternalLink,
  AlertTriangle,
  Database
} from 'lucide-react';

interface GenericEntityProfileProps {
  entity: AnyEntity;
}

export const GenericEntityProfile: React.FC<GenericEntityProfileProps> = ({ entity }) => {
  const { setView, selectEntity } = useNavigationStore();

  const getEntityIcon = () => {
    switch (entity.type) {
      case 'Phone': return <Phone className="w-8 h-8 text-emerald-400" />;
      case 'BankAccount': return <Landmark className="w-8 h-8 text-amber-400" />;
      case 'Vehicle': return <Truck className="w-8 h-8 text-indigo-400" />;
      case 'Location': return <MapPin className="w-8 h-8 text-red-400" />;
      case 'Organization': return <Building2 className="w-8 h-8 text-purple-400" />;
      case 'FIR': return <FileText className="w-8 h-8 text-cyan-400" />;
      case 'Crime': return <ShieldAlert className="w-8 h-8 text-rose-400" />;
      case 'Transaction': return <ArrowLeftRight className="w-8 h-8 text-yellow-400" />;
      case 'Communication': return <PhoneCall className="w-8 h-8 text-teal-400" />;
      case 'Evidence': return <FileCheck className="w-8 h-8 text-emerald-400" />;
      default: return <Database className="w-8 h-8 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Card */}
      <div className="glass-panel rounded-2xl p-6 border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/80">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-lg">
              {getEntityIcon()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {entity.type}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {entity.id}
                </span>
                {entity.firstObserved && (
                  <span className="text-xs font-mono text-slate-400">
                    Logged: {entity.firstObserved}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-100">{entity.label}</h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                <div>Source: <span className="text-slate-200">{entity.source}</span></div>
                {entity.sourceDocument && <div>Ref: <span className="text-slate-300">{entity.sourceDocument}</span></div>}
                <div>Case: <span className="text-cyan-400">{entity.caseIds.join(', ')}</span></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('graph')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Locate in Graph</span>
            </button>
            <button
              onClick={() => setView('timeline')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Timeline</span>
            </button>
          </div>

        </div>

        {/* Factual Anomaly Indicators (Strictly not a risk score) */}
        {entity.anomalyIndicators && entity.anomalyIndicators.length > 0 && (
          <div className="mt-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono mb-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>ANOMALY & IRREGULARITY SIGNALS</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-200/90 list-disc list-inside">
              {entity.anomalyIndicators.map((ind, i) => (
                <li key={i}>{ind}</li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Field-Specific Data Renderers */}
      <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
          Technical Specifications & Corroborated Attributes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          
          {/* PHONE */}
          {entity.type === 'Phone' && (
            <>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Phone Number</div>
                <div className="text-sm font-bold text-slate-100 font-mono mt-1">{(entity as any).phoneNumber}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Hardware IMEI</div>
                <div className="text-sm font-mono text-slate-200 mt-1">{(entity as any).imei || 'Not Extracted'}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Carrier / Provider</div>
                <div className="text-sm text-emerald-400 font-semibold mt-1">{(entity as any).serviceProvider}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Registered Subscriber</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{(entity as any).registeredSubscriber}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Last Active Tower</div>
                <div className="text-sm text-cyan-300 font-mono mt-1">{(entity as any).lastActiveTower}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">CDR Call Volume</div>
                <div className="text-sm font-mono text-amber-400 font-bold mt-1">{(entity as any).cdrCallCount} calls</div>
              </div>
            </>
          )}

          {/* BANK ACCOUNT */}
          {entity.type === 'BankAccount' && (
            <>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Account Number</div>
                <div className="text-sm font-bold text-amber-300 font-mono mt-1">{(entity as any).accountNumber}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Financial Institution</div>
                <div className="text-sm text-slate-100 font-semibold mt-1">{(entity as any).bankName} ({(entity as any).branch})</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">IFSC Code</div>
                <div className="text-sm font-mono text-slate-300 mt-1">{(entity as any).ifscCode}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Account Title</div>
                <div className="text-sm font-bold text-slate-100 mt-1">{(entity as any).accountHolderName}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Account Classification</div>
                <div className="text-sm text-cyan-400 font-semibold mt-1">{(entity as any).accountType}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Total Transactions Logged</div>
                <div className="text-sm font-mono text-slate-200 mt-1">{(entity as any).totalTransactionsLogged} Entries</div>
              </div>
            </>
          )}

          {/* TRANSACTION */}
          {entity.type === 'Transaction' && (
            <>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Settlement Amount</div>
                <div className="text-lg font-bold text-amber-400 font-mono mt-1">
                  ₹{(entity as any).amountINR?.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Timestamp</div>
                <div className="text-sm font-mono text-slate-200 mt-1">{(entity as any).timestamp}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Payment Rails</div>
                <div className="text-sm text-cyan-300 font-semibold mt-1">{(entity as any).channel}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Originator Account</div>
                <div className="text-sm font-mono text-slate-200 mt-1">{(entity as any).sourceAccount}</div>
                <div className="text-[11px] text-slate-400">{(entity as any).sourceHolder}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Beneficiary Account</div>
                <div className="text-sm font-mono text-slate-200 mt-1">{(entity as any).destinationAccount}</div>
                <div className="text-[11px] text-slate-400">{(entity as any).destinationHolder}</div>
              </div>
            </>
          )}

          {/* LOCATION */}
          {entity.type === 'Location' && (
            <>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Coordinates</div>
                <div className="text-sm font-mono text-red-400 font-bold mt-1">
                  {(entity as any).latitude}, {(entity as any).longitude}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Category</div>
                <div className="text-sm text-slate-200 font-semibold mt-1">{(entity as any).locationCategory}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Jurisdiction Address</div>
                <div className="text-xs text-slate-300 mt-1">{(entity as any).address}</div>
              </div>
            </>
          )}

          {/* FIR */}
          {entity.type === 'FIR' && (
            <>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">FIR Number</div>
                <div className="text-sm font-bold text-cyan-400 font-mono mt-1">{(entity as any).firNumber}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Police Station</div>
                <div className="text-sm text-slate-200 font-semibold mt-1">{(entity as any).policeStation}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Investigation Status</div>
                <div className="text-sm text-emerald-400 font-semibold mt-1">{(entity as any).status}</div>
              </div>
              <div className="col-span-full p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase mb-1">Applied Legal Sections</div>
                <div className="flex flex-wrap gap-1.5">
                  {(entity as any).sectionsApplied?.map((sec: string) => (
                    <span key={sec} className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[11px]">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* CRIME */}
          {entity.type === 'Crime' && (
            <>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Crime Incident ID</div>
                <div className="text-sm font-bold text-rose-400 font-mono mt-1">{(entity as any).crimeId}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Category</div>
                <div className="text-sm text-slate-200 font-semibold mt-1">{(entity as any).crimeCategory}</div>
              </div>
              <div className="col-span-full p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase mb-1">Modus Operandi</div>
                <p className="text-xs text-slate-300 leading-relaxed">{(entity as any).modusOperandi}</p>
              </div>
            </>
          )}

          {/* ORGANIZATION */}
          {entity.type === 'Organization' && (
            <>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Corporate Name</div>
                <div className="text-sm font-bold text-purple-300 mt-1">{(entity as any).orgName}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">CIN / Registration</div>
                <div className="text-sm font-mono text-slate-200 mt-1">{(entity as any).registrationNumber}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px] uppercase">Type</div>
                <div className="text-sm text-amber-400 font-semibold mt-1">{(entity as any).orgType}</div>
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
};

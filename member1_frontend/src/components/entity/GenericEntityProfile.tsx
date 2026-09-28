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
      case 'Phone': return <Phone className="w-8 h-8 text-emerald-600" />;
      case 'BankAccount': return <Landmark className="w-8 h-8 text-amber-600" />;
      case 'Vehicle': return <Truck className="w-8 h-8 text-indigo-600" />;
      case 'Location': return <MapPin className="w-8 h-8 text-red-600" />;
      case 'Organization': return <Building2 className="w-8 h-8 text-purple-600" />;
      case 'FIR': return <FileText className="w-8 h-8 text-blue-600" />;
      case 'Crime': return <ShieldAlert className="w-8 h-8 text-rose-600" />;
      case 'Transaction': return <ArrowLeftRight className="w-8 h-8 text-amber-600" />;
      case 'Communication': return <PhoneCall className="w-8 h-8 text-teal-600" />;
      case 'Evidence': return <FileCheck className="w-8 h-8 text-emerald-600" />;
      default: return <Database className="w-8 h-8 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Card */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 bg-gradient-to-br from-white via-slate-50/40 to-blue-50/20">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 shadow-sm">
              {getEntityIcon()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  {entity.type}
                </span>
                <span className="text-xs font-mono text-slate-600 font-medium">
                  {entity.id}
                </span>
                {entity.firstObserved && (
                  <span className="text-xs font-mono text-slate-500">
                    Logged: {entity.firstObserved}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mt-1">{entity.label}</h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2 font-mono">
                <div>Source: <span className="text-slate-900 font-semibold">{entity.source}</span></div>
                {entity.sourceDocument && <div>Ref: <span className="text-slate-500">{entity.sourceDocument}</span></div>}
                <div>Case: <span className="text-blue-700 font-semibold">{entity.caseIds?.join(', ')}</span></div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start shrink-0">
            <button
              onClick={() => setView('graph')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
              title="Locate Entity in Network Graph"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Locate in Graph</span>
            </button>
            <button
              onClick={() => setView('timeline')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
              title="View Chronological Event Trail"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setView('evidence')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
              title="View Associated Evidence"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Evidence</span>
            </button>
          </div>

        </div>

        {/* Factual Anomaly Indicators (Strictly not a risk score) */}
        {entity.anomalyIndicators && entity.anomalyIndicators.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold font-mono mb-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>ANOMALY & IRREGULARITY SIGNALS</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-900 list-disc list-inside">
              {entity.anomalyIndicators.map((ind, i) => (
                <li key={i}>{ind}</li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Field-Specific Data Renderers */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Technical Specifications & Corroborated Attributes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          
          {/* PHONE */}
          {entity.type === 'Phone' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Phone Number</div>
                <div className="text-sm font-bold text-slate-900 font-mono mt-1">{(entity as any).phoneNumber}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Hardware IMEI</div>
                <div className="text-sm font-mono text-slate-800 mt-1 font-semibold">{(entity as any).imei || 'Not Extracted'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Carrier / Provider</div>
                <div className="text-sm text-emerald-700 font-bold mt-1">{(entity as any).serviceProvider}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Registered Subscriber</div>
                <div className="text-sm font-bold text-slate-900 mt-1">{(entity as any).registeredSubscriber}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Last Active Tower</div>
                <div className="text-sm text-blue-700 font-mono mt-1 font-semibold">{(entity as any).lastActiveTower}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">CDR Call Volume</div>
                <div className="text-sm font-mono text-amber-700 font-bold mt-1">{(entity as any).cdrCallCount} calls</div>
              </div>
            </>
          )}

          {/* BANK ACCOUNT */}
          {entity.type === 'BankAccount' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Account Number</div>
                <div className="text-sm font-bold text-amber-900 font-mono mt-1">{(entity as any).accountNumber}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Financial Institution</div>
                <div className="text-sm text-slate-900 font-semibold mt-1">{(entity as any).bankName} ({(entity as any).branch})</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">IFSC Code</div>
                <div className="text-sm font-mono text-slate-700 mt-1 font-semibold">{(entity as any).ifscCode}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Account Title</div>
                <div className="text-sm font-bold text-slate-900 mt-1">{(entity as any).accountHolderName}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Account Classification</div>
                <div className="text-sm text-blue-700 font-bold mt-1">{(entity as any).accountType}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Total Transactions Logged</div>
                <div className="text-sm font-mono text-slate-900 font-bold mt-1">{(entity as any).totalTransactionsLogged} Entries</div>
              </div>
            </>
          )}

          {/* TRANSACTION */}
          {entity.type === 'Transaction' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Settlement Amount</div>
                <div className="text-lg font-bold text-amber-700 font-mono mt-1">
                  ₹{(entity as any).amountINR?.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Timestamp</div>
                <div className="text-sm font-mono text-slate-900 font-semibold mt-1">{(entity as any).timestamp}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Payment Rails</div>
                <div className="text-sm text-blue-700 font-bold mt-1">{(entity as any).channel}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Originator Account</div>
                <div className="text-sm font-mono text-slate-900 font-bold mt-1">{(entity as any).sourceAccount}</div>
                <div className="text-[11px] text-slate-500 font-medium">{(entity as any).sourceHolder}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Beneficiary Account</div>
                <div className="text-sm font-mono text-slate-900 font-bold mt-1">{(entity as any).destinationAccount}</div>
                <div className="text-[11px] text-slate-500 font-medium">{(entity as any).destinationHolder}</div>
              </div>
            </>
          )}

          {/* LOCATION */}
          {entity.type === 'Location' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Coordinates</div>
                <div className="text-sm font-mono text-red-600 font-bold mt-1">
                  {(entity as any).latitude}, {(entity as any).longitude}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Category</div>
                <div className="text-sm text-slate-900 font-bold mt-1">{(entity as any).locationCategory}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Jurisdiction Address</div>
                <div className="text-xs text-slate-700 mt-1 font-medium">{(entity as any).address}</div>
              </div>
            </>
          )}

          {/* FIR */}
          {entity.type === 'FIR' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">FIR Number</div>
                <div className="text-sm font-bold text-blue-700 font-mono mt-1">{(entity as any).firNumber}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Police Station</div>
                <div className="text-sm text-slate-900 font-semibold mt-1">{(entity as any).policeStation}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Investigation Status</div>
                <div className="text-sm text-emerald-700 font-bold mt-1">{(entity as any).status}</div>
              </div>
              <div className="col-span-full p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold mb-1.5">Applied Legal Sections</div>
                <div className="flex flex-wrap gap-1.5">
                  {(entity as any).sectionsApplied?.map((sec: string) => (
                    <span key={sec} className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[11px] font-semibold">
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
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Crime Incident ID</div>
                <div className="text-sm font-bold text-rose-700 font-mono mt-1">{(entity as any).crimeId}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Category</div>
                <div className="text-sm text-slate-900 font-bold mt-1">{(entity as any).crimeCategory}</div>
              </div>
              <div className="col-span-full p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold mb-1">Modus Operandi</div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{(entity as any).modusOperandi}</p>
              </div>
            </>
          )}

          {/* ORGANIZATION */}
          {entity.type === 'Organization' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Corporate Name</div>
                <div className="text-sm font-bold text-purple-900 mt-1">{(entity as any).orgName}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">CIN / Registration</div>
                <div className="text-sm font-mono text-slate-800 mt-1 font-semibold">{(entity as any).registrationNumber}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Type</div>
                <div className="text-sm text-amber-800 font-bold mt-1">{(entity as any).orgType}</div>
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
};

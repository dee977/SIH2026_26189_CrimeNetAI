
import React, { useState, useRef, useEffect } from "react";
import { useNavigationStore } from "../../store/navigationStore";
import { useCaseStore } from "../../store/caseStore";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { Briefcase, Plus, Search, ChevronDown, CheckCircle2, AlertCircle, Archive, Pause } from "lucide-react";

interface CaseSelectorProps {
  onChange?: (caseId: string) => void;
  navigateOnSelect?: boolean;
  showCreateOption?: boolean;
  compact?: boolean;
  variant?: "light" | "dark";
  className?: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  active: { icon: <CheckCircle2 className="w-3 h-3" />, color: "text-emerald-600", label: "Active" },
  under_investigation: { icon: <Search className="w-3 h-3" />, color: "text-blue-600", label: "Investigating" },
  on_hold: { icon: <Pause className="w-3 h-3" />, color: "text-amber-600", label: "On Hold" },
  closed: { icon: <Archive className="w-3 h-3" />, color: "text-slate-500", label: "Closed" },
};

export const CaseSelector: React.FC<CaseSelectorProps> = ({
  onChange,
  navigateOnSelect = false,
  showCreateOption = true,
  compact = false,
  variant = "light",
  className = ""
}) => {
  const { selectedCaseId, selectCase } = useNavigationStore();
  const { cases } = useCaseStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCase = cases.find(c => c.caseId === selectedCaseId);
  
  const canCreate = user?.grantedRole === "ADMIN";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (caseId: string) => {
    selectCase(caseId);
    if (onChange) onChange(caseId);
    if (navigateOnSelect) {
      navigate(`/cases/${caseId}`);
    }
    setIsOpen(false);
    setSearch("");
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    navigate("/cases");
  };

  const filteredCases = cases.filter(c => 
    c.caseNumber.toLowerCase().includes(search.toLowerCase()) || 
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const statusConfig = (status: string) => STATUS_CONFIG[status.toLowerCase()] || STATUS_CONFIG.active;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 rounded-xl border transition-colors shadow-sm ${
            compact ? "px-2.5 py-1.5 h-auto min-w-0" : "h-10 px-3 min-w-[220px]"
        } ${
            variant === "dark" 
              ? "bg-[#112240] hover:bg-[#1a2f4c] border-[#1f2937] text-white" 
              : "bg-white hover:bg-slate-50 border-[var(--border)] text-[var(--text-primary)]"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Briefcase className={`w-3.5 h-3.5 shrink-0 ${variant === "dark" ? "text-blue-400" : "text-[var(--primary)]"}`} />
          {selectedCase ? (
            <div className="text-left min-w-0">
              <div className={`font-semibold truncate max-w-[200px] ${compact ? "text-[10px]" : "text-[11px]"} ${variant === "dark" ? "text-white" : "text-[var(--primary)]"}`}>
                {selectedCase.caseNumber}
              </div>
              {!compact && (
                <div className={`text-[9px] truncate max-w-[200px] ${variant === "dark" ? "text-slate-400" : "text-[var(--text-secondary)]"}`}>
                  {selectedCase.title}
                </div>
              )}
            </div>
          ) : (
            <span className={`text-xs ${variant === "dark" ? "text-slate-400" : "text-[var(--text-secondary)]"}`}>Select a Case...</span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 ${variant === "dark" ? "text-slate-400" : "text-[var(--text-muted)]"}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-80 max-h-96 bg-white border border-[var(--border)] rounded-xl shadow-xl z-50 flex flex-col animate-in fade-in slide-in-from-top-2">
          <div className="p-2 border-b border-[var(--border)] shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cases..."
                className="w-full bg-slate-50 border border-[var(--border)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--primary)]"
                autoFocus
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-1 scrollbar-thin scrollbar-thumb-[var(--border)]">
            {filteredCases.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">No cases found</div>
            ) : (
              filteredCases.map(c => {
                const sc = statusConfig(c.status);
                const isSelected = c.caseId === selectedCaseId;
                return (
                  <button
                    key={c.caseId}
                    onClick={() => handleSelect(c.caseId)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50/50 transition-colors ${
                      isSelected ? "bg-blue-50 border-l-2 border-l-[var(--primary)]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-[var(--primary)]">{c.caseNumber}</span>
                      <span className={`flex items-center gap-1 text-[10px] font-mono ${sc.color}`}>
                        {sc.icon}
                        {sc.label}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] mt-0.5 truncate">{c.title}</div>
                  </button>
                );
              })
            )}
          </div>

          {showCreateOption && canCreate && (
            <div className="border-t border-[var(--border)] p-2 shrink-0">
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Case</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


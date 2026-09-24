import React from 'react';
import { useDemoStore } from '../../store/demoStore';
import { useNavigationStore } from '../../store/navigationStore';
import { 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  X, 
  CheckCircle2, 
  ArrowRight,
  Route
} from 'lucide-react';

export const DemoWalkthroughBar: React.FC = () => {
  const { isDemoActive, currentStepIndex, steps, toggleDemoMode, nextStep, prevStep, jumpToStep } = useDemoStore();
  const { setView, selectEntity } = useNavigationStore();

  if (!isDemoActive) {
    return (
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => {
            toggleDemoMode(true);
            const step = steps[0];
            setView(step.targetView as any);
            if (step.entityId) selectEntity(step.entityId);
          }}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all hover:scale-105"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Launch Synthetic Demo Flow</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">13 Steps</span>
        </button>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];

  const handleNext = () => {
    const next = nextStep();
    setView(next.targetView as any);
    if (next.entityId) selectEntity(next.entityId);
  };

  const handlePrev = () => {
    const prev = prevStep();
    setView(prev.targetView as any);
    if (prev.entityId) selectEntity(prev.entityId);
  };

  const handleSelectStep = (idx: number) => {
    const step = jumpToStep(idx);
    setView(step.targetView as any);
    if (step.entityId) selectEntity(step.entityId);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-4xl">
      <div className="glass-panel bg-slate-950/90 rounded-2xl border-cyan-500/30 p-3.5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          
          {/* Badge & Step indicator */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400">
              <Route className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Demo Step {currentStep.stepNumber} of {steps.length}
                </span>
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                  [{currentStep.storyStage}]
                </span>
              </div>
              <h4 className="text-xs font-semibold text-slate-100 truncate mt-0.5">
                {currentStep.title}
              </h4>
            </div>
          </div>

          {/* Action Hint */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate max-w-xs">{currentStep.actionHint}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={currentStepIndex}
              onChange={(e) => handleSelectStep(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              {steps.map((s, idx) => (
                <option key={s.id} value={idx}>
                  {s.stepNumber}. {s.storyStage}
                </option>
              ))}
            </select>

            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex === steps.length - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:pointer-events-none text-slate-950 font-semibold text-xs transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => toggleDemoMode(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors ml-1"
              title="Close Demo Ribbon"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1 rounded-full mt-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

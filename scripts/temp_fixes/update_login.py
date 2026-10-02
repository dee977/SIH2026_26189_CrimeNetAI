import os

file_path = 'member1_frontend/src/components/public/LoginPage.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Replace the layout
# We will use regex to find the main <div className="min-h-screen... and replace its contents.
import re
pattern = re.compile(r'<div className="min-h-screen flex flex-col lg:flex-row[^>]*>.*', re.DOTALL)

replacement = """<div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-primary)] font-sans">
      
      {/* Left side branding banner - Match Figma Navy 950 panel */}
      <div className="w-full lg:w-5/12 bg-[var(--navy-950)] text-white p-10 flex flex-col relative overflow-hidden shrink-0 min-h-[400px]">
        {/* Network dots background pattern */}
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(31, 100, 216, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(11, 164, 199, 0.3) 0%, transparent 40%)' }}>
        </div>

        <div className="relative z-10 flex items-center gap-3 mb-16">
          <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center border border-white/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">CrimeNet <span className="text-[var(--cyan-500)] text-sm ml-0.5">AI</span></span>
        </div>

        <div className="relative z-10 max-w-md mt-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-xs font-semibold mb-6 border border-[var(--success)]/20 uppercase tracking-wide">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            SECURE INVESTIGATION ENVIRONMENT
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.15] mb-6">
            Connect evidence.<br/>
            Reveal relationships.<br/>
            Advance the case.
          </h1>
          
          <p className="text-slate-400 text-sm leading-relaxed mb-12 max-w-sm">
            CrimeNet AI brings case intelligence, entity relationships, evidence trails, and alert signals into one controlled operational workspace.
          </p>
        </div>

        {/* Bottom features */}
        <div className="relative z-10 mt-auto pt-10 grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <Shield className="w-5 h-5 text-[var(--cyan-500)]" />
            <span className="text-[11px] text-slate-300 font-medium">CJIS aligned</span>
          </div>
          <div className="flex flex-col gap-2">
            <Lock className="w-5 h-5 text-[var(--cyan-500)]" />
            <span className="text-[11px] text-slate-300 font-medium">End-to-end encrypted</span>
          </div>
          <div className="flex flex-col gap-2">
            <FileCheck className="w-5 h-5 text-[var(--cyan-500)]" />
            <span className="text-[11px] text-slate-300 font-medium">Complete audit trail</span>
          </div>
        </div>
      </div>

      {/* Right side login form */}
      <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-6 sm:p-10 bg-[var(--bg-primary)] overflow-y-auto relative">
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
          
          <div className="bg-white shadow-md shadow-slate-200/50 border border-slate-200 rounded-2xl p-8 sm:p-10 space-y-6">
            
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Welcome back</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Sign in with your authorized agency account.
              </p>
            </div>

            {/* Role Selector Cards - hidden in final Figma but needed for demo functionality. Styled cleaner. */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map(r => {
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectRole(r.id)}
                      className={`p-2 rounded border text-left transition-all relative ${
                        isSelected
                          ? `border-[var(--primary)] bg-[var(--primary)]/5`
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`font-medium text-xs ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>{r.title}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded bg-[var(--danger)]/10 border border-[var(--danger)]/30 flex items-center gap-2.5 text-xs text-[var(--danger)]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Agency email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-9 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all"
                    placeholder="alex.morgan@justice.gov"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-9 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all tracking-widest"
                    placeholder="••••••••••••"
                  />
                  <Eye className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-1 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]" defaultChecked />
                  <span className="text-[var(--text-primary)] font-medium text-sm">Remember this device</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => setView('forgot-password')}
                  className="text-[var(--primary)] hover:underline font-semibold text-sm"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded bg-[var(--primary)] hover:bg-blue-700 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Sign in securely</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="w-full py-2.5 rounded bg-white border border-slate-200 hover:bg-slate-50 text-[var(--text-primary)] font-medium text-sm transition-all flex items-center justify-center gap-2 mt-3"
              >
                <Lock className="w-4 h-4" />
                <span>Continue with agency SSO</span>
              </button>
            </form>
            
            <div className="pt-6 text-center">
              <p className="text-[11px] text-slate-400">
                Authorized personnel only. Access and activity are monitored and recorded.
              </p>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-6 w-full text-center flex items-center justify-center gap-4 text-[10px] text-slate-400 font-medium">
          <span>Security policy</span>
          <span>•</span>
          <span>Contact administrator</span>
          <span>v2.4.1</span>
        </div>
      </div>
    </div>
  );
};
"""

new_content = pattern.sub(replacement, content)

with open(file_path, 'w') as f:
    f.write(new_content)

print("Updated LoginPage.tsx")

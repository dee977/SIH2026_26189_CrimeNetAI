import re

with open('src/components/public/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the entire block containing the two buttons with just the Officer Sign In button
old_block = r"""          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <button
              onClick={() => {
                toggleDemoMode(true);
                navigate('/dashboard');
              }}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Launch Continuous Demo Story</span>
            </button>
  
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--primary)] hover:bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-105"
            >
              Officer Sign In (RBAC)
            </button>
          </div>"""

# Ensure we use the proper new background style for Officer Sign In as the user requested in the previous prompt
new_block = r"""          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all hover:scale-105"
            >
              Officer Sign In (RBAC)
            </button>
          </div>"""

# Remove the old block using regex or exact replace if whitespace matches.
# Using regex to be safe
pattern = re.compile(
    r'<div className="flex flex-wrap items-center justify-center gap-4 mt-10">\s*<button.*?<span>Launch Continuous Demo Story</span>\s*</button>\s*<button.*?Officer Sign In \(RBAC\)\s*</button>\s*</div>',
    re.MULTILINE | re.DOTALL
)

content = pattern.sub(new_block, content)

with open('src/components/public/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed demo button for real")

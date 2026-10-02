import re

with open('src/components/public/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_officer_btn = '''<button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--primary)] hover:bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-105"
            >
              Officer Sign In (RBAC)
            </button>'''
new_officer_btn = '''<button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all hover:scale-105"
            >
              Officer Sign In (RBAC)
            </button>'''
content = content.replace(old_officer_btn, new_officer_btn)

with open('src/components/public/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Officer Sign In button style")

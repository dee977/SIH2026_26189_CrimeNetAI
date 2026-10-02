import re

with open('src/components/public/LandingPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(
    r'<button\s*onClick=\{\(\) => \{\s*useAuthStore\.getState\(\)\.bypassLogin\(\);\s*navigate\(\'/dashboard\'\);\s*\}\}\s*className="flex items-center gap-2 px-6 py-3\.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all hover:scale-105"\s*>\s*<Play className="w-4 h-4 fill-slate-950" />\s*<span>Launch Continuous Demo Story</span>\s*</button>',
    re.MULTILINE
)

content = pattern.sub('', content)

with open('src/components/public/LandingPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed demo button")

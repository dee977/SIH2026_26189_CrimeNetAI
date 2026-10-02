filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

target = """              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/40">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">CrimeNet AI</span>"""

replacement = """              <img src="/logo.png" alt="CrimeNet AI" className="h-10 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />"""

code = code.replace(target, replacement)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("LoginPage logo updated.")

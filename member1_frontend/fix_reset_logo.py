filepath = "src/components/public/ResetPasswordPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

target = """            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-sm">
              <Shield className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <span className="font-bold text-xl text-[var(--text-primary)] tracking-tight">CrimeNet AI</span>"""

replacement = """            <img src="/logo.png" alt="CrimeNet AI" className="h-10 object-contain" />"""

code = code.replace(target, replacement)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("ResetPasswordPage logo updated.")

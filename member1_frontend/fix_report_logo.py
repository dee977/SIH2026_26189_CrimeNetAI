filepath = "src/components/reports/ReportView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

target = """            <div>
              <h1 className="text-2xl font-black text-[#0a192f] tracking-tight uppercase">CrimeNet Investigative Intelligence</h1>
              <p className="text-sm font-mono text-slate-600 mt-1">National Security Grid • BSA/BNSS Statutory Engine</p>
              <p className="text-xs font-mono text-slate-500 mt-1">Requestor: {user?.name || user?.email}</p>
            </div>"""

replacement = """            <div>
              <img src="/logo.png" alt="CrimeNet AI" className="h-8 object-contain mb-2" />
              <h1 className="text-2xl font-black text-[#0a192f] tracking-tight uppercase">Investigative Intelligence</h1>
              <p className="text-sm font-mono text-slate-600 mt-1">National Security Grid • BSA/BNSS Statutory Engine</p>
              <p className="text-xs font-mono text-slate-500 mt-1">Requestor: {user?.name || user?.email}</p>
            </div>"""

code = code.replace(target, replacement)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("ReportView logo updated.")

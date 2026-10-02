filepath = "src/components/alerts/AlertsView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("bg-[#112240] border border-[#1f2937]", "bg-white border border-slate-200")
code = code.replace("bg-[#0a192f]", "bg-slate-50")
code = code.replace("border-[#1f2937]", "border-slate-200")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Alerts view fixed.")

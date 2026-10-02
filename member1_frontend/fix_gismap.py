filepath = "src/components/gis/GISMapView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

# Make GIS Map White Theme
code = code.replace('bg-[#0a111a] text-white', 'bg-slate-50 text-slate-900')
code = code.replace('bg-[#0f172a] border-r border-slate-700/50', 'bg-white border-r border-slate-200')
code = code.replace('border-b border-slate-700/50', 'border-b border-slate-200')
code = code.replace('text-cyan-400', 'text-blue-600')
code = code.replace('text-white', 'text-slate-900')
code = code.replace('text-slate-400', 'text-slate-500')
code = code.replace('bg-[#1e293b]', 'bg-white')
code = code.replace('border-slate-700/50', 'border-slate-300')
code = code.replace('focus:border-cyan-500', 'focus:border-blue-500')
code = code.replace('hover:bg-slate-700', 'hover:bg-slate-100')
code = code.replace('hover:border-slate-600', 'hover:border-slate-400')
code = code.replace('bg-[#0f172a]/80', 'bg-white/80')
code = code.replace('bg-[#0f172a]/95', 'bg-white/95')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("GIS Map fixed.")


with open("src/components/reports/ReportView.tsx", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace("tracking-widest\"order-b", "tracking-widest border-b")
with open("src/components/reports/ReportView.tsx", "w", encoding="utf-8") as f:
    f.write(c)


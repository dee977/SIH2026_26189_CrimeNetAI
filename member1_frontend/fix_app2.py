filepath = "src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

route_stmt = '          <Route path="/admin" element={<RouteGuard viewId="admin"><AdminDashboardView /></RouteGuard>} />\n'
target = '<Route path="/reports" element={<RouteGuard viewId="reports"><ReportView /></RouteGuard>} />'
if target in code and "/admin" not in code.split("Routes")[1]:
    code = code.replace(target, target + "\n" + route_stmt)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("App fixed 2.")

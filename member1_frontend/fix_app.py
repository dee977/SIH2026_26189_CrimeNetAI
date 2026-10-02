import re

filepath = "src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import_stmt = "import { AdminDashboardView } from './components/admin/AdminDashboardView';\n"
if "AdminDashboardView" not in code:
    code = code.replace("import { ReportView } from './components/reports/ReportView';", "import { ReportView } from './components/reports/ReportView';\n" + import_stmt)

route_stmt = '          <Route path="/admin" element={<RouteGuard viewId="admin"><AdminDashboardView /></RouteGuard>} />\n'
if "/admin" not in code:
    code = code.replace('          <Route path="/reports" element={<RouteGuard viewId="reports"><ReportView /></RouteGuard>} />', '          <Route path="/reports" element={<RouteGuard viewId="reports"><ReportView /></RouteGuard>} />\n' + route_stmt)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("App fixed.")

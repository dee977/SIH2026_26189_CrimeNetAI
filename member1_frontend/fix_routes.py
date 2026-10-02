filepath = "src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

imports_target = "import { ImportCenterView } from './components/ingestion/ImportCenterView';"
imports_new = "import { ImportCenterView } from './components/ingestion/ImportCenterView';\nimport { TimelineView } from './components/timeline/TimelineView';\nimport { CrossVerificationView } from './components/verification/CrossVerificationView';"
if "TimelineView" not in code:
    code = code.replace(imports_target, imports_new)

routes_target = "<Route path=\"/alerts\" element={<RouteGuard viewId=\"alerts\"><AlertsView /></RouteGuard>} />"
routes_new = "<Route path=\"/alerts\" element={<RouteGuard viewId=\"alerts\"><AlertsView /></RouteGuard>} />\n          <Route path=\"/timeline\" element={<RouteGuard viewId=\"timeline\"><TimelineView /></RouteGuard>} />\n          <Route path=\"/verification\" element={<RouteGuard viewId=\"verification\"><CrossVerificationView /></RouteGuard>} />"
if "path=\"/timeline\"" not in code:
    code = code.replace(routes_target, routes_new)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Routes fixed.")

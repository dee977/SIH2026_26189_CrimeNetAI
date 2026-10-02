filepath = "src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

route_stmt = '          <Route path="/admin" element={<RouteGuard viewId="admin"><AdminDashboardView /></RouteGuard>} />\n'
code = code.replace('<Route path="*" element={<NotFoundView />} />', route_stmt + '            <Route path="*" element={<NotFoundView />} />')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("App fixed 3.")

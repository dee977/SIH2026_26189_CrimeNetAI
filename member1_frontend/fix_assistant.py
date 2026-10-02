filepath = "src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
if "AIAssistantView" not in code:
    code = code.replace("import { AdminDashboardView } from './components/admin/AdminDashboardView';", "import { AdminDashboardView } from './components/admin/AdminDashboardView';\nimport { AIAssistantView } from './components/assistant/AIAssistantView';")
    code = code.replace('<Route path="/settings" element={<SettingsPlaceholder />} />', '<Route path="/assistant" element={<RouteGuard viewId="assistant"><AIAssistantView /></RouteGuard>} />\n            <Route path="/settings" element={<SettingsPlaceholder />} />')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("AI Assistant route added.")

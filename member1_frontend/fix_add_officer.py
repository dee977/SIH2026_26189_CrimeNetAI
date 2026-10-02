filepath = "src/components/admin/AdminDashboardView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace('onClick={() => triggerAction("New Officer Registration Dialog opened. Verification token issued.")}', 'onClick={() => navigate("/register")}')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Add Officer fixed.")

filepath = "src/components/admin/AdminDashboardView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("email: string;", "email: string;\n  phone?: string;")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("OfficerUser type fixed.")

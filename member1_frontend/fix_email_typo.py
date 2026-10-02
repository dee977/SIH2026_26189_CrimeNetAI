filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("yakshvachhani1@gmil.com", "yakshvachhani1108@gmail.com")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Fixed email typo")

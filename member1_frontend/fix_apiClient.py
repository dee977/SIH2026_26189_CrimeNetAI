filepath = "src/services/apiClient.ts"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

start_str = "// If 401, attempt silent session refresh before reporting failure"
end_str = "console.warn('Silent session refresh attempt failed:', refreshCatch);\n      }\n    }"

start_idx = code.find(start_str)
end_idx = code.find(end_str) + len(end_str)

if start_idx != -1 and end_idx != -1:
    new_code = code[:start_idx] + "// Automatic refresh disabled to prevent loops" + code[end_idx:]
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_code)
    print("Replaced successfully")
else:
    print("Could not find block")

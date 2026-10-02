filepath = "app/services/m4_ai_nlp.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

# Replace the broken newline inside the string literal
broken = 'answer_text = "\n".join(ans_lines)'
fixed = 'answer_text = "\\n".join(ans_lines)'

if broken in code:
    code = code.replace(broken, fixed)
else:
    # Try with raw \r\n
    broken2 = 'answer_text = "\r\n".join(ans_lines)'
    if broken2 in code:
        code = code.replace(broken2, fixed)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Syntax error fixed.")

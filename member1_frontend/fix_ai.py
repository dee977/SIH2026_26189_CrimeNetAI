filepath = "src/components/assistant/AIAssistantView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

target = """    try {
      const response = await askGroundedAssistant(q, selectedCaseId || undefined);
      const assistantMsg: ChatMessage = {"""
      
replacement = """    try {
      const response = await askGroundedAssistant(q, selectedCaseId || undefined);
      if (!response.success || !response.data) {
          throw new Error(response.error || "Failed to get AI response");
      }
      const assistantMsg: ChatMessage = {"""

code = code.replace(target, replacement)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("AIAssistantView fixed.")

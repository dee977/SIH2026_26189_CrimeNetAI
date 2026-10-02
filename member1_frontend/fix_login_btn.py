filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

old_btn = """              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >"""

new_btn = """              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >"""

if old_btn in code:
    code = code.replace(old_btn, new_btn)
else:
    print("Could not find old_btn")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Button type changed to button and onClick added")

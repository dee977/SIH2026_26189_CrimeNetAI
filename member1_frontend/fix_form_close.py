filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
# We need to find the </div> right before <div className="pt-2 text-center ...
# and replace it with </form>
code = re.sub(
    r'</div>(\s*<div className="pt-2 text-center text-xs text-\[var\(--text-secondary\)\] border-t)',
    r'</form>\1',
    code
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Fixed unclosed form tag")

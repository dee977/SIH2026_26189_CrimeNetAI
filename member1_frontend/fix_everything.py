filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Restore <form>
if '<div className="space-y-4">' in code:
    # Find the <div className="space-y-4"> and change it to <form onSubmit={handleSubmit} className="space-y-4">
    code = code.replace('<div className="space-y-4">', '<form onSubmit={handleSubmit} className="space-y-4">')
    # And change the matching </div> to </form>. We know it's right before <div className="pt-2 text-center
    code = code.replace('</div>\n              \n              <div className="pt-2 text-center text-xs', '</form>\n              \n              <div className="pt-2 text-center text-xs')

# Restore button type="submit" and remove onClick={handleSubmit} since the form handles it
old_btn = """              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}"""

new_btn = """              <button
                type="submit"
                disabled={isLoading}"""

code = code.replace(old_btn, new_btn)

# Wait! There's one more thing!
# What if `e.preventDefault()` is crashing because `e` is undefined in some weird browser extension?
# `if (e && e.preventDefault) e.preventDefault();`
code = code.replace('e.preventDefault();', 'if (e && e.preventDefault) e.preventDefault();')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Restored form and submit button")

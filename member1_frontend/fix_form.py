filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# 1. Change <form onSubmit={handleSubmit}> to <div>
code = code.replace('<form onSubmit={handleSubmit} className="space-y-4">', '<div className="space-y-4">')
code = code.replace('</form>', '</div>')

# 2. Add an alert if error occurs so the user DEFINITELY sees it, in case the red box is hidden!
old_submit = """    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: finalPassword,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }"""

new_submit = """    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: finalPassword,
      });

      if (error) {
        setErrorMessage(error.message);
        alert("Login Error: " + error.message); // Force them to see it!
        return;
      }"""

if old_submit in code:
    code = code.replace(old_submit, new_submit)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Form converted to div and alert added")

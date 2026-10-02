import re

with open('src/components/public/LoginPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Left Side Text Readability
# Replace text-[var(--text-primary)] with text-white only in the left side container
# The left side container starts at: {/* Left side abstract visual treatment */}
# and ends right before: {/* Right side form */}
left_start = content.find('{/* Left side abstract visual treatment */}')
right_start = content.find('{/* Right side form */}')
if left_start != -1 and right_start != -1:
    left_part = content[left_start:right_start]
    left_part = left_part.replace('text-[var(--text-primary)]', 'text-white')
    left_part = left_part.replace('text-[var(--sidebar-text-muted)]', 'text-slate-400')
    content = content[:left_start] + left_part + content[right_start:]

# 2. Right Side Selected Role Box
# Replace bg-blue-950/40 border border-blue-500/30 text-xs font-mono
old_role_box = 'bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs font-mono'
new_role_box = 'bg-blue-50 border border-blue-100 flex items-center justify-between text-xs font-mono shadow-sm'
content = content.replace(old_role_box, new_role_box)
# The selected role text itself uses text-white, let's change it to text-blue-700
content = content.replace(
    '<span className="font-bold text-[var(--text-primary)] flex items-center gap-2">',
    '<span className="font-bold text-blue-700 flex items-center gap-2">'
)
# And the span that says "Selected role:" should be something readable
content = content.replace(
    '<span className="text-[var(--text-secondary)] font-medium">Selected role:</span>',
    '<span className="text-slate-600 font-medium">Selected role:</span>'
)

# 3. Form Default Values & Text
content = content.replace("useState('investigator123@gov.in')", "useState('')")
content = content.replace("useState('Password123!')", "useState('')")

# Update inputs to use placeholders
# Email input
old_email_input = '''<input
                        type="email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                      />'''
new_email_input = '''<input
                        type="email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={ROLE_OPTIONS.find(r => r.id === selectedRole)?.demoEmail}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                      />'''
content = content.replace(old_email_input, new_email_input)

# Password input
old_pass_input = '''<input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                      />'''
new_pass_input = '''<input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password123!"
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                      />'''
content = content.replace(old_pass_input, new_pass_input)

# Remove the Default password line
# It looks like: <div className="flex items-center justify-between mt-2">
#                   <span className="text-[10px] text-[var(--text-secondary)] font-mono">Default password: <span className="text-cyan-500">Password123!</span></span>
#                   <button type="button" className="text-xs text-[var(--primary)] hover:underline font-semibold">Forgot Password?</button>
#                </div>
# The user wants to "delete this line. defalult passward delete this line." 
# I'll just remove the whole span containing the default password text.
old_default_pass = '<span className="text-[10px] text-[var(--text-secondary)] font-mono">Default password: <span className="text-cyan-500">Password123!</span></span>'
content = content.replace(old_default_pass, '<span></span>')

with open('src/components/public/LoginPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated LoginPage")

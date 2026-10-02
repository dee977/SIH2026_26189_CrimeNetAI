filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# 1. Remove 'required' from inputs
code = code.replace('<input\n                      type="email"\n                      required', '<input\n                      type="email"')
code = code.replace('<input\n                      type="password"\n                      required', '<input\n                      type="password"')

# 2. Update handleSubmit to fallback to placeholders
old_handle = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password: password,
      });"""

new_handle = """  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    const finalEmail = identifier.trim() || (
      selectedRole === 'ADMIN' ? 'admin123@gov.in' :
      selectedRole === 'INVESTIGATOR' ? 'investigator123@gov.in' :
      selectedRole === 'ANALYST' ? 'analyst123@gov.in' :
      'auditor123@gov.in'
    );
    const finalPassword = password || '123456';

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: finalPassword,
      });"""

code = code.replace(old_handle, new_handle)

# wait, what if they meant Password123!?
# Ah, I see above `Password123!` was the default password. Let's use `Password123!` because that's what was hardcoded previously. But wait, in the prompt they said "i regester with yakshvachhani1108@gmail.com and 123456 passward". But for the demo accounts, the password in `authStore.ts` or somewhere might be `Password123!` or `123456`.
# Actually, the user specifically mentioned `123456` several times for their own accounts. But the demo accounts `admin123@gov.in` probably use `123456` or `Password123!`. Let's provide `123456` as the fallback since they mentioned it? Wait, let's look at `App.tsx` or previous code.
# In `fix_login_handleSelect.py` from earlier, I removed `setPassword('Password123!')`. So the demo accounts use `Password123!`. I will use `Password123!`.

code = code.replace("const finalPassword = password || '123456';", "const finalPassword = password || 'Password123!';")


with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Updated handleSubmit and removed required")

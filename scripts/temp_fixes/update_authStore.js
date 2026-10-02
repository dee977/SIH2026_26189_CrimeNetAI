const fs = require('fs');
const path = 'member1_frontend/src/store/authStore.ts';
let content = fs.readFileSync(path, 'utf8');

// Remove password default
content = content.replace(/login: async \(emailOrPhone, password = 'password'\) => {/, "login: async (emailOrPhone, password) => {");

// Remove mock JWT creation
content = content.replace(/const mockToken = `mock-jwt-role:\$\{role\.replace\(\/ \/g, '_'\)\}`;/g, "const mockToken = null; throw new Error('Role switching requires re-authentication');");
content = content.replace(/localStorage\.setItem\('crimenet_auth_token', mockToken\);/g, "// removed");

// Remove default user fallback if Supabase fails?
// We need to look at how login handles response.
//   if (response.success && response.data) {
// ...
// user: { ...DEFAULT_INVESTIGATOR, ... }
content = content.replace(/user: \{\s*\.\.\.DEFAULT_INVESTIGATOR,\s*\/\/ Fallback fields/, "user: {");

// Make sure login does not succeed with mock data.
// In authStore.ts, if we just remove DEFAULT_INVESTIGATOR it'll break since it requires those fields.
// Let's just make sure it parses the response properly.

fs.writeFileSync(path, content, 'utf8');
console.log('authStore.ts updated');

const fs = require('fs');
const path = 'member1_frontend/src/components/public/LoginPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove initial values
content = content.replace(/const \[identifier, setIdentifier\] = useState\([^)]+\);/g, "const [identifier, setIdentifier] = useState('');");
content = content.replace(/const \[password, setPassword\] = useState\([^)]+\);/g, "const [password, setPassword] = useState('');");

// Remove quick demo login chunk
content = content.replace(/\{\/\* Quick Demo Switcher \*\/\}[\s\S]*?\{\/\* Link to Register \*\/\}/g, "{/* Link to Register */}");

// Remove setIdentifier on toggle
content = content.replace(/setIdentifier\(['"][^'"]+['"]\);/g, "setIdentifier('');");

// Add autocomplete
content = content.replace(/onChange=\{\(e\) => setIdentifier\(e.target.value\)\}/g, "onChange={(e) => setIdentifier(e.target.value)} autoComplete='username'");
content = content.replace(/onChange=\{\(e\) => setPassword\(e.target.value\)\}/g, "onChange={(e) => setPassword(e.target.value)} autoComplete='current-password'");

fs.writeFileSync(path, content, 'utf8');
console.log('LoginPage.tsx updated');

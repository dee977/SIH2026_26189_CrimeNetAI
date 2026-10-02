filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("import React from 'react';\nimport { useNavigate } from 'react-router-dom';\n//, { useState } from 'react';", "import React, { useState } from 'react';\nimport { useNavigate } from 'react-router-dom';")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Fixed imports")

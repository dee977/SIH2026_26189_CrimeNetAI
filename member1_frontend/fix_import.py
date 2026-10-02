filepath = "src/components/admin/AdminDashboardView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

if "import { useNavigate }" not in code:
    code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Import fixed.")

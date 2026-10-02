filepath = "src/components/layout/TopNav.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Make sure useEffect is imported
if 'useEffect' not in code:
    code = code.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';")

# Add fetchCases to useCaseStore destructuring
code = code.replace("const { cases } = useCaseStore();", "const { cases, fetchCases } = useCaseStore();")

# Add useEffect hook
hook = """
  useEffect(() => {
    if (user && cases.length === 0) {
      fetchCases();
    }
  }, [user, cases.length, fetchCases]);
"""
code = code.replace("const [searchInput, setSearchInput] = useState('');", hook + "\n  const [searchInput, setSearchInput] = useState('');")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

import os
import re

CSS = """@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --sidebar-bg: #0B162B;
    --sidebar-hover: #142833;
    --sidebar-active: #1F64D8;
    --sidebar-text: #FFFFFF;
    --sidebar-text-muted: #94A3B8;

    --bg-primary: #F3F6FA;
    --bg-card: #FFFFFF;
    
    --primary: #1F64D8;
    --secondary: #7657D6;
    --accent: #0BA4C7;
    
    --success: #16A35B;
    --warning: #D66A00;
    --danger: #D63D4A;
    --critical: #D63D4A;
    
    --text-primary: #142833;
    --text-secondary: #64748B;
    --border: #E2E8F0;
  }
  
  body {
    @apply bg-background text-text-primary font-sans antialiased;
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }
}

/* Custom Scrollbars */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

.glass-panel, .glass-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  border-radius: 8px;
}
.glass-card-hover:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
}
.cytoscape-container { background: var(--bg-primary); }

@layer components {
  .btn-primary {
    @apply bg-primary text-white font-medium px-4 py-2 rounded transition-colors hover:opacity-90;
    background-color: var(--primary);
  }
  .btn-secondary {
    @apply bg-white border border-slate-200 text-text-primary font-medium px-4 py-2 rounded transition-colors hover:bg-slate-50;
  }
}
"""

with open('member1_frontend/src/index.css', 'w') as f:
    f.write(CSS)

print("Updated index.css")

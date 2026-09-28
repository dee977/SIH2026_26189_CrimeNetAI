import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacements mapping dark classes to our new light variables
    replacements = {
        # Backgrounds
        r'bg-\[\#080d1a\]/?\d*': 'bg-[var(--bg-primary)]',
        r'bg-\[\#0a101f\]/?\d*': 'bg-[var(--bg-card)]',
        r'bg-slate-950/?\d*': 'bg-[var(--bg-card)]',
        r'bg-slate-900/?\d*': 'bg-[var(--bg-card)]',
        r'bg-slate-800/?\d*': 'bg-slate-50',
        r'bg-gray-900/?\d*': 'bg-[var(--bg-card)]',
        r'bg-gray-800/?\d*': 'bg-slate-50',
        r'bg-gray-950/?\d*': 'bg-[var(--bg-card)]',
        
        # Text
        r'text-slate-100': 'text-[var(--text-primary)]',
        r'text-slate-200': 'text-[var(--text-primary)]',
        r'text-slate-300': 'text-[var(--text-secondary)]',
        r'text-slate-400': 'text-[var(--text-secondary)]',
        r'text-slate-500': 'text-slate-500',
        r'text-gray-100': 'text-[var(--text-primary)]',
        r'text-gray-200': 'text-[var(--text-primary)]',
        r'text-gray-300': 'text-[var(--text-secondary)]',
        r'text-gray-400': 'text-[var(--text-secondary)]',
        r'text-gray-500': 'text-slate-500',

        # Borders
        r'border-slate-800/?\d*': 'border-[var(--border)]',
        r'border-slate-700/?\d*': 'border-[var(--border)]',
        r'border-slate-600/?\d*': 'border-slate-300',
        r'border-gray-800/?\d*': 'border-[var(--border)]',
        r'border-gray-700/?\d*': 'border-[var(--border)]',
        
        # Accents
        r'bg-cyan-500/?20': 'bg-[var(--surface-cyan)]',
        r'bg-cyan-500/?10': 'bg-[var(--surface-cyan)]',
        r'bg-cyan-500/?\d*': 'bg-[var(--primary)] text-white',
        r'bg-blue-500/?\d*': 'bg-[var(--primary)] text-white',
        r'text-cyan-400': 'text-[var(--primary)]',
        r'text-cyan-500': 'text-[var(--primary)]',
        r'border-cyan-500/?\d*': 'border-[var(--primary)]',
        
        # Custom panels (simplifying to just normal card styles as requested)
        r'glass-panel': 'bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl',
        r'glass-card': 'bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-xl',
        
        # Hover states
        r'hover:bg-slate-800': 'hover:bg-slate-100',
        r'hover:bg-slate-700': 'hover:bg-slate-200',
        r'hover:bg-slate-900': 'hover:bg-slate-50',
    }
    
    # We do NOT want to process Sidebar.tsx heavily because it stays dark navy.
    if 'Sidebar.tsx' in filepath:
        return
    if 'TopNav.tsx' in filepath:
        return
    
    new_content = content
    for pattern, repl in replacements.items():
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('member1_frontend/src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            process_file(os.path.join(root, f))

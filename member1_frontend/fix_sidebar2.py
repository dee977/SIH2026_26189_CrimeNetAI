import re

with open('src/components/layout/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'isSidebarCollapsed ? "w-0 overflow-hidden" : "w-64"} transition-all duration-300 ease-in-out bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-hover)] flex flex-col shrink-0 min-h-screen select-none whitespace-nowrap',
    'isSidebarCollapsed ? "w-0 overflow-hidden opacity-0 border-r-0" : "w-64 border-r opacity-100"} transition-all duration-300 ease-in-out bg-[var(--sidebar-bg)] border-[var(--sidebar-hover)] flex flex-col shrink-0 min-h-screen select-none whitespace-nowrap'
)

with open('src/components/layout/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Sidebar border")

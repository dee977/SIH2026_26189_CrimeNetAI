import re

with open('src/components/layout/TopNav.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add PanelLeft to imports
content = re.sub(
    r'import \{ ([^}]+) \} from \'lucide-react\';',
    r'import { \1, PanelLeft } from \'lucide-react\';',
    content
)

# Add toggleSidebar to store
content = content.replace(
    'const { setGlobalSearchQuery } = useNavigationStore();',
    'const { setGlobalSearchQuery, toggleSidebar, isSidebarCollapsed } = useNavigationStore();'
)

# Add Button before form
old_left = '''        {/* Left: Global Search Quick Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-3xl">
        <form onSubmit={handleSearchSubmit} className="relative w-full">'''
new_left = '''        {/* Left: Global Search Quick Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-3xl">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          title="Toggle Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
        <form onSubmit={handleSearchSubmit} className="relative w-full">'''
content = content.replace(old_left, new_left)

with open('src/components/layout/TopNav.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated TopNav.tsx")

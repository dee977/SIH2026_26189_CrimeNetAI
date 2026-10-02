import re

with open('src/components/layout/TopNav.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "Clock\n} from 'lucide-react';",
    "Clock,\n  PanelLeft\n} from 'lucide-react';"
)

content = content.replace(
    "setGlobalSearchQuery\n  } = useNavigationStore();",
    "setGlobalSearchQuery,\n    toggleSidebar\n  } = useNavigationStore();"
)

old_form = '''<div className="flex items-center gap-4 flex-1 max-w-3xl">
        <form onSubmit={handleSearchSubmit} className="relative w-full">'''
new_form = '''<div className="flex items-center gap-4 flex-1 max-w-3xl">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          title="Toggle Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
        <form onSubmit={handleSearchSubmit} className="relative w-full">'''
content = content.replace(old_form, new_form)

with open('src/components/layout/TopNav.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated TopNav")

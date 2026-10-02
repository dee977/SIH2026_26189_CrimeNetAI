
with open("src/components/layout/Sidebar.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# I wrote `\${...` which translates to literally `\${` in the output!
# I need to use properly formatted template literal: `` `<aside className={\`${isSidebarCollapsed... whitespace-nowrap\`}>` ``
# Wait, the current text is: `<aside className={\`\${isSidebarCollapsed ? "w-0 ... whitespace-nowrap}>`

c = c.replace(
    "<aside className={`\\${isSidebarCollapsed ? \"w-0 overflow-hidden opacity-0 border-r-0\" : \"w-64 border-r opacity-100\"} transition-all duration-300 ease-in-out bg-[var(--sidebar-bg)] border-[var(--sidebar-hover)] flex flex-col shrink-0 min-h-screen select-none whitespace-nowrap}>",
    "<aside className={`\\${isSidebarCollapsed ? \"w-0 overflow-hidden opacity-0 border-r-0\" : \"w-64 border-r opacity-100\"} transition-all duration-300 ease-in-out bg-[var(--sidebar-bg)] border-[var(--sidebar-hover)] flex flex-col shrink-0 min-h-screen select-none whitespace-nowrap`}>"
)

# And fix `\${` to `${`
c = c.replace("className={`\\${isSidebarCollapsed", "className={`\\${isSidebarCollapsed".replace("\\\\", ""))
# Actually, the string in the file literally has a backslash before the dollar sign if I wrote \${.
c = c.replace(r"`\${", r"`${")

with open("src/components/layout/Sidebar.tsx", "w", encoding="utf-8") as f:
    f.write(c)


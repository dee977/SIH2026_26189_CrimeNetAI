
const fs = require("fs");
const path = require("path");

const componentsDir = path.join(__dirname, "member1_frontend", "src", "components");

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  let newContent = content;

  const replacements = [
    { regex: /bg-slate-800/g, replacement: "bg-[var(--sidebar-bg)]" },
    { regex: /text-blue-500/g, replacement: "text-[var(--primary)]" },
    { regex: /text-blue-400/g, replacement: "text-[var(--primary)]" },
    { regex: /bg-blue-600/g, replacement: "bg-[var(--primary)]" },
    { regex: /hover:bg-blue-500/g, replacement: "hover:bg-[var(--primary)]" },
    { regex: /hover:text-blue-300/g, replacement: "hover:text-[var(--primary)]" },
    { regex: /bg-blue-900\/30/g, replacement: "bg-[var(--primary)]\/30" },
    { regex: /bg-blue-900\/40/g, replacement: "bg-[var(--primary)]\/40" },
    { regex: /bg-blue-900\/50/g, replacement: "bg-[var(--primary)]\/50" },
    { regex: /border-blue-800\/50/g, replacement: "border-[var(--primary)]\/50" },
    
    { regex: /text-emerald-400/g, replacement: "text-[var(--success)]" },
    { regex: /text-emerald-500/g, replacement: "text-[var(--success)]" },
    { regex: /bg-emerald-900\/30/g, replacement: "bg-[var(--success)]\/30" },
    { regex: /border-emerald-800\/50/g, replacement: "border-[var(--success)]\/50" },
    
    { regex: /text-rose-400/g, replacement: "text-[var(--danger)]" },
    { regex: /text-rose-500/g, replacement: "text-[var(--danger)]" },
    { regex: /bg-rose-900\/30/g, replacement: "bg-[var(--danger)]\/30" },
    { regex: /border-rose-800\/50/g, replacement: "border-[var(--danger)]\/50" },

    { regex: /text-amber-400/g, replacement: "text-[var(--warning)]" },
    { regex: /text-amber-500/g, replacement: "text-[var(--warning)]" },
    { regex: /bg-amber-900\/30/g, replacement: "bg-[var(--warning)]\/30" },
    { regex: /border-amber-800\/50/g, replacement: "border-[var(--warning)]\/50" },

    { regex: /text-cyan-500/g, replacement: "text-[var(--accent)]" },
    { regex: /text-indigo-500/g, replacement: "text-[var(--secondary)]" },
    
    { regex: /text-slate-400/g, replacement: "text-[var(--text-secondary)]" },
    { regex: /text-slate-500/g, replacement: "text-[var(--text-muted)]" },
    { regex: /text-slate-300/g, replacement: "text-[var(--text-secondary)]" },
    { regex: /text-slate-200/g, replacement: "text-[var(--text-primary)]" },
    
    { regex: /bg-slate-900\/50/g, replacement: "bg-[var(--bg-card)]" },
    { regex: /bg-slate-900\/30/g, replacement: "bg-[var(--bg-card)]" },
    { regex: /bg-slate-800\/50/g, replacement: "bg-[var(--bg-card)]" },
    { regex: /bg-slate-900/g, replacement: "bg-[var(--bg-primary)]" },
    { regex: /bg-slate-700/g, replacement: "bg-[var(--bg-card)]" },
    { regex: /border-slate-800/g, replacement: "border-[var(--border)]" },
    { regex: /border-slate-700/g, replacement: "border-[var(--border)]" },
    
    { regex: /text-white/g, replacement: "text-[var(--text-primary)]" },
  ];

  for (const r of replacements) {
    newContent = newContent.replace(r.regex, r.replacement);
  }
  
  if (filePath.endsWith("InvestigationWorkspace.tsx")) {
      newContent = newContent.replace(/<div className="bg-\[var\(--color-navy-950\)\] text-\[var\(--text-primary\)\]/g, `<div className="bg-[var(--color-navy-950)] text-white`);
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, "utf-8");
    console.log("Updated", filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith(".tsx") || fullPath.endsWith(".jsx")) {
      processFile(fullPath);
    }
  }
}

walk(componentsDir);



const fs = require("fs");
const path = require("path");

const componentsDir = path.join(__dirname, "member1_frontend", "src", "components");

const replacements = [
  // Case Dossier Header specific in InvestigationWorkspace
  { regex: /bg-\[\#0B1120\]/g, replacement: "bg-[var(--color-navy-950)] text-white" },
  { regex: /text-blue-500/g, replacement: "text-[var(--primary)]" },
  { regex: /bg-blue-600/g, replacement: "bg-[var(--primary)]" },
  { regex: /hover:bg-blue-500/g, replacement: "hover:bg-[var(--primary)]" }, // might need adjustments
  { regex: /border-slate-800/g, replacement: "border-[var(--border)]" },
  { regex: /border-slate-700/g, replacement: "border-[var(--border)]" },
  { regex: /bg-slate-900\/50/g, replacement: "bg-[var(--bg-card)]" },
  { regex: /bg-slate-900\/30/g, replacement: "bg-[var(--bg-card)]" },
  { regex: /bg-slate-800\/50/g, replacement: "bg-[var(--bg-card)]" },
  { regex: /text-slate-400/g, replacement: "text-[var(--text-secondary)]" },
  { regex: /text-slate-500/g, replacement: "text-[var(--text-muted)]" },
  { regex: /text-slate-300/g, replacement: "text-[var(--text-secondary)]" },
  { regex: /text-slate-200/g, replacement: "text-[var(--text-primary)]" },
  { regex: /bg-slate-800/g, replacement: "bg-[var(--bg-card)]" },
  { regex: /bg-slate-900/g, replacement: "bg-[var(--bg-primary)]" },
  { regex: /text-white/g, replacement: "text-[var(--text-primary)]" },
  // InvestigationWorkspace Dossier text-white override needs care.
  // Actually, let us just do a function that does replacements.
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  let newContent = content;

  // Specific for InvestigationWorkspace.tsx
  if (filePath.endsWith("InvestigationWorkspace.tsx")) {
      newContent = newContent.replace(/bg-\[\#0B1120\]/g, "bg-[var(--color-navy-950)] text-[var(--text-primary)]");
  } else {
      newContent = newContent.replace(/bg-\[\#0B1120\]/g, "bg-[var(--bg-card)]");
  }

  // General replacements
  newContent = newContent.replace(/text-blue-500/g, "text-[var(--primary)]");
  newContent = newContent.replace(/bg-blue-600/g, "bg-[var(--primary)]");
  newContent = newContent.replace(/hover:bg-blue-500/g, "hover:bg-[var(--primary)]");
  newContent = newContent.replace(/border-slate-800/g, "border-[var(--border)]");
  newContent = newContent.replace(/border-slate-700/g, "border-[var(--border)]");
  newContent = newContent.replace(/bg-slate-900\/50/g, "bg-[var(--bg-card)]");
  newContent = newContent.replace(/bg-slate-900\/30/g, "bg-[var(--bg-card)]");
  newContent = newContent.replace(/bg-slate-800\/50/g, "bg-[var(--bg-card)]");
  newContent = newContent.replace(/bg-slate-800/g, "bg-[var(--bg-card)]");
  newContent = newContent.replace(/bg-slate-900/g, "bg-[var(--bg-primary)]");
  newContent = newContent.replace(/text-slate-400/g, "text-[var(--text-secondary)]");
  newContent = newContent.replace(/text-slate-500/g, "text-[var(--text-muted)]");
  newContent = newContent.replace(/text-slate-300/g, "text-[var(--text-secondary)]");
  newContent = newContent.replace(/text-slate-200/g, "text-[var(--text-primary)]");
  // newContent = newContent.replace(/text-white/g, "text-[var(--text-primary)]"); // Careful with text-white!

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


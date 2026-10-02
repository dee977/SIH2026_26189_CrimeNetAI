
const fs = require("fs");

let content = fs.readFileSync("src/components/ingestion/ImportCenterView.tsx", "utf-8");

// Replace all `glass-card` with proper tailwind classes
content = content.replace(/glass-card/g, "bg-white rounded-xl border border-[var(--border)] shadow-sm");

const headerStart = content.indexOf("{/* Header */}");
const uploadStart = content.indexOf("{/* Upload Workspace */}");

if (headerStart !== -1 && uploadStart !== -1) {
  const headerHtml = content.substring(headerStart, uploadStart);
  
  const leftMatch = headerHtml.match(/(<div>\s*<div className="flex items-center gap-3 mb-2">[\s\S]*?<\/p>\s*<\/div>)/);
  const leftPart = leftMatch ? leftMatch[1] : "";
  
  const rightMatch = headerHtml.match(/(\{\/\* Case Context \*\/\}[\s\S]*?<\/div>)\s*<\/div>/);
  const rightPart = rightMatch ? rightMatch[1] : "";
  
  content = content.replace(headerHtml, "");
  
  // Inject left part above Drop Zone
  content = content.replace(
    /\{\/\* Drop Zone \*\/}\s*<div className="lg:col-span-8 flex flex-col">/,
    "<div className=\"lg:col-span-8 flex flex-col gap-6\">\n          " + leftPart + "\n          {/* Drop Zone */}"
  );
  
  // Inject right part above Staged File
  const styledRightPart = rightPart.replace("min-w-[280px] bg-slate-50 p-4 rounded-lg", "bg-white p-5 rounded-xl");
  content = content.replace(
    /\{\/\* Selected File Stage & Preview Panel \*\/}\s*<div className="lg:col-span-4 flex flex-col">/,
    "<div className=\"lg:col-span-4 flex flex-col gap-6\">\n          " + styledRightPart + "\n          {/* Selected File Stage & Preview Panel */}"
  );
}

fs.writeFileSync("src/components/ingestion/ImportCenterView.tsx", content);
console.log("Grid layout updated");


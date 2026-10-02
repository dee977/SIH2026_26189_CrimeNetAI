
const fs = require("fs");

let content = fs.readFileSync("src/components/evidence/EvidenceView.tsx", "utf-8");

const lines = content.split("\n");

const modalStart = 555;
const modalEnd = 676;

const modalLines = lines.slice(modalStart, modalEnd);
lines.splice(modalStart, modalEnd - modalStart);

const modalDef = [
  "  const uploadModalJSX = (",
  "    <>",
  ...modalLines.map(l => "      " + l),
  "    </>",
  "  );",
  ""
];

const injectDefIdx = lines.findIndex(l => l.includes("if (!targetCase) {"));
lines.splice(injectDefIdx, 0, ...modalDef);

const emptyStateIdx = lines.findIndex(l => l.includes("if (evidenceList.length === 0) {"));
let returnIdx = -1;
for (let i = emptyStateIdx; i < lines.length; i++) {
  if (lines[i].includes("return (")) {
    returnIdx = i;
    break;
  }
}

let endReturnIdx = -1;
for (let i = returnIdx; i < lines.length; i++) {
  if (lines[i].trim() === ");") {
    endReturnIdx = i;
    break;
  }
}

lines.splice(returnIdx + 1, 0, "        <>");
lines.splice(endReturnIdx + 1, 0, "          {uploadModalJSX}", "        </>");

let mainReturnIdx = -1;
for (let i = endReturnIdx + 2; i < lines.length; i++) {
  if (lines[i].includes("return (")) {
    mainReturnIdx = i;
    break;
  }
}

let mainEndIdx = -1;
for (let i = mainReturnIdx; i < lines.length; i++) {
  if (lines[i].includes("</div>") && lines[i+1] && lines[i+1].includes(");")) {
    mainEndIdx = i;
    break;
  }
}

if (mainEndIdx !== -1) {
  lines.splice(mainEndIdx + 1, 0, "      {uploadModalJSX}");
}

fs.writeFileSync("src/components/evidence/EvidenceView.tsx", lines.join("\n"));
console.log("Done");


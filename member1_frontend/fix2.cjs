
const fs = require("fs");
let content = fs.readFileSync("src/components/evidence/EvidenceView.tsx", "utf-8");
content = content.replace("                </div>\n      {uploadModalJSX}\n              );", "                </div>\n              );");
content = content.replace("    </div>\n  );\n};", "      {uploadModalJSX}\n    </div>\n  );\n};");
fs.writeFileSync("src/components/evidence/EvidenceView.tsx", content);
console.log("Fixed");


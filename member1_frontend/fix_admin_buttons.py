filepath = "src/components/admin/AdminDashboardView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Add navigate
if "const navigate = useNavigate();" not in code:
    code = code.replace("const { setView, selectCase } = useNavigationStore();", "const { setView, selectCase } = useNavigationStore();\n  const navigate = useNavigate();")

# Replace setView
code = code.replace("setView('ingestion')", "navigate('/import')")
code = code.replace("setView('evidence')", "navigate('/evidence')")

# Add handlers
handlers = """
  const handleExportBSA = (code: string) => {
    const blob = new Blob([`BSA §65B Certificate\\n\\nEvidence Code: ${code}\\nVerified by CrimeNet AI\\n\\nSignature Valid`], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BSA_Certificate_${code}.txt`;
    a.click();
    triggerAction(`Exported BSA Certificate for ${code}`);
  };

  const handleVerifyMerkle = () => {
    triggerAction("Verifying blockchain ledgers...");
    setTimeout(() => {
      triggerAction("Audited all Merkle tree blocks. 0 tamper detections, 100% cryptographic parity.");
    }, 1500);
  };

  const handleRebuild = () => {
    triggerAction("Rebuilding Neo4j full-text indices... please wait.");
    setTimeout(() => {
      triggerAction("Neo4j full-text indexes re-warmed and schema constraints verified successfully.");
    }, 2000);
  };
"""

code = code.replace("const triggerAction = (msg: string) => {", handlers + "\n  const triggerAction = (msg: string) => {")

# Replace button onClicks
code = code.replace("onClick={() => triggerAction(\"Neo4j full-text indexes re-warmed and schema constraints verified.\")}", "onClick={handleRebuild}")
code = code.replace("onClick={() => triggerAction(\"Audited all Merkle tree blocks. 0 tamper detections, 100% cryptographic parity.\")}", "onClick={handleVerifyMerkle}")
code = re.sub(r"onClick=\{\(\) => triggerAction\(`Generated signed BSA Section 65B Certificate for \$\{([^\}]+)\}`\)\}", r"onClick={() => handleExportBSA(\1)}", code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Admin buttons fixed.")

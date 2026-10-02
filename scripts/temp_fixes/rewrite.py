import re

file_path = r'C:\Users\yaksh\OneDrive\Desktop\sih_project\SIH2026_26189_CrimeNetAI\member1_frontend\src\components\cases\CaseManagementView.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useAuthStore import
content = content.replace("import { useNotificationStore } from '../../store/notificationStore';", "import { useNotificationStore } from '../../store/notificationStore';\nimport { useAuthStore } from '../../store/authStore';")

# Add user and addMember to hooks
content = content.replace("const { cases, isLoading, fetchCases, createCase } = useCaseStore();", "const { cases, isLoading, fetchCases, createCase, addMember } = useCaseStore();\n  const { user } = useAuthStore();")

# Replace states
old_states = '''  // New Case State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStation, setNewStation] = useState('');
  const [newPriority, setNewPriority] = useState('High');
  const [newJurisdiction, setNewJurisdiction] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newCaseType, setNewCaseType] = useState('Organized Crime Investigation');'''

new_states = '''  // New Case State
  const [newTitle, setNewTitle] = useState('');
  const [newCaseNumber, setNewCaseNumber] = useState('');
  const [newCaseType, setNewCaseType] = useState('Financial Crime');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('High');
  const [newStatus, setNewStatus] = useState('Active');
  const [newJurisdiction, setNewJurisdiction] = useState('');
  const [newStation, setNewStation] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newLeadInvestigator, setNewLeadInvestigator] = useState('');
  const [newAdditionalInvestigators, setNewAdditionalInvestigators] = useState('');
  const [newAnalysts, setNewAnalysts] = useState('');'''

content = content.replace(old_states, new_states)

# Replace handleCreateSubmit
old_submit_start = "  const handleCreateSubmit = async (e: React.FormEvent) => {"
old_submit_end = "  const getStatusColor = (status: string) => {"

submit_regex = re.compile(re.escape(old_submit_start) + r'.*?' + r'(?=  const getStatusColor = \(status: string\) => {)', re.DOTALL)

new_submit = '''  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCaseType.trim() || !newPriority.trim() || !newJurisdiction.trim() || !newStatus.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields.' });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const createdCase = await createCase({
        title: newTitle.trim(),
        caseNumber: newCaseNumber.trim() || undefined,
        description: newDesc.trim(),
        policeStation: newStation.trim(),
        jurisdiction: newJurisdiction.trim(),
        assignedTeam: newTeam.trim(),
        priority: newPriority.toLowerCase(),
        caseType: newCaseType.trim(),
        status: newStatus.toLowerCase(),
      });

      if (createdCase) {
        // Add memberships
        if (user?.email) {
          await addMember(createdCase.caseId, user.email, 'OWNER');
        }
        if (newLeadInvestigator.trim()) {
          await addMember(createdCase.caseId, newLeadInvestigator.trim(), 'LEAD');
        }
        
        const additionalInvs = newAdditionalInvestigators.split(',').map(e => e.trim()).filter(Boolean);
        for (const email of additionalInvs) {
          await addMember(createdCase.caseId, email, 'INVESTIGATOR');
        }
        
        const analysts = newAnalysts.split(',').map(e => e.trim()).filter(Boolean);
        for (const email of analysts) {
          await addMember(createdCase.caseId, email, 'ANALYST');
        }

        setIsCreateModalOpen(false);
        // Reset state
        setNewTitle('');
        setNewCaseNumber('');
        setNewDesc('');
        setNewStation('');
        setNewJurisdiction('');
        setNewTeam('');
        setNewLeadInvestigator('');
        setNewAdditionalInvestigators('');
        setNewAnalysts('');
        setNewCaseType('Financial Crime');
        setNewPriority('High');
        setNewStatus('Active');
        
        addToast({
          type: 'success',
          title: 'Case Created',
          message: ${createdCase.caseNumber}: "" has been created.
        });

        openCase(createdCase.caseId);
        navigate('/cases/' + createdCase.caseId);
      } else {
        addToast({
          type: 'error',
          title: 'Creation Failed',
          message: 'Failed to create case.'
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'An error occurred while creating the case.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

'''

content = submit_regex.sub(new_submit, content)

# Replace form modal
old_form_start = "            <form onSubmit={handleCreateSubmit}"
old_form_end = "            </form>"

form_regex = re.compile(re.escape(old_form_start) + r'.*?' + re.escape(old_form_end), re.DOTALL)

new_form = '''            <form onSubmit={handleCreateSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Case Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operation Blue Tide"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Case Number
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={newCaseNumber}
                    onChange={(e) => setNewCaseNumber(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Description / Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe the objective or initial facts of this case..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1.5">
                    Case Type *
                  </label>
                  <select
                    required
                    value={newCaseType}
                    onChange={(e) => setNewCaseType(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
                  >
                    <option value="Financial Crime">Financial Crime</option>
                    <option value="Cyber Crime">Cyber Crime</option>
                    <option value="Organized Crime">Organized Crime</option>
                    <option value="Fraud">Fraud</option>
                    <option value="Narcotics">Narcotics</option>
                    <option value="Human Trafficking">Human Trafficking</option>
                    <option value="Theft">Theft</option>
                    <option value="Violent Crime">Violent Crime</option>
                    <option value="Extortion">Extortion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1.5">
                    Priority Level *
                  </label>
                  <select
                    required
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
                  >
                    <option value="Critical">Critical (High Threat / Multi-Agency)</option>
                    <option value="High">High (Active / Priority)</option>
                    <option value="Medium">Medium (Standard)</option>
                    <option value="Low">Low (Routine / Inquiry)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1.5">
                    Status *
                  </label>
                  <select
                    required
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1.5">
                    Jurisdiction *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. National Cyber Crime Zone"
                    value={newJurisdiction}
                    onChange={(e) => setNewJurisdiction(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Police Station
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cyber Cell HQ"
                    value={newStation}
                    onChange={(e) => setNewStation(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Assigned Team
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Special Task Force Alpha"
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Lead Investigator Email
                  </label>
                  <input
                    type="email"
                    placeholder="lead@police.gov"
                    value={newLeadInvestigator}
                    onChange={(e) => setNewLeadInvestigator(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Additional Investigators (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="inv1@police.gov, inv2@police.gov"
                  value={newAdditionalInvestigators}
                  onChange={(e) => setNewAdditionalInvestigators(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Analysts (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="ana1@police.gov, ana2@police.gov"
                  value={newAnalysts}
                  onChange={(e) => setNewAnalysts(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-slate-950 font-bold uppercase tracking-wider hover:bg-cyan-400 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Creating Case...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Case</span>
                    </>
                  )}
                </button>
              </div>
            </form>'''

content = form_regex.sub(new_form, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")

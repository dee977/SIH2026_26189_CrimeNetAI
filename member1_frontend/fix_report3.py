
with open("src/components/reports/ReportView.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "setTeamMembers(useCaseStore.getState().members[caseId] || []);",
    "if (membersRes.status === \"fulfilled\") setTeamMembers(membersRes.value || []);"
)
c = c.replace(
    "setNotes(useCaseStore.getState().notes[caseId] || []);",
    "if (notesRes.status === \"fulfilled\") setNotes(notesRes.value || []);"
)

with open("src/components/reports/ReportView.tsx", "w", encoding="utf-8") as f:
    f.write(c)


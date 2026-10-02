import re

with open('src/store/navigationStore.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'isEvidenceUploadModalOpen: boolean;',
    'isEvidenceUploadModalOpen: boolean;\n  isSidebarCollapsed: boolean;'
)

content = content.replace(
    'setEvidenceUploadModalOpen: (isOpen: boolean) => void;',
    'setEvidenceUploadModalOpen: (isOpen: boolean) => void;\n  toggleSidebar: () => void;'
)

content = content.replace(
    'isEvidenceUploadModalOpen: false,',
    'isEvidenceUploadModalOpen: false,\n  isSidebarCollapsed: false,'
)

content = content.replace(
    'setEvidenceUploadModalOpen: (isOpen) => set({ isEvidenceUploadModalOpen: isOpen })',
    'setEvidenceUploadModalOpen: (isOpen) => set({ isEvidenceUploadModalOpen: isOpen }),\n  toggleSidebar: () => set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed }))'
)

with open('src/store/navigationStore.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated navigationStore.ts")

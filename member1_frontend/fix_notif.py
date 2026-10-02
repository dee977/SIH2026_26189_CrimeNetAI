filepath = "src/store/notificationStore.ts"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("unreadAlertCount: 4,", "unreadAlertCount: 0,")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Fixed fake 4 alert count.")

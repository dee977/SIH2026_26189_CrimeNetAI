import re
import os

filepath = "member2_backend/app/main.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Remove the old root endpoint
content = re.sub(r"@app\.get\('/', tags=\['System Health'\], summary='Root Endpoint'\)\nasync def root\(\):.*?return \{.*?\n    \}", "", content, flags=re.MULTILINE | re.DOTALL)

imports_to_add = """
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
"""

if "from fastapi.staticfiles import StaticFiles" not in content:
    content = content.replace("from fastapi.responses import JSONResponse\n", "from fastapi.responses import JSONResponse\n" + imports_to_add)

static_code = """
# --- Serve React Frontend ---
# Assuming member1_frontend/dist is at the root level relative to member2_backend
FRONTEND_DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "member1_frontend", "dist")

if os.path.exists(FRONTEND_DIST_DIR):
    # Mount assets so they are served quickly and with correct MIME types
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_DIR, "assets")), name="assets")
    
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        # Prevent catching API routes if they slip through
        if full_path.startswith(settings.API_V1_STR.strip('/')):
            return {"error": "API route not found"}
            
        file_path = os.path.join(FRONTEND_DIST_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
            
        return {"error": "Frontend build not found"}
else:
    @app.get('/', tags=['System Health'], summary='Root Endpoint')
    async def root():
        return {
            'system': settings.PROJECT_NAME,
            'version': settings.VERSION,
            'status': 'OPERATIONAL (Frontend dist not found)',
            'api_v1': settings.API_V1_STR
        }
"""

if "Serve React Frontend" not in content:
    content = content.replace("if __name__ == '__main__':", static_code + "\nif __name__ == '__main__':")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched main.py")

import re

with open('app/exceptions.py', 'r') as f:
    content = f.read()

# Add a check for AuthenticationError in global handler or map it
new_global = """
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    from app.services.m6_security_evidence import AuthenticationError
    if isinstance(exc, AuthenticationError):
        return JSONResponse(
            status_code=401,
            content=ResponseEnvelope(
                success=False,
                error=f"Authentication Failed: {str(exc)}"
            ).dict()
        )
    return JSONResponse(
        status_code=500,
        content=ResponseEnvelope(
            success=False,
            error=f"Internal Server Error: {str(exc)}"
        ).dict()
    )"""

content = re.sub(r"async def global_exception_handler\(request: Request, exc: Exception\):[\s\S]*?return JSONResponse\([\s\S]*?\)", new_global, content)

with open('app/exceptions.py', 'w') as f:
    f.write(content)

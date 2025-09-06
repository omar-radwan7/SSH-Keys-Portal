import uvicorn
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.db import Base, engine, init_db
from .routers import auth, keys, download, admin
from .services.worker import start_all_workers, stop_all_workers

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
	CORSMiddleware,
	allow_origins=[settings.FRONTEND_URL, "http://localhost:3001", "http://127.0.0.1:3001"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

@app.get("/health")
def health():
	return {"success": True, "message": f"{settings.APP_NAME} is running"}

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(keys.router, prefix="/api/v1/me/keys", tags=["keys"])
app.include_router(download.router, prefix="/api/v1/keys", tags=["download"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

@app.on_event("startup")
async def startup_event():
	init_db()
	Base.metadata.create_all(bind=engine)
	
	# Start background workers in development mode
	if settings.ENV == "development":
		asyncio.create_task(start_all_workers())

@app.on_event("shutdown")
async def shutdown_event():
	stop_all_workers()

if __name__ == "__main__":
	uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True) 
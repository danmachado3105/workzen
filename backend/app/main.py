from fastapi import FastAPI

from app.clients.router import router as clients_router
from app.auth.router import router as auth_router
from app.services.router import router as services_router

app = FastAPI(title="WorkZen API")

app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(services_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
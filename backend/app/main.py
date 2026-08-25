from fastapi import FastAPI

from app.clients.router import router as clients_router
from app.auth.router import router as auth_router
from app.services.router import router as services_router
from app.appointments.router import router as appointments_router
from app.dashboard.router import router as dashboard_router

app = FastAPI(title="WorkZen API")

app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(services_router)
app.include_router(appointments_router)
app.include_router(dashboard_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
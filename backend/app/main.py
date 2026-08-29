from fastapi import FastAPI
from fastapi import Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.clients.router import router as clients_router
from app.auth.router import router as auth_router
from app.services.router import router as services_router
from app.appointments.router import router as appointments_router
from app.dashboard.router import router as dashboard_router
from app.config import settings
from app.database import get_db

app = FastAPI(title="WorkZen API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(services_router)
app.include_router(appointments_router)
app.include_router(dashboard_router)


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Banco de dados indisponível.",
        ) from exc
    return {"status": "ok"}

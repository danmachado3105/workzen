from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dashboard import service
from app.dashboard.schema import DashboardSummary
from app.appointments.schema import AppointmentRead
from app.auth.dependencies import get_current_user
from app.auth.model import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_summary(db, current_user.id)


@router.get("/upcoming-appointments", response_model=list[AppointmentRead])
def get_upcoming_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_upcoming_appointments(db, current_user.id)
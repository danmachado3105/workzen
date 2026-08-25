from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.clients.model import Client
from app.services.model import Service
from app.appointments.model import Appointment


def _start_of_today(now: datetime) -> datetime:
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _start_of_month(now: datetime) -> datetime:
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _start_of_next_month(start_of_month: datetime) -> datetime:
    if start_of_month.month == 12:
        return start_of_month.replace(year=start_of_month.year + 1, month=1)
    return start_of_month.replace(month=start_of_month.month + 1)


def get_summary(db: Session, user_id: int) -> dict:
    now = datetime.now(timezone.utc)
    today_start = _start_of_today(now)
    tomorrow_start = today_start + timedelta(days=1)
    month_start = _start_of_month(now)
    next_month_start = _start_of_next_month(month_start)

    active_clients = (
        db.query(func.count(Client.id))
        .filter(Client.user_id == user_id, Client.is_active == True)
        .scalar()
    )

    active_services = (
        db.query(func.count(Service.id))
        .filter(Service.user_id == user_id, Service.is_active == True)
        .scalar()
    )

    appointments_today = (
        db.query(func.count(Appointment.id))
        .filter(
            Appointment.user_id == user_id,
            Appointment.scheduled_at >= today_start,
            Appointment.scheduled_at < tomorrow_start,
        )
        .scalar()
    )

    appointments_upcoming = (
        db.query(func.count(Appointment.id))
        .filter(
            Appointment.user_id == user_id,
            Appointment.status == "scheduled",
            Appointment.scheduled_at >= now,
        )
        .scalar()
    )

    appointments_completed = (
        db.query(func.count(Appointment.id))
        .filter(Appointment.user_id == user_id, Appointment.status == "completed")
        .scalar()
    )

    appointments_canceled = (
        db.query(func.count(Appointment.id))
        .filter(Appointment.user_id == user_id, Appointment.status == "canceled")
        .scalar()
    )

    revenue_total = (
        db.query(func.coalesce(func.sum(Appointment.amount_charged), 0))
        .filter(Appointment.user_id == user_id, Appointment.payment_status == "paid")
        .scalar()
    )

    revenue_current_month = (
        db.query(func.coalesce(func.sum(Appointment.amount_charged), 0))
        .filter(
            Appointment.user_id == user_id,
            Appointment.payment_status == "paid",
            Appointment.scheduled_at >= month_start,
            Appointment.scheduled_at < next_month_start,
        )
        .scalar()
    )

    return {
        "active_clients": active_clients,
        "active_services": active_services,
        "appointments_today": appointments_today,
        "appointments_upcoming": appointments_upcoming,
        "appointments_completed": appointments_completed,
        "appointments_canceled": appointments_canceled,
        "revenue_total": Decimal(revenue_total),
        "revenue_current_month": Decimal(revenue_current_month),
        "appointments_by_status": {
            "scheduled": appointments_upcoming_by_status(db, user_id, "scheduled"),
            "completed": appointments_completed,
            "canceled": appointments_canceled,
        },
    }


def appointments_upcoming_by_status(db: Session, user_id: int, status_value: str) -> int:
    return (
        db.query(func.count(Appointment.id))
        .filter(Appointment.user_id == user_id, Appointment.status == status_value)
        .scalar()
    )


def get_upcoming_appointments(db: Session, user_id: int, limit: int = 5) -> list[Appointment]:
    now = datetime.now(timezone.utc)
    return (
        db.query(Appointment)
        .filter(
            Appointment.user_id == user_id,
            Appointment.status == "scheduled",
            Appointment.scheduled_at >= now,
        )
        .order_by(Appointment.scheduled_at.asc())
        .limit(limit)
        .all()
    )
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.appointments.model import Appointment
from app.appointments.schema import AppointmentCreate, AppointmentUpdate
from app.clients.service import get_client
from app.services.model import Service
from app.services.service import get_service


def _as_utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def _ensure_slot_is_available(
    db: Session,
    user_id: int,
    scheduled_at: datetime,
    duration_minutes: int,
    excluding_appointment_id: int | None = None,
) -> None:
    requested_start = _as_utc(scheduled_at)
    requested_end = requested_start + timedelta(minutes=duration_minutes)

    query = (
        db.query(Appointment, Service.duration_minutes)
        .join(Service, Service.id == Appointment.service_id)
        .filter(
            Appointment.user_id == user_id,
            Appointment.status.in_(("scheduled", "completed")),
        )
    )
    if excluding_appointment_id is not None:
        query = query.filter(Appointment.id != excluding_appointment_id)

    for existing_appointment, existing_duration in query.all():
        existing_start = _as_utc(existing_appointment.scheduled_at)
        existing_end = existing_start + timedelta(minutes=existing_duration)
        if requested_start < existing_end and existing_start < requested_end:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe um agendamento neste horário. Escolha outro período.",
            )


def create_appointment(db: Session, data: AppointmentCreate, user_id: int) -> Appointment:
    # get_client e get_service já garantem que o registro existe
    # E pertence ao usuário autenticado — se não pertencer, lançam 404 aqui mesmo.
    get_client(db, data.client_id, user_id)
    service_record = get_service(db, data.service_id, user_id)

    amount_charged = data.amount_charged
    if amount_charged is None:
        amount_charged = service_record.price

    _ensure_slot_is_available(
        db,
        user_id,
        data.scheduled_at,
        service_record.duration_minutes,
    )

    appointment = Appointment(
        user_id=user_id,
        client_id=data.client_id,
        service_id=data.service_id,
        scheduled_at=data.scheduled_at,
        amount_charged=amount_charged,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def list_appointments(db: Session, user_id: int) -> list[Appointment]:
    return db.query(Appointment).filter(Appointment.user_id == user_id).all()


def get_appointment(db: Session, appointment_id: int, user_id: int) -> Appointment:
    appointment = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id, Appointment.user_id == user_id)
        .first()
    )
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agendamento não encontrado",
        )
    return appointment


def update_appointment(
    db: Session, appointment_id: int, data: AppointmentUpdate, user_id: int
) -> Appointment:
    appointment = get_appointment(db, appointment_id, user_id)
    updates = data.model_dump(exclude_unset=True)
    if "scheduled_at" in updates:
        service_record = (
            db.query(Service)
            .filter(Service.id == appointment.service_id, Service.user_id == user_id)
            .first()
        )
        if not service_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Serviço do agendamento não encontrado",
            )
        _ensure_slot_is_available(
            db,
            user_id,
            updates["scheduled_at"],
            service_record.duration_minutes,
            excluding_appointment_id=appointment.id,
        )
    for field, value in updates.items():
        setattr(appointment, field, value)
    db.commit()
    db.refresh(appointment)
    return appointment


def cancel_appointment(db: Session, appointment_id: int, user_id: int) -> Appointment:
    appointment = get_appointment(db, appointment_id, user_id)
    appointment.status = "canceled"
    db.commit()
    db.refresh(appointment)
    return appointment


def complete_appointment(db: Session, appointment_id: int, user_id: int) -> Appointment:
    appointment = get_appointment(db, appointment_id, user_id)
    if appointment.status != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Apenas agendamentos agendados podem ser concluídos.",
        )
    appointment.status = "completed"
    db.commit()
    db.refresh(appointment)
    return appointment

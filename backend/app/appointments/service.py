from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.appointments.model import Appointment
from app.appointments.schema import AppointmentCreate, AppointmentUpdate
from app.clients.service import get_client
from app.services.service import get_service


def create_appointment(db: Session, data: AppointmentCreate, user_id: int) -> Appointment:
    # get_client e get_service já garantem que o registro existe
    # E pertence ao usuário autenticado — se não pertencer, lançam 404 aqui mesmo.
    get_client(db, data.client_id, user_id)
    service_record = get_service(db, data.service_id, user_id)

    amount_charged = data.amount_charged
    if amount_charged is None:
        amount_charged = service_record.price

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
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.services.model import Service
from app.services.schema import ServiceCreate, ServiceUpdate


def create_service(db: Session, data: ServiceCreate, user_id: int) -> Service:
    service = Service(**data.model_dump(), user_id=user_id)
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


def list_services(db: Session, user_id: int) -> list[Service]:
    return (
        db.query(Service)
        .filter(Service.is_active == True, Service.user_id == user_id)
        .all()
    )


def get_service(db: Session, service_id: int, user_id: int) -> Service:
    service = (
        db.query(Service)
        .filter(
            Service.id == service_id,
            Service.user_id == user_id,
            Service.is_active == True,
        )
        .first()
    )
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Serviço não encontrado",
        )
    return service


def update_service(db: Session, service_id: int, data: ServiceUpdate, user_id: int) -> Service:
    service = get_service(db, service_id, user_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


def delete_service(db: Session, service_id: int, user_id: int) -> None:
    service = get_service(db, service_id, user_id)
    service.is_active = False
    db.commit()
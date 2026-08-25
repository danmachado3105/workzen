from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import service as service_logic
from app.services.schema import ServiceCreate, ServiceUpdate, ServiceRead
from app.auth.dependencies import get_current_user
from app.auth.model import User

router = APIRouter(prefix="/services", tags=["services"])


@router.post("/", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service_logic.create_service(db, data, current_user.id)


@router.get("/", response_model=list[ServiceRead])
def list_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service_logic.list_services(db, current_user.id)


@router.get("/{service_id}", response_model=ServiceRead)
def get_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service_logic.get_service(db, service_id, current_user.id)


@router.put("/{service_id}", response_model=ServiceRead)
def update_service(
    service_id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service_logic.update_service(db, service_id, data, current_user.id)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service_logic.delete_service(db, service_id, current_user.id)
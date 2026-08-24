from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.clients import service
from app.clients.schema import ClientCreate, ClientUpdate, ClientRead
from app.auth.dependencies import get_current_user
from app.auth.model import User

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("/", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_client(db, data, current_user.id)


@router.get("/", response_model=list[ClientRead])
def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_clients(db, current_user.id)


@router.get("/{client_id}", response_model=ClientRead)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_client(db, client_id, current_user.id)


@router.put("/{client_id}", response_model=ClientRead)
def update_client(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_client(db, client_id, data, current_user.id)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_client(db, client_id, current_user.id)
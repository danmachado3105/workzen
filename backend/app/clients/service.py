from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.clients.model import Client
from app.clients.schema import ClientCreate, ClientUpdate


def create_client(db: Session, data: ClientCreate, user_id: int) -> Client:
    client = Client(**data.model_dump(), user_id=user_id)
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def list_clients(db: Session, user_id: int, include_inactive: bool = False) -> list[Client]:
    query = db.query(Client).filter(Client.user_id == user_id)
    if not include_inactive:
        query = query.filter(Client.is_active == True)
    return query.all()


def get_client(db: Session, client_id: int, user_id: int) -> Client:
    client = (
        db.query(Client)
        .filter(
            Client.id == client_id,
            Client.user_id == user_id,
            Client.is_active == True,
        )
        .first()
    )
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado",
        )
    return client


def update_client(db: Session, client_id: int, data: ClientUpdate, user_id: int) -> Client:
    client = get_client(db, client_id, user_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return client


def delete_client(db: Session, client_id: int, user_id: int) -> None:
    client = get_client(db, client_id, user_id)
    client.is_active = False
    db.commit()

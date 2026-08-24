from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.clients.model import Client
from app.clients.schema import ClientCreate, ClientUpdate


def create_client(db: Session, data: ClientCreate) -> Client:
    client = Client(**data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def list_clients(db: Session) -> list[Client]:
    return db.query(Client).filter(Client.is_active == True).all()


def get_client(db: Session, client_id: int) -> Client:
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.is_active == True)
        .first()
    )
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado",
        )
    return client


def update_client(db: Session, client_id: int, data: ClientUpdate) -> Client:
    client = get_client(db, client_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return client


def delete_client(db: Session, client_id: int) -> None:
    client = get_client(db, client_id)
    client.is_active = False
    db.commit()
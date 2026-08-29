from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("O nome deve ser um texto válido")
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("O nome não pode ser vazio")
        return normalized


class UserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class UserUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value: object) -> str:
        if not isinstance(value, str):
            raise ValueError("O nome deve ser um texto válido")
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("O nome não pode ser vazio")
        return normalized

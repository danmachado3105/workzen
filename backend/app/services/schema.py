from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ServiceBase(BaseModel):
    name: str = Field(min_length=1)
    price: Decimal = Field(gt=0)
    duration_minutes: int = Field(gt=0)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("O nome não pode ser vazio ou conter apenas espaços")
        return value


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, gt=0)
    duration_minutes: Optional[int] = Field(default=None, gt=0)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("O nome não pode ser vazio ou conter apenas espaços")
        return value


class ServiceRead(ServiceBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
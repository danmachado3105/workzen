from datetime import datetime
from decimal import Decimal
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict

AppointmentStatus = Literal["scheduled", "completed", "canceled"]
PaymentStatus = Literal["pending", "paid"]


class AppointmentCreate(BaseModel):
    client_id: int
    service_id: int
    scheduled_at: datetime
    amount_charged: Optional[Decimal] = None


class AppointmentUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
    payment_status: Optional[PaymentStatus] = None
    amount_charged: Optional[Decimal] = None


class AppointmentRead(BaseModel):
    id: int
    client_id: int
    service_id: int
    scheduled_at: datetime
    status: AppointmentStatus
    payment_status: PaymentStatus
    amount_charged: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
from decimal import Decimal
from pydantic import BaseModel


class AppointmentsByStatus(BaseModel):
    scheduled: int
    completed: int
    canceled: int


class DashboardSummary(BaseModel):
    active_clients: int
    active_services: int
    appointments_today: int
    appointments_upcoming: int
    appointments_completed: int
    appointments_canceled: int
    revenue_total: Decimal
    revenue_current_month: Decimal
    appointments_by_status: AppointmentsByStatus
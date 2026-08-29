// ===== Auth =====

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UpdateProfilePayload {
  name: string;
}

// ===== Client =====

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

// ===== Service =====

export interface Service {
  id: number;
  name: string;
  price: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

// ===== Appointment =====

export type AppointmentStatus = "scheduled" | "completed" | "canceled";
export type PaymentStatus = "pending" | "paid";

export interface Appointment {
  id: number;
  client_id: number;
  service_id: number;
  scheduled_at: string;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  amount_charged: string;
  created_at: string;
}

// ===== Dashboard =====

export interface AppointmentsByStatus {
  scheduled: number;
  completed: number;
  canceled: number;
}

export interface DashboardSummary {
  active_clients: number;
  active_services: number;
  appointments_today: number;
  appointments_upcoming: number;
  appointments_completed: number;
  appointments_canceled: number;
  revenue_total: string;
  revenue_current_month: string;
  appointments_by_status: AppointmentsByStatus;
}

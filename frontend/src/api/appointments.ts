import apiClient from "./client";
import type { Appointment, PaymentStatus } from "../types";

export interface AppointmentCreatePayload {
  client_id: number;
  service_id: number;
  scheduled_at: string;
  amount_charged?: string;
}

export interface AppointmentUpdatePayload {
  scheduled_at?: string;
  payment_status?: PaymentStatus;
  amount_charged?: string;
}

export async function listAppointments(): Promise<Appointment[]> {
  const response = await apiClient.get<Appointment[]>("/appointments/");
  return response.data;
}

export async function getAppointment(id: number): Promise<Appointment> {
  const response = await apiClient.get<Appointment>(`/appointments/${id}`);
  return response.data;
}

export async function createAppointment(
  payload: AppointmentCreatePayload
): Promise<Appointment> {
  const response = await apiClient.post<Appointment>("/appointments/", payload);
  return response.data;
}

export async function updateAppointment(
  id: number,
  payload: AppointmentUpdatePayload
): Promise<Appointment> {
  const response = await apiClient.put<Appointment>(`/appointments/${id}`, payload);
  return response.data;
}

export async function cancelAppointment(id: number): Promise<Appointment> {
  const response = await apiClient.post<Appointment>(`/appointments/${id}/cancel`);
  return response.data;
}

export async function completeAppointment(id: number): Promise<Appointment> {
  const response = await apiClient.post<Appointment>(`/appointments/${id}/complete`);
  return response.data;
}

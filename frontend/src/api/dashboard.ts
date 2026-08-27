import apiClient from "./client";
import type { DashboardSummary, Appointment } from "../types";

export async function getSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get<DashboardSummary>("/dashboard/summary");
  return response.data;
}

export async function getUpcomingAppointments(): Promise<Appointment[]> {
  const response = await apiClient.get<Appointment[]>("/dashboard/upcoming-appointments");
  return response.data;
}
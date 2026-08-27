import apiClient from "./client";
import type { Service } from "../types";

export interface ServicePayload {
  name: string;
  price: string;
  duration_minutes: number;
}

export async function listServices(): Promise<Service[]> {
  const response = await apiClient.get<Service[]>("/services/");
  return response.data;
}

export async function createService(payload: ServicePayload): Promise<Service> {
  const response = await apiClient.post<Service>("/services/", payload);
  return response.data;
}

export async function updateService(
  id: number,
  payload: Partial<ServicePayload>
): Promise<Service> {
  const response = await apiClient.put<Service>(`/services/${id}`, payload);
  return response.data;
}

export async function deleteService(id: number): Promise<void> {
  await apiClient.delete(`/services/${id}`);
}
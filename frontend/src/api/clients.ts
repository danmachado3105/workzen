import apiClient from "./client";
import type { Client } from "../types";

export interface ClientPayload {
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}

export async function listClients(): Promise<Client[]> {
  const response = await apiClient.get<Client[]>("/clients/");
  return response.data;
}

export async function createClient(payload: ClientPayload): Promise<Client> {
  const response = await apiClient.post<Client>("/clients/", payload);
  return response.data;
}

export async function updateClient(
  id: number,
  payload: Partial<ClientPayload>
): Promise<Client> {
  const response = await apiClient.put<Client>(`/clients/${id}`, payload);
  return response.data;
}

export async function deleteClient(id: number): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}
import apiClient from "./client";
import type { AuthResponse, LoginPayload, RegisterPayload, User } from "../types";

export async function register(payload: RegisterPayload): Promise<User> {
  const response = await apiClient.post<User>("/auth/register", payload);
  return response.data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const formData = new URLSearchParams();
  formData.append("username", payload.email);
  formData.append("password", payload.password);

  const response = await apiClient.post<AuthResponse>("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return response.data;
}
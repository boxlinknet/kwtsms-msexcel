// src/services/kwtsms-api.ts
// Direct client-side API client for kwtSMS gateway.
// All calls use JSON POST to https://www.kwtsms.com/API/
// Credentials passed in body, never logged.
// Related: src/models/types.ts, kwtsms-api-documentation skill

import {
  BalanceResponse,
  SenderIdResponse,
  CoverageResponse,
  SendResponse,
  ValidateResponse,
  ApiErrorResponse,
} from "../models/types";

const BASE_URL = "https://www.kwtsms.com/API";

async function apiCall<T>(endpoint: string, body: Record<string, any>): Promise<T> {
  const response = await fetch(BASE_URL + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.result === "ERROR") {
    const err = data as ApiErrorResponse;
    throw new Error(err.code + ": " + err.description);
  }

  if (!response.ok) {
    throw new Error("HTTP " + response.status + ": " + response.statusText);
  }

  return data as T;
}

export async function login(username: string, password: string): Promise<BalanceResponse> {
  return apiCall<BalanceResponse>("/balance/", { username, password });
}

export async function fetchSenderIds(username: string, password: string): Promise<string[]> {
  const data = await apiCall<SenderIdResponse>("/senderid/", { username, password });
  return data.senderid || [];
}

export async function fetchCoverage(username: string, password: string): Promise<string[]> {
  const data = await apiCall<CoverageResponse>("/coverage/", { username, password });
  return (data as any).prefixes || data.coverage || [];
}

export async function send(
  username: string,
  password: string,
  sender: string,
  mobile: string,
  message: string,
  test: number
): Promise<SendResponse> {
  return apiCall<SendResponse>("/send/", {
    username,
    password,
    sender,
    mobile,
    message,
    test,
  });
}

export async function validate(
  username: string,
  password: string,
  mobile: string
): Promise<ValidateResponse> {
  return apiCall<ValidateResponse>("/validate/", { username, password, mobile });
}

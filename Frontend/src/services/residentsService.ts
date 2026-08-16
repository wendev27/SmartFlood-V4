import { fetchJson } from "@/services/apiClient";

export async function getResidents() {
  return fetchJson<Record<string, unknown>[]>("/api/residents");
}

export async function getFamilies(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return fetchJson<Record<string, unknown>[]>(`/api/families${query}`);
}

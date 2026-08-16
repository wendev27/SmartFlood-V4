export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  plans?: unknown;
  error?: string;
};

const DEFAULT_TIMEOUT_MS = 10000;

export async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const payload = await fetchEnvelope<T>(url, init, timeoutMs);
  return (payload && "data" in payload ? payload.data : payload) as T;
}

export async function fetchEnvelope<T>(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<ApiEnvelope<T>> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null;

    if (!response.ok) {
      throw new Error(payload?.error ?? `Request failed with status ${response.status}`);
    }

    if (payload?.success === false) {
      throw new Error(payload.error ?? "Request failed");
    }

    return payload ?? { success: true, data: null as T };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out after 10 seconds.");
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

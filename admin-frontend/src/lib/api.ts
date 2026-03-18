const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("noble-cert-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken || null;
  } catch {
    return null;
  }
}

export async function adminFetch<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api/v1/admin${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok) {
    // Token hết hạn hoặc chưa đăng nhập → redirect về login
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("noble-cert-auth");
        document.cookie = "noble-cert-auth=; path=/; max-age=0";
        window.location.href = "/login";
      }
      throw new Error("Phiên đăng nhập hết hạn");
    }
    throw new Error(json?.message || `Request failed: ${res.status}`);
  }

  return json?.data ?? json;
}

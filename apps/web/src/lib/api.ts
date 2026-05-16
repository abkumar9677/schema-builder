const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export type ApiError = { code?: string; message?: string };
export type AuthResponse = { token: string };
export type SchemaColumn = {
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  default?: string;
  foreignKey?: { table: string; column: string };
};
export type SchemaVersion = {
  id: string;
  version: number;
  columnsJson: SchemaColumn[];
  indexesJson: Array<{ name: string; columns: string[]; unique?: boolean }>;
  createdAt: string;
};
export type ProjectTable = {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  schemas?: SchemaVersion[];
};
export type TableReference = {
  id: string;
  projectId: string;
  fromTableId: string;
  fromCol: string;
  toTableId: string;
  toCol: string;
  accepted: boolean;
};
export type Project = {
  id: string;
  name: string;
  description?: string | null;
  rdbmsType: string;
  updatedAt?: string;
  tables?: ProjectTable[];
  references?: TableReference[];
};

export function getAuthToken() {
  return localStorage.getItem("schema_builder_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("schema_builder_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("schema_builder_token");
}

export function getOAuthUrl(provider: "google" | "microsoft") {
  return `${API_URL}/api/auth/oauth/${provider}`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("schema_builder_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw error as ApiError;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiFetchText(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("schema_builder_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw error as ApiError;
  }
  return response.text();
}

export function registerUser(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function loginUser(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function saveGeminiKey(apiKey: string) {
  return apiFetch<void>("/api/keys/gemini", {
    method: "PUT",
    body: JSON.stringify({ apiKey })
  });
}

export function listProjects() {
  return apiFetch<Project[]>("/api/projects");
}

export function getProject(projectId: string) {
  return apiFetch<Project>(`/api/projects/${projectId}`);
}

export function generateProject(input: { name: string; description: string; rdbmsType: string }) {
  return apiFetch<Project>("/api/projects/generate", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function generateTableSchema(projectId: string, tableId: string) {
  return apiFetch<SchemaVersion>("/api/schemas/generate", {
    method: "POST",
    body: JSON.stringify({ projectId, tableId })
  });
}

export function exportTableSql(tableId: string) {
  return apiFetchText(`/api/schemas/${tableId}/export/sql`);
}

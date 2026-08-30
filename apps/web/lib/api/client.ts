import type { AssetRef, AlumnoData } from "@/lib/types";

export type ProjectSnapshot = { id: string; externalKey: string; name: string; description: string; revision: number; updatedAt: string; data: AlumnoData };
export type ProjectListItem = Pick<ProjectSnapshot, "id" | "externalKey" | "name" | "revision" | "updatedAt">;
export type ApiError = Error & { status?: number; currentRevision?: number };
export const apiBaseUrl = (process.env.NEXT_PUBLIC_TRAINING_API_URL ?? "http://localhost:4100").replace(/\/$/, "");

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, credentials: "include", headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(body?.error?.message ?? `API ${response.status}`) as ApiError; error.status = response.status; error.currentRevision = body?.currentRevision; throw error; }
  return body as T;
}

let csrfToken = "";
export async function ensureSession() {
  const current = await fetch(`${apiBaseUrl}/v1/session`, { credentials: "include" });
  if (current.ok) { csrfToken = (await current.json()).csrfToken ?? ""; return csrfToken; }
  const created = await request<{ csrfToken: string }>("/v1/session", { method: "POST" });
  csrfToken = created.csrfToken;
  return csrfToken;
}
const mutationHeaders = () => ({ "X-CSRF-Token": csrfToken });
export async function listProjects() { await ensureSession(); return request<{ projects: ProjectListItem[] }>("/v1/projects"); }
export async function getProject(id: string) { await ensureSession(); return request<ProjectSnapshot>(`/v1/projects/${encodeURIComponent(id)}`); }
export async function createProject(input: { externalKey: string; name: string; description: string; data: AlumnoData }) { await ensureSession(); return request<ProjectSnapshot>("/v1/projects", { method: "POST", headers: mutationHeaders(), body: JSON.stringify(input) }); }
export async function updateProject(id: string, input: { expectedRevision: number; project: { name: string; description: string }; data: AlumnoData }) { await ensureSession(); return request<ProjectSnapshot>(`/v1/projects/${encodeURIComponent(id)}`, { method: "PUT", headers: mutationHeaders(), body: JSON.stringify(input) }); }
export async function uploadAsset(projectId: string, field: string, asset: AssetRef) {
  const response = await fetch(asset.url, { credentials: "include" });
  if (!response.ok) throw new Error("No se pudo preparar la imagen.");
  const body = await response.blob();
  return request<AssetRef>(`/v1/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(field)}`, { method: "POST", headers: { ...mutationHeaders(), "Content-Type": asset.mimeType }, body });
}

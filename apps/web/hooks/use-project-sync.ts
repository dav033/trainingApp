"use client";

import { useEffect, useRef, useState } from "react";
import type { AlumnoData } from "@/lib/types";
import { apiBaseUrl, getProject, updateProject, uploadAsset, type ApiError } from "@/lib/api/client";

type SyncStatus = "local" | "loading" | "saved" | "pending" | "offline" | "conflict";
const photoFields = ["fotoFrontal", "fotoLateral", "fotoPosterior"] as const;
async function remoteData(projectId: string, data: AlumnoData) {
  const next = structuredClone(data);
  for (const field of photoFields) { const asset = next[field]; if (asset?.url.startsWith("data:")) next[field] = await uploadAsset(projectId, field, asset); }
  return next;
}

export function useProjectSync(projectId: string | undefined, data: AlumnoData, setData: (value: AlumnoData) => void) {
  const revision = useRef(0); const loaded = useRef(false); const pending = useRef(false); const skipNextSave = useRef(false); const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined); const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined); const socket = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<SyncStatus>(projectId ? "loading" : "local");
  useEffect(() => {
    if (!projectId) return;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      const nextSocket = new WebSocket(`${apiBaseUrl.replace(/^http/, "ws")}/v1/projects/${encodeURIComponent(projectId)}/events`); socket.current = nextSocket;
      nextSocket.onmessage = async (event) => { try { const message = JSON.parse(event.data) as { projectId: string; revision: number }; if (message.projectId !== projectId || message.revision <= revision.current) return; if (pending.current) { setStatus("conflict"); return; } const snapshot = await getProject(projectId); if (!stopped && snapshot.revision >= revision.current) { revision.current = snapshot.revision; skipNextSave.current = true; setData(snapshot.data); setStatus("saved"); } } catch { if (!stopped) setStatus("offline"); } };
      nextSocket.onclose = () => { if (stopped) return; const delay = Math.min(10000, 250 * 2 ** Math.min(5, Math.floor(Math.random() * 6))) + Math.floor(Math.random() * 250); reconnectTimer.current = setTimeout(async () => { try { const snapshot = await getProject(projectId); if (!stopped) { revision.current = snapshot.revision; skipNextSave.current = true; setData(snapshot.data); } } catch {} connect(); }, delay); };
    };
    void getProject(projectId).then((snapshot) => { if (stopped) return; revision.current = snapshot.revision; loaded.current = true; skipNextSave.current = true; setData(snapshot.data); setStatus("saved"); connect(); }).catch(() => { if (!stopped) setStatus("offline"); });
    return () => { stopped = true; if (saveTimer.current) clearTimeout(saveTimer.current); if (reconnectTimer.current) clearTimeout(reconnectTimer.current); socket.current?.close(); };
  }, [projectId, setData]);
  useEffect(() => {
    if (!projectId || !loaded.current) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    if (saveTimer.current) clearTimeout(saveTimer.current); pending.current = true;
    saveTimer.current = setTimeout(async () => { try { setStatus("pending"); const prepared = await remoteData(projectId, data); const snapshot = await updateProject(projectId, { expectedRevision: revision.current, project: { name: prepared.nombreCompleto, description: "" }, data: prepared }); revision.current = snapshot.revision; if (JSON.stringify(prepared) !== JSON.stringify(data)) { skipNextSave.current = true; setData(prepared); } pending.current = false; setStatus("saved"); } catch (error) { setStatus((error as ApiError).status === 409 ? "conflict" : "offline"); } }, 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [data, projectId, setData]);
  return { status };
}

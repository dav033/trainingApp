"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, deleteProject, listProjects, type ProjectListItem } from "@/lib/api/client";
import { createBlankAlumnoData } from "@/lib/blank-project";
import { PROJECTS_CHANGED_EVENT } from "@/lib/open-tabs";

function formatUpdatedAt(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "justo ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es");
}

export function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = () => { void listProjects().then((result) => setProjects(result.projects)).catch(() => setError("No se pudo conectar con Training API.")); };
  useEffect(refresh, []);

  const create = async () => {
    try {
      const created = await createProject({ externalKey: `project-${Date.now()}`, name: "Nuevo proyecto", description: "", data: createBlankAlumnoData() });
      window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
      router.push(`/projects/${created.id}`);
    } catch { setError("No se pudo crear el proyecto."); }
  };

  const remove = async (project: ProjectListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`¿Borrar "${project.name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(project.id);
    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
    } catch { setError("No se pudo borrar el proyecto."); }
    finally { setDeletingId(null); }
  };

  return (
    <main style={{ height: "100%", overflowY: "auto", background: "#1C1B20", color: "#E5E6E4", padding: 40, fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <p style={{ color: "#9AC8D4", textTransform: "uppercase", letterSpacing: ".12em", fontSize: 12 }}>Training Workspace</p>
        <h1 style={{ fontWeight: 400 }}>Proyectos de entrenamiento</h1>
        <button className="btn-primary" onClick={() => void create()}>+ Nuevo proyecto</button>
        {error && <p role="alert" style={{ color: "#DA667B" }}>{error}</p>}
        <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                textAlign: "left", background: "#28272E", color: "inherit", border: "1px solid #48464F",
                borderRadius: 16, padding: 18, cursor: "pointer",
              }}
            >
              <div>
                <strong>{project.name}</strong>
                <span style={{ display: "block", color: "#8C8FA0", marginTop: 6 }}>
                  {project.externalKey} · revisión {project.revision} · {formatUpdatedAt(project.updatedAt)}
                </span>
              </div>
              <button
                onClick={(e) => void remove(project, e)}
                disabled={deletingId === project.id}
                title="Borrar proyecto"
                style={{
                  flexShrink: 0, background: "transparent", border: "1px solid #48464F", color: "#DA667B",
                  borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontSize: 13,
                  opacity: deletingId === project.id ? 0.5 : 1,
                }}
              >
                {deletingId === project.id ? "Borrando…" : "Borrar"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

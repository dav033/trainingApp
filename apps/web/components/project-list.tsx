"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, listProjects, type ProjectListItem } from "@/lib/api/client";
import { createBlankAlumnoData } from "@/lib/blank-project";

export function ProjectList() {
  const router = useRouter(); const [projects, setProjects] = useState<ProjectListItem[]>([]); const [error, setError] = useState("");
  useEffect(() => { void listProjects().then((result) => setProjects(result.projects)).catch(() => setError("No se pudo conectar con Training API.")); }, []);
  const create = async () => {
    try { const created = await createProject({ externalKey: `project-${Date.now()}`, name: "Nuevo proyecto", description: "", data: createBlankAlumnoData() }); router.push(`/projects/${created.id}`); } catch { setError("No se pudo crear el proyecto."); }
  };
  return <main style={{ height: "100%", overflowY: "auto", background: "#1C1B20", color: "#E5E6E4", padding: 40, fontFamily: "system-ui" }}><div style={{ maxWidth: 760, margin: "0 auto" }}><p style={{ color: "#9AC8D4", textTransform: "uppercase", letterSpacing: ".12em", fontSize: 12 }}>Training Workspace</p><h1 style={{ fontWeight: 400 }}>Proyectos de entrenamiento</h1><button className="btn-primary" onClick={() => void create()}>+ Nuevo proyecto</button>{error && <p role="alert" style={{ color: "#DA667B" }}>{error}</p>}<div style={{ marginTop: 24, display: "grid", gap: 12 }}>{projects.map((project) => <button key={project.id} onClick={() => router.push(`/projects/${project.id}`)} style={{ textAlign: "left", background: "#28272E", color: "inherit", border: "1px solid #48464F", borderRadius: 16, padding: 18, cursor: "pointer" }}><strong>{project.name}</strong><span style={{ display: "block", color: "#8C8FA0", marginTop: 6 }}>{project.externalKey} · revisión {project.revision}</span></button>)}</div></div></main>;
}

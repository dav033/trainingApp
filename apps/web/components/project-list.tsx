"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, listProjects, type ProjectListItem } from "@/lib/api/client";

export function ProjectList() {
  const router = useRouter(); const [projects, setProjects] = useState<ProjectListItem[]>([]); const [error, setError] = useState("");
  useEffect(() => { void listProjects().then((result) => setProjects(result.projects)).catch(() => setError("No se pudo conectar con Training API.")); }, []);
  const create = async () => {
    const blank = (keys: string[]) => Object.fromEntries(keys.map((key) => [key, ""]));
    const dia = { proteina: "", carbohidratos: "", grasa: "", agua: "" };
    const data = { nombreCompleto: "Nuevo proyecto", edad: "", correo: "coach@example.com", fotoFrontal: null, fotoLateral: null, fotoPosterior: null, controles: [{ fecha: new Date().toISOString().slice(0, 10), control: 1, peso: "", musculo: "", grasa: "" }], metodologia: blank(["metodologia", "velocidadContraccion", "objetivo", "flexibilidad", "metodologiaIntensidad", "frecuenciaSemana", "duracionMicrociclo", "tiempoRecuperacion", "duracionPrograma", "trabajoCardiovascular", "tipoFuerza"]), alimentacion: blank(["modeloCarbohidratos", "modeloProteinas", "modeloGrasas", "modeloVitaminasMinerales", "modeloAgua", "modeloSodio"]), nutricionDias: { entrenosFuertes: dia, entrenosMedios: dia, soloCardio: dia, descanso: dia }, planEntrenamiento: { dias: [] }, planNutricional: { dias: [] }, suplementacion: { items: [] }, ayudasErgogenicas: { descripcion: "" } } as never;
    try { const created = await createProject({ externalKey: `project-${Date.now()}`, name: "Nuevo proyecto", description: "", data }); router.push(`/projects/${created.id}`); } catch { setError("No se pudo crear el proyecto."); }
  };
  return <main style={{ minHeight: "100vh", background: "#1C1B20", color: "#E5E6E4", padding: 40, fontFamily: "system-ui" }}><div style={{ maxWidth: 760, margin: "0 auto" }}><p style={{ color: "#9AC8D4", textTransform: "uppercase", letterSpacing: ".12em", fontSize: 12 }}>Training Workspace</p><h1 style={{ fontWeight: 400 }}>Proyectos de entrenamiento</h1><button className="btn-primary" onClick={() => void create()}>+ Nuevo proyecto</button>{error && <p role="alert" style={{ color: "#DA667B" }}>{error}</p>}<div style={{ marginTop: 24, display: "grid", gap: 12 }}>{projects.map((project) => <button key={project.id} onClick={() => router.push(`/projects/${project.id}`)} style={{ textAlign: "left", background: "#28272E", color: "inherit", border: "1px solid #48464F", borderRadius: 16, padding: 18, cursor: "pointer" }}><strong>{project.name}</strong><span style={{ display: "block", color: "#8C8FA0", marginTop: 6 }}>{project.externalKey} · revisión {project.revision}</span></button>)}</div></div></main>;
}

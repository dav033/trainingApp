import { AlumnoForm } from "@/components/alumno-form";
export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; return <main className="min-h-screen bg-background"><div className="flex h-screen overflow-hidden"><AlumnoForm projectId={projectId} /></div></main>; }

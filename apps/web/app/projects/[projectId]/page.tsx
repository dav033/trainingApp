import { AlumnoForm } from "@/components/alumno-form";
export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; return <main className="h-full bg-background"><div className="flex h-full overflow-hidden"><AlumnoForm projectId={projectId} /></div></main>; }

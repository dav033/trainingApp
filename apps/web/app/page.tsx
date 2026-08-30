import { AlumnoForm } from "@/components/alumno-form";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <AlumnoForm />
      </div>
      <Link href="/projects" style={{ position: "fixed", right: 18, top: 18, color: "#9AC8D4", fontSize: 13 }}>Workspace remoto →</Link>
    </main>
  );
}

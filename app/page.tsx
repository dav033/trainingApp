import { AlumnoForm } from "@/components/alumno-form";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <AlumnoForm />
      </div>
    </main>
  );
}

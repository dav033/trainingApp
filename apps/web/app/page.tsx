import { AlumnoForm } from "@/components/alumno-form";
import { ProjectTabsBar } from "@/components/project-tabs-bar";

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1C1B20" }}>
      <ProjectTabsBar />
      <main className="h-full bg-background" style={{ flex: 1, overflow: "hidden" }}>
        <div className="flex h-full overflow-hidden">
          <AlumnoForm />
        </div>
      </main>
    </div>
  );
}

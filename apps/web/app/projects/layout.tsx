import { ProjectTabsBar } from "@/components/project-tabs-bar";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1C1B20" }}>
      <ProjectTabsBar />
      <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

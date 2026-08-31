"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createProject, listProjects, type ProjectListItem } from "@/lib/api/client";
import { createBlankAlumnoData } from "@/lib/blank-project";
import { loadOpenTabs, saveOpenTabs, PROJECTS_CHANGED_EVENT, type OpenTab } from "@/lib/open-tabs";

export function ProjectTabsBar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = pathname?.match(/^\/projects\/([^/]+)$/)?.[1] ?? null;

  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectListItem[]>([]);
  const loadedOnce = useRef(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTabs(loadOpenTabs()); }, []);

  useEffect(() => {
    const refresh = () => { void listProjects().then((r) => { loadedOnce.current = true; setAllProjects(r.projects); }).catch(() => {}); };
    refresh();
    window.addEventListener(PROJECTS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(PROJECTS_CHANGED_EVENT, refresh);
  }, [pathname]);

  // Añade la pestaña activa si llegamos por link directo, refresca nombres, y quita pestañas de proyectos borrados.
  useEffect(() => {
    if (!loadedOnce.current) return;
    setTabs((prev) => {
      let next = prev.filter((t) => allProjects.some((p) => p.id === t.id));
      if (activeId && !next.some((t) => t.id === activeId)) {
        const found = allProjects.find((p) => p.id === activeId);
        if (found) next = [...next, { id: found.id, name: found.name, externalKey: found.externalKey }];
      }
      next = next.map((t) => {
        const fresh = allProjects.find((p) => p.id === t.id);
        return fresh && (fresh.name !== t.name || fresh.externalKey !== t.externalKey) ? { ...t, name: fresh.name, externalKey: fresh.externalKey } : t;
      });
      if (next.length !== prev.length || next.some((t, i) => t !== prev[i])) saveOpenTabs(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProjects, activeId]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onClick = (e: MouseEvent) => { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [pickerOpen]);

  const openTab = (project: OpenTab) => {
    setTabs((prev) => {
      if (prev.some((t) => t.id === project.id)) return prev;
      const next = [...prev, project];
      saveOpenTabs(next);
      return next;
    });
    setPickerOpen(false);
    router.push(`/projects/${project.id}`);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveOpenTabs(next);
      if (activeId === id) router.push(next.length > 0 ? `/projects/${next[next.length - 1].id}` : "/projects");
      return next;
    });
  };

  const createAndOpen = async () => {
    try {
      const created = await createProject({ externalKey: `project-${Date.now()}`, name: "Nuevo proyecto", description: "", data: createBlankAlumnoData() });
      window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
      openTab({ id: created.id, name: created.name, externalKey: created.externalKey });
    } catch { /* la creación falló; se puede reintentar desde el selector */ }
  };

  const unopenedProjects = allProjects.filter((p) => !tabs.some((t) => t.id === p.id));

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, padding: "8px 12px",
      background: "#16151A", borderBottom: "1px solid #2A2930", flexShrink: 0, overflowX: "auto",
    }}>
      <button onClick={() => router.push("/projects")} title="Todos los proyectos" style={tabStyle(pathname === "/projects")}>☰</button>

      {tabs.map((tab) => (
        <div key={tab.id} onClick={() => router.push(`/projects/${tab.id}`)} style={{ ...tabStyle(tab.id === activeId), cursor: "pointer" }}>
          <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tab.name || tab.externalKey}</span>
          <button onClick={(e) => closeTab(tab.id, e)} aria-label="Cerrar pestaña" style={closeBtnStyle}>×</button>
        </div>
      ))}

      <div style={{ position: "relative" }} ref={pickerRef}>
        <button onClick={() => setPickerOpen((v) => !v)} style={tabStyle(false)}>+ Proyecto</button>
        {pickerOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#211F26",
            border: "1px solid #35343B", borderRadius: 10, minWidth: 220, maxHeight: 320,
            overflowY: "auto", zIndex: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}>
            <button onClick={() => void createAndOpen()} style={pickerItemStyle}>+ Nuevo proyecto</button>
            {unopenedProjects.length > 0 && <div style={{ height: 1, background: "#35343B", margin: "4px 0" }} />}
            {unopenedProjects.map((p) => (
              <button key={p.id} onClick={() => openTab({ id: p.id, name: p.name, externalKey: p.externalKey })} style={pickerItemStyle}>
                {p.name} <span style={{ color: "#6C6977", fontSize: 11 }}>· {p.externalKey}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 6,
    padding: "6px 10px", borderRadius: 8, cursor: "pointer",
    background: active ? "rgba(218,102,123,0.16)" : "transparent",
    color: active ? "#F2B8C6" : "#9E9BA8",
    fontSize: 13, border: "1px solid transparent", flexShrink: 0,
    whiteSpace: "nowrap", fontFamily: "inherit",
  };
}

const closeBtnStyle: React.CSSProperties = {
  border: "none", background: "transparent", color: "inherit", cursor: "pointer",
  fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 2,
};

const pickerItemStyle: React.CSSProperties = {
  display: "block", width: "100%", textAlign: "left", padding: "8px 12px",
  background: "transparent", border: "none", color: "#C8C5D0", cursor: "pointer",
  fontSize: 13, fontFamily: "inherit",
};

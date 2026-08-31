import type { WebSocket } from "ws";

export type RevisionEvent = { type: "project.revision"; projectId: string; revision: number; source: "browser" | "mcp"; updatedAt: string };
export type DeletedEvent = { type: "project.deleted"; projectId: string; source: "browser" | "mcp" };
export type ProjectEvent = RevisionEvent | DeletedEvent;

export class ProjectEventHub {
  private readonly clients = new Map<string, Set<WebSocket>>();
  subscribe(projectId: string, socket: WebSocket) {
    const set = this.clients.get(projectId) ?? new Set<WebSocket>();
    set.add(socket);
    this.clients.set(projectId, set);
    socket.once("close", () => { set.delete(socket); if (!set.size) this.clients.delete(projectId); });
  }
  publish(event: ProjectEvent) {
    for (const socket of this.clients.get(event.projectId) ?? []) {
      if (socket.readyState === 1) socket.send(JSON.stringify(event));
    }
  }
  close() { for (const set of this.clients.values()) for (const socket of set) socket.close(1001, "Server shutting down"); this.clients.clear(); }
}

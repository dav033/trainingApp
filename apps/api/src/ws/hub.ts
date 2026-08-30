import type { WebSocket } from "ws";

export type RevisionEvent = { type: "project.revision"; projectId: string; revision: number; source: "browser" | "mcp"; updatedAt: string };

export class ProjectEventHub {
  private readonly clients = new Map<string, Set<WebSocket>>();
  subscribe(projectId: string, socket: WebSocket) {
    const set = this.clients.get(projectId) ?? new Set<WebSocket>();
    set.add(socket);
    this.clients.set(projectId, set);
    socket.once("close", () => { set.delete(socket); if (!set.size) this.clients.delete(projectId); });
  }
  publish(event: RevisionEvent) {
    for (const socket of this.clients.get(event.projectId) ?? []) {
      if (socket.readyState === 1) socket.send(JSON.stringify(event));
    }
  }
  close() { for (const set of this.clients.values()) for (const socket of set) socket.close(1001, "Server shutting down"); this.clients.clear(); }
}

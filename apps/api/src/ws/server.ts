import type { IncomingMessage, Server } from "node:http";
import { WebSocketServer } from "ws";
import { ProjectEventHub } from "./hub.js";
import { sessionFromRequest } from "../http/auth.js";
import type { ProjectRepository } from "../repositories/project-repository.js";
import type { AppConfig } from "../config.js";

export function attachWebSocket(server: Server, repository: ProjectRepository, hub: ProjectEventHub, config: AppConfig) {
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (req: IncomingMessage, socket) => {
    const origin = req.headers.origin;
    const match = new URL(req.url ?? "/", "http://localhost").pathname.match(/^\/v1\/projects\/([^/]+)\/events$/);
    if (!match || origin !== config.webOrigin || !sessionFromRequest(req, config)) { socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n"); socket.destroy(); return; }
    try { repository.getById(match[1]); } catch { socket.write("HTTP/1.1 404 Not Found\r\n\r\n"); socket.destroy(); return; }
    wss.handleUpgrade(req, socket, Buffer.alloc(0), (client) => {
      hub.subscribe(match[1], client);
      client.on("pong", () => { (client as typeof client & { alive?: boolean }).alive = true; });
    });
  });
  const interval = setInterval(() => {
    for (const client of wss.clients) {
      const state = client as typeof client & { alive?: boolean };
      if (state.alive === false) { client.terminate(); continue; }
      state.alive = false;
      client.ping();
    }
  }, 30_000);
  return { wss, close: () => { clearInterval(interval); wss.close(); } };
}

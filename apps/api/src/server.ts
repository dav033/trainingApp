import http from "node:http";
import { config } from "./config.js";
import { openDatabase } from "./db/database.js";
import { ProjectRepository } from "./repositories/project-repository.js";
import { AssetService } from "./services/asset-service.js";
import { ProjectEventHub } from "./ws/hub.js";
import { attachWebSocket } from "./ws/server.js";
import { createApp } from "./app.js";

const db = openDatabase(config.dbPath);
const repository = new ProjectRepository(db, config.publicBaseUrl);
const assets = new AssetService(db, config.assetDir, config.publicBaseUrl);
const hub = new ProjectEventHub();
const app = createApp({ db, repository, assets, hub, config });
const server = http.createServer(app);
const socket = attachWebSocket(server, repository, hub, config);

server.listen(config.port, config.host, () => console.log(`training-api listening on ${config.host}:${config.port}`));

function shutdown() {
  socket.close();
  hub.close();
  server.close(() => { db.close(); process.exit(0); });
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

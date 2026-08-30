import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { openDatabase } from "./db/database.js";

const backupRoot = path.resolve(process.env.TRAINING_BACKUP_DIR ?? path.join(path.dirname(config.dbPath), "backups"));
const target = path.join(backupRoot, new Date().toISOString().replace(/[:.]/g, "-"));
fs.mkdirSync(target, { recursive: true });
const db = openDatabase(config.dbPath);
await db.backup(path.join(target, "training.db"));
db.close();
if (fs.existsSync(config.assetDir)) fs.cpSync(config.assetDir, path.join(target, "assets"), { recursive: true });

const files: string[] = [];
function walk(dir: string) { for (const item of fs.readdirSync(dir, { withFileTypes: true })) { const filename = path.join(dir, item.name); if (item.isDirectory()) walk(filename); else files.push(filename); } }
walk(target);
const checksums = files.filter((file) => !file.endsWith("checksums.sha256")).map((file) => `${createHash("sha256").update(fs.readFileSync(file)).digest("hex")}  ${path.relative(target, file).replaceAll("\\", "/")}`).join("\n");
fs.writeFileSync(path.join(target, "checksums.sha256"), `${checksums}\n`);
fs.writeFileSync(path.join(target, "git-sha.txt"), `${process.env.TRAINING_RELEASE_SHA ?? "unknown"}\n`);
fs.writeFileSync(path.join(target, "schema-version.txt"), "1\n");
fs.writeFileSync(path.join(target, "manifest.json"), `${JSON.stringify({ createdAt: new Date().toISOString(), files: files.map((file) => path.relative(target, file).replaceAll("\\", "/")) }, null, 2)}\n`);
console.log(target);

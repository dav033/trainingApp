import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";
import { AssetRepository } from "../repositories/asset-repository.js";
import { NotFoundError } from "../errors.js";

const MAX_BYTES = 15 * 1024 * 1024;
const mimeExt: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

function detectMime(bytes: Buffer): string | null {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (bytes.subarray(4, 12).toString("ascii") === "ftypavif") return "image/avif";
  return null;
}

export class AssetService {
  private readonly repository: AssetRepository;
  constructor(private readonly db: Database.Database, private readonly root: string, private readonly publicBaseUrl: string) {
    this.repository = new AssetRepository(db);
    fs.mkdirSync(root, { recursive: true });
  }

  save(projectId: string, field: string, body: Buffer, declaredMime: string) {
    if (body.length === 0 || body.length > MAX_BYTES) throw new Error("La imagen debe pesar entre 1 byte y 15 MB.");
    const mimeType = detectMime(body);
    if (!mimeType || mimeType !== declaredMime) throw new Error("El contenido no corresponde a una imagen permitida.");
    const id = randomUUID();
    const relativePath = `${id}.${mimeExt[mimeType]}`;
    const fullPath = path.resolve(this.root, relativePath);
    if (!fullPath.startsWith(path.resolve(this.root) + path.sep)) throw new Error("Ruta de asset inválida.");
    fs.writeFileSync(fullPath, body, { flag: "wx" });
    try {
      const asset = this.repository.create({ id, project_id: projectId, field, relative_path: relativePath, mime_type: mimeType, byte_size: body.length, sha256: createHash("sha256").update(body).digest("hex"), created_at: new Date().toISOString() });
      return { id: asset.id, url: `${this.publicBaseUrl}/v1/assets/${asset.id}`, mimeType: asset.mime_type, byteSize: asset.byte_size };
    } catch (error) {
      fs.rmSync(fullPath, { force: true });
      throw error;
    }
  }

  file(id: string) {
    const asset = this.repository.get(id);
    const filename = path.resolve(this.root, asset.relative_path);
    if (!filename.startsWith(path.resolve(this.root) + path.sep) || !fs.existsSync(filename)) throw new NotFoundError("Archivo de asset no encontrado.");
    return { ...asset, filename };
  }
}

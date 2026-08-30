import type Database from "better-sqlite3";
import { NotFoundError } from "../errors.js";

export type AssetRow = { id: string; project_id: string; field: string; relative_path: string; mime_type: string; byte_size: number; sha256: string; created_at: string };

export class AssetRepository {
  constructor(private readonly db: Database.Database) {}
  create(asset: AssetRow) {
    this.db.prepare("INSERT INTO assets (id, project_id, field, relative_path, mime_type, byte_size, sha256, created_at) VALUES (@id, @project_id, @field, @relative_path, @mime_type, @byte_size, @sha256, @created_at)").run(asset);
    return asset;
  }
  get(id: string) {
    const asset = this.db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as AssetRow | undefined;
    if (!asset) throw new NotFoundError("Asset no encontrado.");
    return asset;
  }
}

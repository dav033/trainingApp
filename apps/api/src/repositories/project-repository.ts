import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { ProjectImportSchema, type ProjectImport, type ProjectSnapshot, TrainingProjectDataSchema } from "@training/contracts";
import { NotFoundError, RevisionConflictError } from "../errors.js";

type ProjectRow = {
  id: string; external_key: string; name: string; description: string; schema_version: number;
  data_json: string; revision: number; created_at: string; updated_at: string;
};

export class ProjectRepository {
  constructor(private readonly db: Database.Database, private readonly publicBaseUrl: string) {}

  private snapshot(row: ProjectRow): ProjectSnapshot {
    return {
      id: row.id, externalKey: row.external_key, name: row.name, description: row.description,
      schemaVersion: row.schema_version as 1, data: TrainingProjectDataSchema.parse(JSON.parse(row.data_json)),
      revision: row.revision, createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }

  getById(id: string) {
    const row = this.db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
    if (!row) throw new NotFoundError("Proyecto no encontrado.");
    return this.snapshot(row);
  }

  getByExternalKey(externalKey: string) {
    const row = this.db.prepare("SELECT * FROM projects WHERE external_key = ?").get(externalKey) as ProjectRow | undefined;
    return row ? this.snapshot(row) : null;
  }

  list() {
    const rows = this.db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as ProjectRow[];
    return rows.map((row) => this.snapshot(row));
  }

  create(input: { name: string; description: string; externalKey: string; data: ProjectImport["data"] }) {
    return this.mutate(input.externalKey, 0, input, true);
  }

  update(id: string, expectedRevision: number, input: { name: string; description: string; data: ProjectImport["data"] }) {
    const current = this.getById(id);
    return this.mutate(current.externalKey, expectedRevision, { ...input }, false, id);
  }

  upsertImport(payload: ProjectImport) {
    const input = ProjectImportSchema.parse(payload);
    const existing = this.getByExternalKey(input.project.externalKey);
    if (!existing) {
      if (input.expectedRevision !== 0) throw new RevisionConflictError(0);
      const result = this.mutate(input.project.externalKey, 0, { ...input.project, data: input.data }, true);
      return { ...result, created: true, changed: true };
    }
    const result = this.mutate(existing.externalKey, input.expectedRevision, { ...input.project, data: input.data }, false, existing.id);
    return { ...result, created: false };
  }

  private mutate(externalKey: string, expectedRevision: number, input: { name: string; description: string; data: ProjectImport["data"] }, creating: boolean, id: string = randomUUID()) {
    const now = new Date().toISOString();
    const dataJson = JSON.stringify(TrainingProjectDataSchema.parse(input.data));
    let snapshot: ProjectSnapshot;
    let changed = true;
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const current = this.db.prepare("SELECT * FROM projects WHERE external_key = ?").get(externalKey) as ProjectRow | undefined;
      if (creating) {
        if (current) throw new Error("El externalKey ya existe.");
        this.db.prepare("INSERT INTO projects (id, external_key, name, description, schema_version, data_json, revision, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, 1, ?, ?)").run(id, externalKey, input.name, input.description, dataJson, now, now);
      } else {
        if (!current) throw new NotFoundError("Proyecto no encontrado.");
        if (current.revision !== expectedRevision) throw new RevisionConflictError(current.revision);
        changed = current.name !== input.name || current.description !== input.description || current.data_json !== dataJson;
        if (changed) this.db.prepare("UPDATE projects SET name = ?, description = ?, data_json = ?, revision = revision + 1, updated_at = ? WHERE id = ?").run(input.name, input.description, dataJson, now, current.id);
        id = current.id;
      }
      const row = this.db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow;
      snapshot = this.snapshot(row);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return { snapshot, changed };
  }
}

import express, { type NextFunction, type Request, type Response } from "express";
import { z, ZodError } from "zod";
import { ProjectImportSchema, ProjectSnapshotSchema, TrainingProjectDataSchema } from "@training/contracts";
import { assertDatabaseReady } from "./db/database.js";
import { RevisionConflictError, NotFoundError } from "./errors.js";
import { createSession, destroySession, requireAuth, requireMutation, setCors, type AuthenticatedRequest } from "./http/auth.js";
import { AssetService } from "./services/asset-service.js";
import { ProjectRepository } from "./repositories/project-repository.js";
import { ProjectEventHub } from "./ws/hub.js";
import type Database from "better-sqlite3";
import type { AppConfig } from "./config.js";

const createSchema = z.object({ externalKey: z.string().trim().min(1).max(120), name: z.string().trim().max(200), description: z.string().trim().max(2000), data: TrainingProjectDataSchema }).strict();
const updateSchema = z.object({ expectedRevision: z.number().int().min(0), project: z.object({ name: z.string().trim().max(200), description: z.string().trim().max(2000) }).strict(), data: TrainingProjectDataSchema }).strict();

export function createApp({ db, repository, assets, hub, config }: { db: Database.Database; repository: ProjectRepository; assets: AssetService; hub: ProjectEventHub; config: AppConfig }) {
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => { setCors(req, res, config); if (req.method === "OPTIONS") return res.sendStatus(204); next(); });
  app.get("/healthz", (_req, res) => res.json({ ok: true }));
  app.get("/readyz", (_req, res) => { try { assertDatabaseReady(db); res.json({ ok: true }); } catch { res.status(503).json({ ok: false }); } });
  app.use(express.json({ limit: "2mb", strict: true }));

  app.post("/v1/session", (req, res) => { const session = createSession(res, config); res.status(201).json({ csrfToken: session.csrfToken }); });
  app.get("/v1/session", requireAuth(config), (req: AuthenticatedRequest, res) => res.json({ authenticated: true, kind: req.auth?.kind, csrfToken: req.auth?.session?.csrfToken ?? null }));
  app.delete("/v1/session", requireMutation(config), (req, res) => { destroySession(req, res, config); res.status(204).end(); });

  const authenticated = requireAuth(config);
  const mutation = requireMutation(config);
  app.get("/v1/projects", authenticated, (_req, res) => res.json({ projects: repository.list() }));
  app.post("/v1/projects", mutation, (req: AuthenticatedRequest, res) => {
    const body = createSchema.parse(req.body);
    const result = repository.create(body);
    hub.publish({ type: "project.revision", projectId: result.snapshot.id, revision: result.snapshot.revision, source: req.auth?.kind === "mcp" ? "mcp" : "browser", updatedAt: result.snapshot.updatedAt });
    res.status(201).json(result.snapshot);
  });
  app.get("/v1/projects/:projectId", authenticated, (req, res) => res.json(repository.getById(String(req.params.projectId))));
  app.put("/v1/projects/:projectId", mutation, (req: AuthenticatedRequest, res) => {
    const body = updateSchema.parse(req.body);
    const result = repository.update(String(req.params.projectId), body.expectedRevision, { ...body.project, data: body.data });
    if (result.changed) hub.publish({ type: "project.revision", projectId: result.snapshot.id, revision: result.snapshot.revision, source: req.auth?.kind === "mcp" ? "mcp" : "browser", updatedAt: result.snapshot.updatedAt });
    res.json(result.snapshot);
  });
  app.get("/v1/projects/by-external-key/:externalKey", authenticated, (req, res) => { const project = repository.getByExternalKey(String(req.params.externalKey)); if (!project) throw new NotFoundError("Proyecto no encontrado."); res.json(project); });
  app.put("/v1/project-imports/:externalKey", mutation, (req: AuthenticatedRequest, res) => {
    const body = ProjectImportSchema.parse({ ...req.body, project: { ...req.body.project, externalKey: String(req.params.externalKey) } });
    const result = repository.upsertImport(body);
    if (result.changed) hub.publish({ type: "project.revision", projectId: result.snapshot.id, revision: result.snapshot.revision, source: req.auth?.kind === "mcp" ? "mcp" : "browser", updatedAt: result.snapshot.updatedAt });
    res.json({ projectId: result.snapshot.id, revision: result.snapshot.revision, created: result.created, changed: result.changed, snapshot: result.snapshot });
  });
  app.post("/v1/projects/:projectId/assets/:field", mutation, express.raw({ type: ["image/jpeg", "image/png", "image/webp", "image/avif"], limit: "15mb" }), (req, res) => {
    const asset = assets.save(String(req.params.projectId), String(req.params.field), Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0), req.headers["content-type"]?.split(";")[0] ?? "");
    res.status(201).json(asset);
  });
  app.get("/v1/assets/:assetId", authenticated, (req, res) => { const asset = assets.file(String(req.params.assetId)); res.type(asset.mime_type).sendFile(asset.filename); });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof RevisionConflictError) return res.status(409).json({ error: { code: "REVISION_CONFLICT", message: error.message }, currentRevision: error.currentRevision });
    if (error instanceof NotFoundError) return res.status(404).json({ error: { code: "NOT_FOUND", message: error.message } });
    if (error instanceof ZodError) return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "El payload no cumple el contrato.", issues: error.issues } });
    const status = (error as { status?: number }).status;
    if (status === 413) return res.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "El payload es demasiado grande." } });
    console.error("api_error", error instanceof Error ? error.name : "unknown");
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Error interno." } });
  });
  return app;
}

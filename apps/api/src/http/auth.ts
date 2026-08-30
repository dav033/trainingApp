import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { IncomingMessage } from "node:http";
import type { AppConfig } from "../config.js";

type Session = { csrfToken: string; createdAt: number };
export type AuthKind = "browser" | "mcp";
export type AuthenticatedRequest = Request & { auth?: { kind: AuthKind; session?: Session } };

const sessions = new Map<string, Session>();

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function validSignedSession(value: string | undefined, secret: string) {
  if (!value) return null;
  const [sid, given] = value.split(".");
  if (!sid || !given) return null;
  const expected = signature(sid, secret);
  if (given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return null;
  const session = sessions.get(sid);
  return session ? { sid, session } : null;
}

export function cookiesFromRequest(req: IncomingMessage) {
  const header = req.headers.cookie ?? "";
  return Object.fromEntries(header.split(";").filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }));
}

export function sessionFromRequest(req: IncomingMessage, config: AppConfig) {
  return validSignedSession(cookiesFromRequest(req).training_session, config.sessionSecret);
}

export function createSession(res: Response, config: AppConfig) {
  const sid = randomBytes(24).toString("base64url");
  const session = { csrfToken: randomBytes(24).toString("base64url"), createdAt: Date.now() };
  sessions.set(sid, session);
  const value = `${sid}.${signature(sid, config.sessionSecret)}`;
  const flags = [`training_session=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=28800"];
  if (config.cookieSecure) flags.push("Secure");
  res.setHeader("Set-Cookie", flags.join("; "));
  return session;
}

export function destroySession(req: Request, res: Response, config: AppConfig) {
  const current = sessionFromRequest(req, config);
  if (current) sessions.delete(current.sid);
  res.setHeader("Set-Cookie", "training_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax");
}

export function bearerMatches(req: IncomingMessage, config: AppConfig) {
  const value = req.headers.authorization ?? "";
  const token = value.startsWith("Bearer ") ? value.slice(7) : "";
  if (!token || !config.mcpToken) return false;
  return token.length === config.mcpToken.length && timingSafeEqual(Buffer.from(token), Buffer.from(config.mcpToken));
}

export function requireAuth(config: AppConfig) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (bearerMatches(req, config)) { req.auth = { kind: "mcp" }; return next(); }
    if (req.headers.authorization) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Token MCP inválido." } });
    const current = sessionFromRequest(req, config);
    if (!current) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Sesión requerida." } });
    req.auth = { kind: "browser", session: current.session };
    next();
  };
}

export function requireMutation(config: AppConfig) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (bearerMatches(req, config)) { req.auth = { kind: "mcp" }; return next(); }
    const current = sessionFromRequest(req, config);
    if (!current) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Sesión o token MCP requerido." } });
    const origin = req.headers.origin;
    const csrf = req.headers["x-csrf-token"];
    if (origin !== config.webOrigin || typeof csrf !== "string" || csrf !== current.session.csrfToken) {
      return res.status(403).json({ error: { code: "CSRF_FAILED", message: "Origen o token CSRF inválido." } });
    }
    req.auth = { kind: "browser", session: current.session };
    next();
  };
}

export function setCors(req: Request, res: Response, config: AppConfig) {
  if (req.headers.origin === config.webOrigin) {
    res.setHeader("Access-Control-Allow-Origin", config.webOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
}

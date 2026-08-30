import path from "node:path";

const env = process.env;
const root = process.cwd();

export const config = {
  host: env.TRAINING_API_HOST ?? "127.0.0.1",
  port: Number(env.TRAINING_API_PORT ?? 4100),
  webOrigin: env.TRAINING_WEB_ORIGIN ?? "http://localhost:3000",
  dbPath: path.resolve(root, env.TRAINING_DB_PATH ?? "data/training.db"),
  assetDir: path.resolve(root, env.TRAINING_ASSET_DIR ?? "data/assets"),
  sessionSecret: env.TRAINING_SESSION_SECRET ?? "development-only-change-me",
  mcpToken: env.TRAINING_API_MCP_TOKEN ?? "",
  cookieSecure: env.TRAINING_COOKIE_SECURE === "true",
  publicBaseUrl: env.TRAINING_PUBLIC_BASE_URL ?? `http://localhost:${env.TRAINING_API_PORT ?? 4100}`,
};
export type AppConfig = typeof config;

if (env.NODE_ENV === "production") {
  if (!config.mcpToken || config.mcpToken === "change-me") throw new Error("TRAINING_API_MCP_TOKEN must be configured in production");
  if (config.sessionSecret.length < 32 || config.sessionSecret.includes("change-me")) throw new Error("TRAINING_SESSION_SECRET must be a long random value in production");
  if (!config.cookieSecure || !config.webOrigin.startsWith("https://") || !config.publicBaseUrl.startsWith("https://")) throw new Error("Production API requires HTTPS origin, URL and Secure cookies");
}

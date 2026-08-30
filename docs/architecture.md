# Training Workspace

`apps/web` is the browser editor and PDF renderer. `apps/api` owns SQLite,
asset files, revisions, authentication and WebSocket notifications. The
separate `trainingApp-mcp` repository is an HTTP-only adapter that calls the
API with a bearer token; it never imports SQLite or frontend code.

The API is the source of truth. A successful mutation commits SQLite first and
only then publishes `project.revision` through the in-memory project hub. The
WebSocket carries only the project id and revision; clients re-fetch snapshots
over HTTP.

Local ports are web `3000`, API `4100` and MCP development HTTP `3102`.
Production exposes only the API through Caddy on
`training-api.marosconstruction.com`; port `4100` stays private.

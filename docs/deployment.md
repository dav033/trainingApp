# EC2 deployment

The API release layout is `/home/ec2-user/trainingapp-api` with immutable
`releases/<git-sha>`, an atomic `current` symlink, and shared `data`, backups
and `api.env`. Compose mounts shared data at `/app/data`, exposes the API only
inside Docker, and joins the existing `stack_web` network.

The deployment scripts are intentionally guarded: they require a clean
worktree, a valid release SHA, an existing `stack_web` network, and a healthy
API before Caddy is reloaded. They do not modify LOTM's containers or its
`/mcp` endpoint.

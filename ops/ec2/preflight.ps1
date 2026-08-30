$ErrorActionPreference = 'Stop'
Resolve-DnsName training-api.marosconstruction.com -ErrorAction Stop | Select-Object Name,IPAddress
ssh n8n-maros 'set -eu; test "$(id -un)" = ec2-user; uname -m; df -h /; docker --version; docker compose version; docker network inspect stack_web >/dev/null; docker ps --format "{{.Names}} {{.Image}} {{.Ports}}"; (ss -ltn 2>/dev/null || true) | grep -E "(:80|:443|:4100)" || true; docker inspect stack-caddy-1 --format "{{range .Mounts}}{{.Source}} -> {{.Destination}}\n{{end}}"'

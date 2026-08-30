param([Parameter(Mandatory = $true)][string]$Sha)
$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$base = '/home/ec2-user/trainingapp-api'

if ($Sha -notmatch '^[0-9a-f]{7,64}$') { throw 'SHA inválido.' }
if ((git -C $workspace status --porcelain) -ne '') { throw 'El worktree debe estar limpio.' }
git -C $workspace cat-file -e "$Sha^{commit}"
Resolve-DnsName training-api.marosconstruction.com -ErrorAction Stop | Out-Null

$preflight = @'
set -eu
base=/home/ec2-user/trainingapp-api
test "$(id -un)" = ec2-user
test "$(uname -m)" = aarch64
free_kb=$(df -Pk / | awk 'NR==2 {print $4}')
test "$free_kb" -ge 4194304
docker network inspect stack_web >/dev/null
docker --version >/dev/null
docker compose version >/dev/null
test -f /opt/stack/Caddyfile
test -f "$base/shared/api.env"
mkdir -p "$base/releases" "$base/shared/data" "$base/shared/backups"
chmod 700 "$base/shared"
chmod 600 "$base/shared/api.env"
'@
($preflight -replace "`r`n", "`n") | ssh n8n-maros 'bash -s'

$remoteStage = "$base/releases/$Sha.staging"
$remoteRelease = "$base/releases/$Sha"
ssh n8n-maros "set -eu; test ! -e '$remoteStage'; test ! -e '$remoteRelease'; mkdir '$remoteStage'"
git -C $workspace archive --format=tar $Sha | ssh n8n-maros "set -eu; tar -xf - -C '$remoteStage'; test -f '$remoteStage/ops/ec2/compose.yml'"

ssh n8n-maros "set -eu; export TRAINING_RELEASE_SHA='$Sha'; docker compose -p trainingapp-api -f '$remoteStage/ops/ec2/compose.yml' build api; docker compose -p trainingapp-api -f '$remoteStage/ops/ec2/compose.yml' run --rm api node apps/api/dist/backup.js; mv '$remoteStage' '$remoteRelease'; ln -sfn '$remoteRelease' '$base/current'; docker compose -p trainingapp-api -f '$base/current/ops/ec2/compose.yml' up -d --no-build api; docker compose -p trainingapp-api -f '$base/current/ops/ec2/compose.yml' ps api"
Write-Host "Release $Sha preparado y activado. Valida HTTPS/WSS y recarga Caddy solo después del healthcheck remoto."

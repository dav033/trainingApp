param([Parameter(Mandatory = $true)][string]$Sha)
$ErrorActionPreference = 'Stop'
if ($Sha -notmatch '^[0-9a-f]{7,64}$') { throw 'SHA inválido.' }
$base = '/home/ec2-user/trainingapp-api'
ssh n8n-maros "set -eu; test -d '$base/releases/$Sha'; test -f '$base/shared/api.env'; ln -sfn '$base/releases/$Sha' '$base/current'; docker compose -p trainingapp-api -f '$base/current/ops/ec2/compose.yml' up -d --build api; docker compose -p trainingapp-api -f '$base/current/ops/ec2/compose.yml' ps api"
Write-Host "Rollback de código a $Sha solicitado. La base de datos no se restaura automáticamente; solo debe hacerse con un backup consistente y una migración compatible."

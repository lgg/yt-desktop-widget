param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$bdPath = Join-Path $repoRoot '.tools\bd\bd.exe'
$doltBin = 'C:\Program Files\Dolt\bin'
$doltHome = Join-Path $repoRoot '.tools\dolt-home'

if (-not (Test-Path $bdPath)) {
  throw "Beads CLI was not found at $bdPath"
}

New-Item -ItemType Directory -Force $doltHome | Out-Null
$env:PATH = "$doltBin;$env:PATH"
$env:HOME = $doltHome
$env:USERPROFILE = $doltHome

& $bdPath @Args
exit $LASTEXITCODE
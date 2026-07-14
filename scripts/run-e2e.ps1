$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$previewUrl = 'http://127.0.0.1:34174'
$node = Get-Command node -ErrorAction Stop
$server = $null
$exitCode = 1

try {
  $server = Start-Process `
    -FilePath $node.Source `
    -ArgumentList @(
      './node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      '34174'
    ) `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -PassThru

  $ready = $false
  for ($attempt = 0; $attempt -lt 120; $attempt += 1) {
    Start-Sleep -Milliseconds 250
    try {
      $response = Invoke-WebRequest `
        -UseBasicParsing `
        -Uri $previewUrl `
        -TimeoutSec 1
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        $ready = $true
        break
      }
    }
    catch {
      if ($server.HasExited) {
        throw 'The Vite preview server exited before becoming ready.'
      }
    }
  }

  if (-not $ready) {
    throw "The Vite preview server did not become ready at $previewUrl."
  }

  $env:PLAYWRIGHT_EXTERNAL_SERVER = '1'
  & npx playwright test
  $exitCode = $LASTEXITCODE
}
finally {
  Remove-Item Env:PLAYWRIGHT_EXTERNAL_SERVER -ErrorAction SilentlyContinue
  if ($null -ne $server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    [void]$server.WaitForExit(5000)
  }
}

exit $exitCode

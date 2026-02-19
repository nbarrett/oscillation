$AppName = "oscillation"
$SwarmRegistry = Join-Path $PSScriptRoot ".claude-swarm\registry.json"

$port = if ($env:DEV_PORT) { [int]$env:DEV_PORT } else { 3002 }
$conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
  Select-Object -First 1
if ($conn) {
  Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
}

if (Test-Path $SwarmRegistry) {
  try {
    $reg = Get-Content $SwarmRegistry -Raw | ConvertFrom-Json -AsHashtable
    if ($reg.ContainsKey($AppName)) {
      $reg[$AppName].status = "stopped"
      $reg[$AppName].stoppedAt = (Get-Date -Format "o")
      $reg[$AppName].pid = $null
    }
    $reg | ConvertTo-Json -Depth 5 | Set-Content $SwarmRegistry -Encoding UTF8
  } catch {}
}

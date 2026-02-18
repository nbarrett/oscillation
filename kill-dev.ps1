# Kill Oscillation development processes (Windows PowerShell)

$AppName = "oscillation"
$SwarmRegistry = Join-Path $PSScriptRoot ".claude-swarm\registry.json"

Write-Host "Stopping Oscillation development server..." -ForegroundColor Yellow

# Kill processes on the dev port (default 3000)
$port = if ($env:DEV_PORT) { [int]$env:DEV_PORT } else { 3002 }
$connections = netstat -ano | Select-String ":$port.*LISTENING"
foreach ($conn in $connections) {
    $procId = $conn.ToString().Split()[-1]
    if ($procId -match '^\d+$') {
        Write-Host "  Killing process $procId on port $port" -ForegroundColor Gray
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

# Kill any node processes running next dev
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
    $cmd = $_.CommandLine
    if ($cmd -and ($cmd -like "*next*dev*")) {
        Write-Host "  Killing node process $($_.ProcessId): $($cmd.Substring(0, [Math]::Min(80, $cmd.Length)))..." -ForegroundColor Gray
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

# Clear Next.js cache to prevent lock issues
$nextDir = Join-Path $PSScriptRoot ".next"
if (Test-Path $nextDir) {
    Write-Host "  Clearing .next cache..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $nextDir -ErrorAction SilentlyContinue
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

Write-Host "All development processes stopped" -ForegroundColor Green

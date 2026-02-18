[CmdletBinding()]
param(
    [string]$NodeVersion = "22.21.1",
    [string]$DevLog = "dev.log"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$AppName = "oscillation"
$SwarmLog = Join-Path $RepoRoot ".claude-swarm\logs\dev.log"
$SwarmRegistry = Join-Path $RepoRoot ".claude-swarm\registry.json"

function Write-Info {
    param([string]$Message)
    Write-Host "[run-dev] $Message" -ForegroundColor Green
}

function Throw-Error {
    param([string]$Message)
    throw "[run-dev] $Message"
}

function Use-NodeVersion {
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $current = (node -v)
        $normalized = [Version]($current.TrimStart('v'))
        if ($normalized.Major -ge 22) {
            Write-Info "Using system Node $current"
            return
        }
    }

    if (Get-Command nvm -ErrorAction SilentlyContinue) {
        nvm install $NodeVersion | Out-Null
        nvm use $NodeVersion | Out-Null
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        Write-Info "Using Node $(node -v) via nvm-windows"
        return
    }

    Throw-Error "Node.js not detected. Install Node $NodeVersion or nvm-windows."
}

function Ensure-Pnpm {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        return
    }

    Write-Info "pnpm not found, installing..."
    try {
        if (Get-Command corepack -ErrorAction SilentlyContinue) {
            corepack enable pnpm 2>$null
            if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
                npm install -g pnpm | Out-Null
            }
        } else {
            npm install -g pnpm | Out-Null
        }

        if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
            Throw-Error "Failed to install pnpm. Please install it manually: npm install -g pnpm"
        }
        Write-Info "pnpm installed successfully"
    }
    catch {
        Throw-Error "Failed to install pnpm: $_"
    }
}

function Ensure-EnvFile {
    $envPath = Join-Path $RepoRoot ".env"
    if (-not (Test-Path $envPath)) {
        Throw-Error "Missing $envPath. Copy .env.example and populate DATABASE_URL and OS_MAPS_API_KEY before running."
    }
}

function Test-PortInUse {
    param(
        [string]$Host_,
        [int]$Port
    )

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect($Host_, $Port, $null, $null)
        if ($async.AsyncWaitHandle.WaitOne(200) -and $client.Connected) {
            $client.EndConnect($async)
            return $true
        }
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
    return $false
}

function Check-Port {
    $port = if ($env:DEV_PORT) { [int]$env:DEV_PORT } else { 3002 }
    if (Test-PortInUse -Host_ "localhost" -Port $port) {
        Throw-Error "Port $port is already in use. Run .\kill-dev.ps1 first or set DEV_PORT to use a different port."
    }
}

function Register-Swarm {
    param([int]$Pid_)
    $port = if ($env:DEV_PORT) { [int]$env:DEV_PORT } else { 3002 }
    $null = New-Item -ItemType Directory -Force -Path (Split-Path $SwarmLog) -ErrorAction SilentlyContinue
    $null = New-Item -ItemType Directory -Force -Path (Split-Path $SwarmRegistry) -ErrorAction SilentlyContinue
    $reg = if (Test-Path $SwarmRegistry) { Get-Content $SwarmRegistry -Raw | ConvertFrom-Json -AsHashtable } else { @{} }
    $reg[$AppName] = @{
        status    = "running"
        pid       = $Pid_
        port      = $port
        log       = $SwarmLog
        project   = $RepoRoot
        health    = "http://localhost:$port/api/health"
        startedAt = (Get-Date -Format "o")
        stoppedAt = $null
    }
    $reg | ConvertTo-Json -Depth 5 | Set-Content $SwarmRegistry -Encoding UTF8
    Write-Info "Registered in swarm registry"
}

function Deregister-Swarm {
    if (-not (Test-Path $SwarmRegistry)) { return }
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

function Install-Dependencies {
    Push-Location $RepoRoot
    try {
        Write-Info "Installing dependencies..."
        pnpm install
        Write-Info "Generating Prisma client..."
        pnpm exec prisma generate
    }
    finally {
        Pop-Location
    }
}

function Push-Schema {
    Push-Location $RepoRoot
    try {
        Write-Info "Pushing schema to PostgreSQL..."
        pnpm exec prisma db push
    }
    finally {
        Pop-Location
    }
}

function Start-DevServer {
    $logPath = Join-Path $RepoRoot $DevLog

    # Clear Next.js cache
    Write-Info "Clearing Next.js cache..."
    $nextDir = Join-Path $RepoRoot ".next"
    $cacheDir = Join-Path $RepoRoot "node_modules/.cache"
    if (Test-Path $nextDir) { Remove-Item -Recurse -Force $nextDir }
    if (Test-Path $cacheDir) { Remove-Item -Recurse -Force $cacheDir }

    $null = New-Item -ItemType Directory -Force -Path (Split-Path $SwarmLog) -ErrorAction SilentlyContinue
    if (Test-Path $logPath) { Remove-Item $logPath }
    if (Test-Path $SwarmLog) { Remove-Item $SwarmLog }

    $env:NEXT_IGNORE_INCORRECT_LOCKFILE = "1"

    $job = Start-Job -Name "oscillation-dev" -ScriptBlock {
        param($WorkingDir)
        Set-StrictMode -Version Latest
        Set-Location $WorkingDir
        $env:NEXT_IGNORE_INCORRECT_LOCKFILE = "1"
        pnpm dev
    } -ArgumentList $RepoRoot

    Register-Swarm -Pid_ $job.Id

    $port = if ($env:DEV_PORT) { $env:DEV_PORT } else { "3002" }
    Write-Info "Oscillation dev server -> http://localhost:$port"
    Write-Info "Logs -> $logPath | $SwarmLog"
    Write-Info "Press Ctrl+C to stop."

    try {
        while ($true) {
            $output = Receive-Job -Job $job -ErrorAction SilentlyContinue
            if ($output) {
                $output | Tee-Object -FilePath $logPath -Append | Tee-Object -FilePath $SwarmLog -Append
            }

            if ($job.State -ne 'Running') { break }
            Start-Sleep -Milliseconds 250
        }

        Receive-Job -Job $job -ErrorAction SilentlyContinue | Out-File -FilePath $logPath -Append
        Wait-Job -Job $job | Out-Null
    }
    finally {
        if ($job.State -eq 'Running') {
            Stop-Job -Job $job -Force
        }
        Remove-Job -Job $job -Force
        Deregister-Swarm
    }
}

Use-NodeVersion
Ensure-Pnpm
Ensure-EnvFile
Check-Port
Install-Dependencies
Push-Schema
Start-DevServer

<#
  capture-shots.ps1

  Captures 5 real screenshots of the Sprint alpha demo app for the Remotion
  video, end to end: brings up the api and web dev server if they are not
  already running, places a real food order through the api, waits for the
  simulator to carry it to "picked_up", then captures five phone-sized PNGs
  with headless Edge straight into the Remotion project's public/appdemo
  folder. Cleans up any process it started when it is done.

  Run from anywhere:
    powershell -ExecutionPolicy Bypass -File .\tools\capture-shots.ps1
#>

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root      = Split-Path -Parent $ScriptDir
$ApiDir    = Join-Path $Root 'api'
$WebDir    = Join-Path $Root 'web'
$OutDir    = 'C:\Users\SALES\Desktop\remotion-video\public\appdemo'
$Edge      = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$LogDir    = Join-Path $ScriptDir 'logs'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

if (-not (Test-Path $Edge)) {
    throw "msedge.exe not found at $Edge"
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Test-UrlUp {
    param([string]$Url)
    try {
        Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 | Out-Null
        return $true
    } catch {
        # Any HTTP response (even 4xx/5xx) still means something is listening.
        if ($_.Exception.Response) { return $true }
        return $false
    }
}

function Wait-UrlUp {
    param([string]$Url, [int]$TimeoutSec = 90)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-UrlUp $Url) { return $true }
        Start-Sleep -Milliseconds 800
    }
    return $false
}

function Get-ListenPid {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) { return $conn.OwningProcess }
    return $null
}

function Invoke-Capture {
    param(
        [Parameter(Mandatory)] [string]$Url,
        [Parameter(Mandatory)] [string]$OutFile,
        [int]$VirtualTimeBudget = 9000,
        [int]$PreSleepMs = 0,
        [int]$TimeoutMs = 30000,
        # Pass a persistent directory to reuse a signed-in session (localStorage)
        # across several captures instead of logging in fresh each time - the
        # api only allows 5 logins per minute per IP, and demo auto-login plus
        # a script login for order placement would blow through that fast if
        # every single-page capture logged in from an empty profile.
        [string]$ProfileDir
    )
    if ($PreSleepMs -gt 0) { Start-Sleep -Milliseconds $PreSleepMs }
    if (Test-Path $OutFile) { Remove-Item $OutFile -Force }

    $ownProfile = $false
    if (-not $ProfileDir) {
        $ProfileDir = Join-Path $LogDir ('profile-' + [guid]::NewGuid().ToString('N'))
        $ownProfile = $true
    }
    New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null

    foreach ($headlessFlag in @('--headless=new', '--headless')) {
        $edgeArgs = @(
            $headlessFlag,
            "--user-data-dir=$ProfileDir",
            '--no-first-run',
            '--disable-gpu',
            # Headless Edge clamps its window to roughly 510 CSS px wide, so asking for
            # 390 laid the page out at 483 while only 390 px of it was captured, which
            # sliced the courier card and map labels off the right edge of every shot.
            # Window size is CSS pixels minus about 26, and the image is window times
            # the scale factor, so 512 lays out at about 486 and the image covers it all.

            '--window-size=512,1024',
            '--force-device-scale-factor=2',
            '--hide-scrollbars',
            "--virtual-time-budget=$VirtualTimeBudget",
            "--screenshot=$OutFile",
            $Url
        )

        $proc = Start-Process -FilePath $Edge -ArgumentList $edgeArgs -PassThru -WindowStyle Hidden
        $exited = $proc.WaitForExit($TimeoutMs)
        if (-not $exited) {
            Write-Warning "  [$([IO.Path]::GetFileName($OutFile))] Edge timed out ($headlessFlag), killing pid $($proc.Id)"
            try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
        }

        if ((Test-Path $OutFile) -and ((Get-Item $OutFile).Length -gt 5000)) {
            if ($ownProfile) { Remove-Item -Recurse -Force $ProfileDir -ErrorAction SilentlyContinue }
            return $true
        }
        Write-Warning "  [$([IO.Path]::GetFileName($OutFile))] $headlessFlag produced no/tiny file, trying fallback flag..."
    }
    if ($ownProfile) { Remove-Item -Recurse -Force $ProfileDir -ErrorAction SilentlyContinue }
    return $false
}

# ---------------------------------------------------------------------------
# 1. Bring up api (:4000) and web dev server (:5173) if not already running
# ---------------------------------------------------------------------------

$startedApi = $false
$startedWeb = $false

if (-not (Test-UrlUp 'http://localhost:4000/catalog')) {
    if (-not (Test-Path (Join-Path $ApiDir 'dist\main.js'))) {
        Write-Host 'Building api (dist missing)...'
        Push-Location $ApiDir
        & npm run build
        Pop-Location
        if ($LASTEXITCODE -ne 0) { throw 'api build failed' }
    }
    Write-Host 'Starting api on :4000...'
    Start-Process -FilePath 'node' -ArgumentList 'dist\main.js' -WorkingDirectory $ApiDir `
        -RedirectStandardOutput (Join-Path $LogDir 'api.out.log') `
        -RedirectStandardError  (Join-Path $LogDir 'api.err.log') `
        -WindowStyle Hidden | Out-Null
    $startedApi = $true
} else {
    Write-Host 'api already up on :4000, reusing it.'
}

if (-not (Test-UrlUp 'http://localhost:5173')) {
    Write-Host 'Starting web dev server on :5173...'
    Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev' -WorkingDirectory $WebDir `
        -RedirectStandardOutput (Join-Path $LogDir 'web.out.log') `
        -RedirectStandardError  (Join-Path $LogDir 'web.err.log') `
        -WindowStyle Hidden | Out-Null
    $startedWeb = $true
} else {
    Write-Host 'web already up on :5173, reusing it.'
}

Write-Host 'Waiting for api...'
if (-not (Wait-UrlUp 'http://localhost:4000/catalog')) { throw 'api did not come up on :4000 in time' }
Write-Host 'Waiting for web...'
if (-not (Wait-UrlUp 'http://localhost:5173')) { throw 'web did not come up on :5173 in time' }

# Resolve the real listening PIDs (not the npm.cmd wrapper) for clean shutdown later.
$apiPid = Get-ListenPid 4000
$webPid = Get-ListenPid 5173
Write-Host "api pid: $apiPid, web pid: $webPid"

$shots = @()

try {
    # -----------------------------------------------------------------------
    # 2. Place a real order via the api, poll until picked_up
    # -----------------------------------------------------------------------

    Write-Host "`nLogging in as customer (71111111)..."
    $loginBody = @{ phone = '71111111'; pin = '1234' } | ConvertTo-Json
    $auth = Invoke-RestMethod -Uri 'http://localhost:4000/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
    $token = $auth.token

    Write-Host 'Placing a food order at merchant m1...'
    $idemKey = [guid]::NewGuid().ToString()
    $orderBody = @{
        merchant_id    = 'm1'
        items          = @(
            @{ item_id = 'm1-i1'; qty = 1 },
            @{ item_id = 'm1-i2'; qty = 1 }
        )
        payment_method = 'orange_money'
        address        = 'Plot 5419, Village, Gaborone'
        age_confirmed  = $false
    } | ConvertTo-Json -Depth 5

    $order = Invoke-RestMethod -Uri 'http://localhost:4000/orders' -Method Post -Body $orderBody `
        -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $token"; 'Idempotency-Key' = $idemKey }
    $orderId = $order.id
    Write-Host "Order $orderId placed, status: $($order.status)"

    Write-Host 'Polling every 2s until picked_up...'
    $status = $order.status
    $deadline = (Get-Date).AddSeconds(120)
    while ($status -ne 'picked_up' -and $status -ne 'delivered' -and (Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 2
        $o = Invoke-RestMethod -Uri "http://localhost:4000/orders/$orderId" -Headers @{ Authorization = "Bearer $token" }
        $status = $o.status
        Write-Host "  status: $status"
    }
    if ($status -ne 'picked_up') {
        Write-Warning "Order never reached picked_up (last status: $status). tracking.png may not show a courier en route."
    }

    # -----------------------------------------------------------------------
    # 3. Capture the five shots
    # -----------------------------------------------------------------------
    # catalog / cart / payment / tracking all sign in as the same demo
    # customer, so they share one Edge profile: the first page load logs in
    # for real, later loads in that same profile find a session already in
    # localStorage and skip logging in again. ops.png uses its own profile
    # since it signs in as a different demo user (ops). This keeps total
    # logins for a run at 3 (order placement + customer + ops), safely under
    # the api's 5-per-minute-per-IP login limiter.
    #
    # catalog / cart / payment don't depend on order state, so they run
    # first. tracking.png does depend on the order being picked_up right
    # now, so it is captured immediately after the poll above (with a
    # smaller virtual time budget) before that 6-10s window closes. ops.png
    # runs last.

    $customerProfile = Join-Path $LogDir 'profile-customer'
    $opsProfile      = Join-Path $LogDir 'profile-ops'
    Remove-Item -Recurse -Force $customerProfile -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force $opsProfile -ErrorAction SilentlyContinue

    Write-Host "`nCapturing catalog.png..."
    $shots += [pscustomobject]@{
        Name = 'catalog'
        Ok   = Invoke-Capture -Url 'http://localhost:5173/?as=customer' `
            -OutFile (Join-Path $OutDir 'catalog.png') -VirtualTimeBudget 9000 -ProfileDir $customerProfile
    }

    Write-Host 'Capturing cart.png...'
    $shots += [pscustomobject]@{
        Name = 'cart'
        Ok   = Invoke-Capture -Url 'http://localhost:5173/merchant/m1?as=customer&drawer=1' `
            -OutFile (Join-Path $OutDir 'cart.png') -VirtualTimeBudget 9000 -ProfileDir $customerProfile
    }

    Write-Host 'Capturing payment.png...'
    $shots += [pscustomobject]@{
        Name = 'payment'
        Ok   = Invoke-Capture -Url 'http://localhost:5173/checkout?as=customer&seed=m1' `
            -OutFile (Join-Path $OutDir 'payment.png') -VirtualTimeBudget 9000 -ProfileDir $customerProfile
    }

    Write-Host 'Capturing tracking.png (order should still be picked_up)...'
    $shots += [pscustomobject]@{
        Name = 'tracking'
        Ok   = Invoke-Capture -Url "http://localhost:5173/track/$orderId`?as=customer" `
            -OutFile (Join-Path $OutDir 'tracking.png') -VirtualTimeBudget 5000 -ProfileDir $customerProfile
    }

    Write-Host 'Capturing ops.png...'
    $shots += [pscustomobject]@{
        Name = 'ops'
        Ok   = Invoke-Capture -Url 'http://localhost:5173/ops?as=ops' `
            -OutFile (Join-Path $OutDir 'ops.png') -VirtualTimeBudget 9000 -ProfileDir $opsProfile
    }

    Remove-Item -Recurse -Force $customerProfile -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force $opsProfile -ErrorAction SilentlyContinue

    # -----------------------------------------------------------------------
    # Results
    # -----------------------------------------------------------------------
    Write-Host "`n--- Capture results ---"
    foreach ($s in $shots) {
        $path = Join-Path $OutDir ($s.Name + '.png')
        $size = if (Test-Path $path) { (Get-Item $path).Length } else { 0 }
        $verdict = if ($s.Ok -and $size -gt 30KB) { 'PASS' } elseif ($s.Ok) { 'SMALL' } else { 'FAIL' }
        Write-Host ('  {0,-10} {1,-6} {2,10} bytes  {3}' -f $s.Name, $verdict, $size, $path)
    }
}
finally {
    # -------------------------------------------------------------------
    # 4. Clean up anything we started
    # -------------------------------------------------------------------
    Write-Host "`nCleaning up..."
    if ($startedApi -and $apiPid) {
        try { Stop-Process -Id $apiPid -Force -ErrorAction SilentlyContinue } catch {}
    }
    if ($startedWeb -and $webPid) {
        try { Stop-Process -Id $webPid -Force -ErrorAction SilentlyContinue } catch {}
    }
    Start-Sleep -Seconds 1

    if ($startedApi -and $apiPid -and (Get-Process -Id $apiPid -ErrorAction SilentlyContinue)) {
        Write-Warning "api process $apiPid is still running"
    }
    if ($startedWeb -and $webPid -and (Get-Process -Id $webPid -ErrorAction SilentlyContinue)) {
        Write-Warning "web process $webPid is still running"
    }
    if (-not $startedApi) { Write-Host 'api was already running before this script, left it alone.' }
    if (-not $startedWeb) { Write-Host 'web was already running before this script, left it alone.' }
    Write-Host 'Done.'
}

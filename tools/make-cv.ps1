# Renders tools/cv.html to cv.pdf at the site root using headless Edge.
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File tools\make-cv.ps1
$root = Split-Path $PSScriptRoot -Parent
$src  = Join-Path $PSScriptRoot 'cv.html'
$out  = Join-Path $root 'cv.pdf'
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe" }

$url = 'file:///' + ($src -replace '\\', '/')
& $edge --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=5000 `
  "--print-to-pdf=$out" $url | Out-Null
Start-Sleep -Milliseconds 500
Get-Item $out | Select-Object Name, Length, LastWriteTime

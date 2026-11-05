$nodeDir = "C:\Users\Dell\.antigravity\nodejs\node-v20.18.0-win-x64"

Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "             Starting FinSense Servers" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow

# 1. Start Backend in separate window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = '$nodeDir;' + `$env:Path; Set-Location 'C:\Users\Dell\.antigravity\finsense\backend'; Write-Host '🚀 FinSense Backend starting on http://localhost:5000...' -ForegroundColor Cyan; node src/index.js"

# 2. Start Frontend in separate window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = '$nodeDir;' + `$env:Path; Set-Location 'C:\Users\Dell\.antigravity\finsense\frontend'; Write-Host '🎨 FinSense Frontend starting on http://localhost:5173...' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "Backend API:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend Web: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Opening your browser in 4 seconds..." -ForegroundColor Gray

Start-Sleep -Seconds 4
Start-Process "http://localhost:5173"


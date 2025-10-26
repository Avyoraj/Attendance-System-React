Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Attendance System - React Version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting the system..." -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/3] Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run server:dev" -WindowStyle Normal

Write-Host "[2/3] Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "[3/3] Starting React Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    System Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend Server: http://localhost:5000" -ForegroundColor White
Write-Host "React Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Demo Account: demo@teacher.com / password123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

@echo off
echo ========================================
echo    Attendance System - React Version
echo ========================================
echo.
echo Starting the system...
echo.

echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "npm run server:dev"

echo [2/3] Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo [3/3] Starting React Frontend...
start "React Frontend" cmd /k "cd client && npm start"

echo.
echo ========================================
echo    System Started Successfully!
echo ========================================
echo.
echo Backend Server: http://localhost:5000
echo React Frontend: http://localhost:3000
echo.
echo Demo Account: demo@teacher.com / password123
echo.
echo Press any key to close this window...
pause >nul

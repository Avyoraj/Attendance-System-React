@echo off
title Attendance System Startup
echo ========================================
echo   Aayan's Attendance System Startup
echo ========================================
echo.

echo Installing dependencies...
call npm install
cd client
call npm install
cd ..

echo.
echo Starting Backend Server on Port 5001...
start "Backend Server" cmd /k "npm start"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting React Frontend...
cd client
start "React Frontend" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo   System Starting...
echo   Backend: http://localhost:5001
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul

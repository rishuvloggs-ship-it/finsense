@echo off
echo ========================================================
echo             Starting FinSense Full-Stack App
echo ========================================================
echo.
start "FinSense Backend" cmd /k "%~dp0start-backend.bat"
start "FinSense Frontend" cmd /k "%~dp0start-frontend.bat"
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.


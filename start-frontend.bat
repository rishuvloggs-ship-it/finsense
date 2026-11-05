@echo off
set "PATH=%~dp0nodejs\node-v20.18.0-win-x64;%PATH%"
cd /d "%~dp0frontend"
echo [FinSense] Starting Vite React Frontend on http://localhost:5173 ...
npm run dev
pause


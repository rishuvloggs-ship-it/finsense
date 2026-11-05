@echo off
if exist "%~dp0..\nodejs\node-v20.18.0-win-x64" set "PATH=%~dp0..\nodejs\node-v20.18.0-win-x64;%PATH%"
if exist "%~dp0nodejs\node-v20.18.0-win-x64" set "PATH=%~dp0nodejs\node-v20.18.0-win-x64;%PATH%"
cd /d "%~dp0frontend"
echo [FinSense] Starting Vite React Frontend on http://localhost:5173 ...
npm run dev
pause

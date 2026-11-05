@echo off
if exist "%~dp0..\nodejs\node-v20.18.0-win-x64" set "PATH=%~dp0..\nodejs\node-v20.18.0-win-x64;%PATH%"
if exist "%~dp0nodejs\node-v20.18.0-win-x64" set "PATH=%~dp0nodejs\node-v20.18.0-win-x64;%PATH%"
cd /d "%~dp0backend"
echo [FinSense] Starting Express Backend on http://localhost:5000 ...
node src/index.js
pause

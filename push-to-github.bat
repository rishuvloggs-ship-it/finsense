@echo off
set "PATH=%~dp0..\git\cmd;%PATH%"
cd /d "%~dp0"
echo ========================================================
echo        Pushing FinSense to GitHub
echo ========================================================
echo.
echo Target Repository: https://github.com/rishuvloggs-ship-it/finsense.git
echo.
echo Pushing branch 'main' to GitHub...
echo (If prompted, sign in via browser or paste your GitHub Personal Access Token)
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  SUCCESS! Your project is now live on GitHub!
    echo  Link for your teacher:
    echo  https://github.com/rishuvloggs-ship-it/finsense
    echo ========================================================
) else (
    echo.
    echo If push failed, make sure you created the empty repo at:
    echo https://github.com/new with name "finsense"
)
echo.
pause


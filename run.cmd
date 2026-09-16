@echo off
REM Sprint alpha launcher. Double click this file to start everything.
setlocal enabledelayedexpansion

set ROOT=%~dp0
set API_DIR=%ROOT%api
set WEB_DIR=%ROOT%web

echo.
echo   Sprint alpha
echo   Getting things ready...
echo.

if not exist "%API_DIR%\node_modules" (
  echo   Installing api dependencies, this only happens once...
  call npm install --prefix "%API_DIR%"
  if errorlevel 1 (
    echo   Something went wrong installing the api dependencies.
    pause
    exit /b 1
  )
)

if not exist "%WEB_DIR%\node_modules" (
  echo   Installing web dependencies, this only happens once...
  call npm install --prefix "%WEB_DIR%"
  if errorlevel 1 (
    echo   Something went wrong installing the web dependencies.
    pause
    exit /b 1
  )
)

echo   Building and starting the api on port 4000...
start "Sprint API" cmd /k "cd /d "%API_DIR%" && npm run build && npm run start"

echo   Starting the web app on port 5173...
start "Sprint Web" cmd /k "cd /d "%WEB_DIR%" && npm run dev"

echo   Giving the api a moment to come up...
timeout /t 6 /nobreak >nul

echo   Opening Sprint in your browser...
start "" "http://localhost:5173"

echo.
echo   Sprint is running. Leave both new windows open while you use it.
echo   Close this window any time, it is done its job.
echo.
pause

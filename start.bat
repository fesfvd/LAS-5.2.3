@echo off
cd /d "%~dp0"

echo.
echo   LAS v5.2.3
echo   ========================================
echo.

python -c "import fastapi" 2>nul
if %ERRORLEVEL% neq 0 (
    echo   [!] Dependencies not found. Installing...
    echo.
    pip install -r backend\requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo.
        echo   [ERROR] Install failed. Check your Python installation.
        pause
        exit /b 1
    )
    echo.
    echo   [OK] Dependencies installed.
) else (
    echo   [OK] Dependencies ready.
)

echo.
echo   Starting server...
echo   Homepage : http://localhost:8000
echo   App      : http://localhost:8000/app
echo   Press Ctrl+C in the server window to stop
echo.

start "LAS Server" python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

echo   Waiting for server to be ready...
timeout /t 5 /nobreak >nul

echo   Opening browser...
start http://localhost:8000
echo.
echo   [OK] Server running. You can close this window.
echo.
pause

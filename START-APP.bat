@echo off
echo Starting GoBus Application...
echo.

echo [1/3] Starting Backend...
cd backend
start "GoBus Backend" cmd /k "npm run dev"
cd ..

echo [2/3] Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo [3/3] Starting Frontend...
start "GoBus Frontend" cmd /k "npm run dev"

echo.
echo ✅ GoBus is starting!
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
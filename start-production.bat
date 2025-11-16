@echo off
echo Starting GoBus Production Server...

echo.
echo ================================
echo Starting Backend Server...
echo ================================
cd backend
start "GoBus Backend" cmd /k "npm start"
cd ..

echo.
echo ================================
echo Backend started on port 5000
echo Frontend served from backend
echo ================================
echo.
echo Access the application at:
echo http://localhost:5000
echo.
echo Press any key to exit...
pause
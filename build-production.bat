@echo off
echo Building GoBus for Production...

echo.
echo ================================
echo Building Backend...
echo ================================
cd backend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo Backend build failed!
    pause
    exit /b 1
)
cd ..

echo.
echo ================================
echo Building Frontend...
echo ================================
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo ================================
echo Copying Frontend to Backend...
echo ================================
if exist backend\public rmdir /s /q backend\public
xcopy /e /i dist backend\public

echo.
echo ================================
echo Building Mobile APK...
echo ================================
cd mobile
call node build-apk.js
cd ..

echo.
echo ================================
echo Production Build Complete!
echo ================================
echo Backend: backend\dist\
echo Frontend: backend\public\
echo Mobile APK: mobile\build\
echo.
pause
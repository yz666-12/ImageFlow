@echo off

REM ImageFlow File Size Migration Tool Runner (Windows)

set SCRIPT_DIR=%~dp0
set BINARY=migrate-sizes-windows-amd64.exe
set BINARY_PATH=%SCRIPT_DIR%%BINARY%

if not exist "%BINARY_PATH%" (
    echo ❌ Binary not found: %BINARY_PATH%
    echo Please make sure the migration tool is properly installed
    pause
    exit /b 1
)

echo 🚀 Running ImageFlow file size migration tool...
echo    Using binary: %BINARY%
echo.

"%BINARY_PATH%" %*

if errorlevel 1 (
    echo.
    echo ❌ Migration failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ Migration completed successfully!
pause

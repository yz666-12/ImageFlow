@echo off

REM 安装依赖
echo Installing dependencies...
call npm install

REM 构建项目
echo Building project...
call npm run build

REM 复制静态文件到Go后端的static目录
echo Copying static files to Go backend...
if exist ..\static\* del /Q /F ..\static\*
xcopy /E /I /Y out\* ..\static\

echo Build completed successfully!
pause 
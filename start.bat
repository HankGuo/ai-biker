@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================
echo   多模型讨论系统 - 一键启动
echo ========================================
echo.

REM 检查 Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 Node.js，请先安装
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo Node.js 版本: %NODE_VERSION%
echo.

REM 安装依赖
echo [1/3] 正在安装依赖...
if not exist "node_modules" (
    call npm install
    if errorlevel 1 exit /b 1
)
if not exist "backend\node_modules" (
    cd backend
    call npm install --no-workspaces
    if errorlevel 1 exit /b 1
    cd ..
)
if not exist "frontend\node_modules" (
    cd frontend
    call npm install --no-workspaces
    if errorlevel 1 exit /b 1
    cd ..
)

REM 启动服务
echo.
echo [2/3] 正在启动服务...
echo.

call npm run start

#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  多模型讨论系统 - 一键启动"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node > /dev/null 2>&1; then
    echo "错误: 未找到 Node.js，请先安装"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "Node.js 版本: $NODE_VERSION"

# 安装依赖
echo ""
echo "[1/3] 正在安装依赖..."
if [ ! -d "node_modules" ]; then
    npm install
fi
if [ ! -d "backend/node_modules" ]; then
    cd backend && npm install --no-workspaces && cd ..
fi
if [ ! -d "frontend/node_modules" ]; then
    cd frontend && npm install --no-workspaces && cd ..
fi

# 启动服务
echo ""
echo "[2/3] 正在启动服务..."
echo ""

npm run start

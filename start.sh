#!/bin/bash

echo "🎮 CROWDSTORY - 启动脚本"
echo "========================"
echo ""
echo "启动后端服务器..."
cd /Users/siqijiang/aigame
node server.js &
BACKEND_PID=$!

sleep 2

echo ""
echo "启动前端网页服务器..."
cd /Users/siqijiang/aigame/frontend
npx vite --port 5173

# Ctrl+C 时清理
trap "kill $BACKEND_PID" EXIT

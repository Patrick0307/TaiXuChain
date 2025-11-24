@echo off
echo ========================================
echo   太虚链游戏 - 多人模式启动脚本
echo ========================================
echo.

echo [1/2] 启动后端服务器...
start "Taixu Backend" cmd /k "cd taixu-backend && npm start"
timeout /t 3 /nobreak >nul

echo [2/2] 启动前端应用...
start "Taixu Frontend" cmd /k "cd taixuchain && npm start"

echo.
echo ========================================
echo   服务启动完成！
echo ========================================
echo.
echo 后端服务器: http://localhost:3001
echo 前端应用: http://localhost:5173
echo WebSocket: ws://localhost:3001
echo.
echo 按任意键关闭此窗口...
pause >nul

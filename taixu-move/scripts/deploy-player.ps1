# 部署玩家合约脚本
# 使用方法: .\deploy-player.ps1

Write-Host "=== 部署玩家合约 ===" -ForegroundColor Cyan
Write-Host ""

# 检查网络
Write-Host "当前网络:" -ForegroundColor Yellow
sui client envs
Write-Host ""

Write-Host "当前地址:" -ForegroundColor Yellow
sui client active-address
Write-Host ""

# 构建
Write-Host "构建合约..." -ForegroundColor Yellow
sui move build
if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 构建成功" -ForegroundColor Green
Write-Host ""

# 获取 gas coin
Write-Host "查找 Gas Coin..." -ForegroundColor Yellow
$objects = sui client objects --json | ConvertFrom-Json
$gasCoin = $objects | Where-Object { $_.data.type -like "*::oct::OCT" } | Select-Object -First 1

if (-not $gasCoin) {
    Write-Host "错误: 没有找到 OCT 代币" -ForegroundColor Red
    exit 1
}

$gasCoinId = $gasCoin.data.objectId
Write-Host "使用 Gas Coin: $gasCoinId" -ForegroundColor Cyan
Write-Host ""

# 部署
Write-Host "部署玩家合约..." -ForegroundColor Yellow
sui client publish --gas $gasCoinId --gas-budget 100000000

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== 部署成功! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "请保存以下信息:" -ForegroundColor Yellow
    Write-Host "1. Package ID (玩家合约地址)" -ForegroundColor Cyan
    Write-Host "2. PlayerRegistry ID (玩家注册表)" -ForegroundColor Cyan
}

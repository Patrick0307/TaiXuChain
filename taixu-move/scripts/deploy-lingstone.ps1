# 快速部署脚本
# 使用方法: .\deploy.ps1

Write-Host "=== LingStone 快速部署 ===" -ForegroundColor Cyan

# 检查 .env 文件
if (-not (Test-Path ".env")) {
    Write-Host "错误: .env 文件不存在" -ForegroundColor Red
    Write-Host "请复制 .env.example 为 .env 并填入私钥" -ForegroundColor Yellow
    exit 1
}

# 读取配置
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.+)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Variable -Name $name -Value $value
    }
}

Write-Host "网络: $NETWORK" -ForegroundColor Yellow
Write-Host "RPC: $RPC_URL" -ForegroundColor Yellow
Write-Host ""

# 检查网络配置
$envs = sui client envs 2>&1
if ($envs -notmatch $NETWORK) {
    Write-Host "配置网络..." -ForegroundColor Yellow
    sui client new-env --alias $NETWORK --rpc $RPC_URL
}

sui client switch --env $NETWORK

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

# 获取一个 gas coin
Write-Host "查找 Gas Coin..." -ForegroundColor Yellow
$objects = sui client objects --json | ConvertFrom-Json
$gasCoin = $objects | Where-Object { $_.data.type -like "*::oct::OCT" } | Select-Object -First 1

if (-not $gasCoin) {
    Write-Host "错误: 没有找到 OCT 代币用于支付 Gas" -ForegroundColor Red
    Write-Host "请先获取测试币: Invoke-RestMethod -Uri `"$FAUCET_URL?address=`$(sui client active-address)`"" -ForegroundColor Yellow
    exit 1
}

$gasCoinId = $gasCoin.data.objectId
Write-Host "使用 Gas Coin: $gasCoinId" -ForegroundColor Cyan
Write-Host ""

# 部署
Write-Host "部署合约..." -ForegroundColor Yellow
sui client publish --gas $gasCoinId --gas-budget 500000000

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== 部署成功! ===" -ForegroundColor Green
    Write-Host "请保存 Package ID 和 TreasuryCap ID" -ForegroundColor Yellow
}

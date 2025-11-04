# 部署所有合约的主脚本
# 使用方法: .\deploy-all.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    太虚世界 - 全部合约部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

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
$address = sui client active-address
Write-Host $address -ForegroundColor Cyan
Write-Host ""

# 检查余额
Write-Host "检查余额..." -ForegroundColor Yellow
$objects = sui client objects --json | ConvertFrom-Json
$gasCoins = $objects | Where-Object { $_.data.type -like "*::oct::OCT" }

if ($gasCoins.Count -eq 0) {
    Write-Host "错误: 没有找到 OCT 代币用于支付 Gas" -ForegroundColor Red
    Write-Host "请先获取测试币: Invoke-RestMethod -Uri `"$FAUCET_URL?address=$address`"" -ForegroundColor Yellow
    exit 1
}

Write-Host "找到 $($gasCoins.Count) 个 OCT 代币" -ForegroundColor Green
Write-Host ""

# 部署顺序说明
Write-Host "部署顺序:" -ForegroundColor Yellow
Write-Host "1. LingStone (灵石代币) - 独立合约" -ForegroundColor White
Write-Host "2. Player (玩家系统) - 独立合约" -ForegroundColor White
Write-Host "3. Weapon (武器系统) - 独立合约" -ForegroundColor White
Write-Host "4. Marketplace (市场) - 依赖 LingStone 和 Weapon" -ForegroundColor White
Write-Host ""

$continue = Read-Host "是否继续部署所有合约? (y/n)"
if ($continue -ne "y") {
    Write-Host "已取消部署" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "开始部署..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. 部署 LingStone
Write-Host "[1/4] 部署 LingStone 代币合约..." -ForegroundColor Cyan
& ".\scripts\deploy-lingstone.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "LingStone 部署失败" -ForegroundColor Red
    exit 1
}
Write-Host ""
Read-Host "请记录 LingStone Package ID 和 TreasuryCap ID，按回车继续"
Write-Host ""

# 2. 部署 Player
Write-Host "[2/4] 部署 Player 玩家合约..." -ForegroundColor Cyan
& ".\scripts\deploy-player.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Player 部署失败" -ForegroundColor Red
    exit 1
}
Write-Host ""
Read-Host "请记录 Player Package ID 和 PlayerRegistry ID，按回车继续"
Write-Host ""

# 3. 部署 Weapon
Write-Host "[3/4] 部署 Weapon 武器合约..." -ForegroundColor Cyan
& ".\scripts\deploy-weapon.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Weapon 部署失败" -ForegroundColor Red
    exit 1
}
Write-Host ""
Read-Host "请记录 Weapon Package ID 和 WeaponMintCap ID，按回车继续"
Write-Host ""

# 4. 部署 Marketplace
Write-Host "[4/4] 部署 Marketplace 市场合约..." -ForegroundColor Cyan
& ".\scripts\deploy-marketplace.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Marketplace 部署失败" -ForegroundColor Red
    exit 1
}
Write-Host ""
Read-Host "请记录 Marketplace Package ID 和 Marketplace ID，按回车继续"
Write-Host ""

Write-Host "======================================" -ForegroundColor Green
Write-Host "    所有合约部署完成!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "1. 将所有 Package ID 保存到 deployments/deployment.json" -ForegroundColor White
Write-Host "2. 更新前端配置文件" -ForegroundColor White
Write-Host "3. 测试合约功能" -ForegroundColor White

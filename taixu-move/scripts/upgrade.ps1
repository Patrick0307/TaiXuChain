# TaixuChain Move 升级脚本
# 使用 UpgradeCap 进行包升级

param(
    [Parameter(Mandatory=$false)]
    [string]$UpgradeCapId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$OctCoinId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$GasBudget = "500000000"
)

# 读取 .env 文件
function Read-EnvFile {
    param([string]$Path)
    
    $envVars = @{}
    if (Test-Path $Path) {
        Get-Content $Path | ForEach-Object {
            if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.+?)\s*$') {
                $envVars[$matches[1]] = $matches[2]
            }
        }
    }
    return $envVars
}

# 如果没有提供 UpgradeCapId，从 .env 文件读取
if (-not $UpgradeCapId) {
    $envPath = "taixu-move/.env"
    if (-not (Test-Path $envPath)) {
        $envPath = ".env"
    }
    
    if (Test-Path $envPath) {
        $envVars = Read-EnvFile -Path $envPath
        $UpgradeCapId = $envVars["UPGRADE_CAP_ID"]
        
        if (-not $UpgradeCapId) {
            Write-Host "错误: .env 文件中未找到 UPGRADE_CAP_ID" -ForegroundColor Red
            Write-Host "请在 .env 文件中设置 UPGRADE_CAP_ID 或通过参数提供" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "从 .env 文件读取 Upgrade Cap ID: $UpgradeCapId" -ForegroundColor Green
    } else {
        Write-Host "错误: 未找到 .env 文件，且未提供 UpgradeCapId 参数" -ForegroundColor Red
        Write-Host "用法: .\scripts\upgrade.ps1 -UpgradeCapId <upgrade_cap_id>" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TaixuChain Move 升级脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在正确的网络
Write-Host "检查当前网络配置..." -ForegroundColor Yellow
$currentEnv = sui client active-env
Write-Host "当前网络: $currentEnv" -ForegroundColor Green

if ($currentEnv -notmatch "onechain") {
    Write-Host "警告: 当前不在 OneChain 网络，正在切换..." -ForegroundColor Yellow
    sui client switch --env onechain-testnet
}

# 检查当前地址
Write-Host ""
Write-Host "当前活跃地址:" -ForegroundColor Yellow
$activeAddress = sui client active-address
Write-Host $activeAddress -ForegroundColor Green

# 确认升级
Write-Host ""
Write-Host "准备升级参数:" -ForegroundColor Yellow
Write-Host "  Upgrade Cap ID: $UpgradeCapId" -ForegroundColor White
Write-Host "  Gas Budget: $GasBudget" -ForegroundColor White
if ($OctCoinId) {
    Write-Host "  OCT Coin ID: $OctCoinId" -ForegroundColor White
}
Write-Host ""
$confirm = Read-Host "确认升级? (y/n)"
if ($confirm -ne "y") {
    Write-Host "升级已取消" -ForegroundColor Red
    exit
}

# 执行升级
Write-Host ""
Write-Host "开始升级..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($OctCoinId) {
    $upgradeOutput = sui client upgrade --upgrade-capability $UpgradeCapId --gas $OctCoinId --gas-budget $GasBudget 2>&1 | Out-String
} else {
    $upgradeOutput = sui client upgrade --upgrade-capability $UpgradeCapId --gas-budget $GasBudget 2>&1 | Out-String
}

# 显示升级输出
Write-Host $upgradeOutput

# 解析升级结果
$newPackageId = ""
if ($upgradeOutput -match 'PackageID:\s*(0x[a-fA-F0-9]+)') {
    $newPackageId = $matches[1]
}

# 创建升级信息 JSON
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$fileTimestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# 提取 Transaction Digest
$txDigest = ""
if ($upgradeOutput -match 'Transaction Digest:\s*(\S+)') {
    $txDigest = $matches[1]
}

# 提取 Gas Cost
$gasCost = ""
if ($upgradeOutput -match 'Storage Cost:\s*(\d+)') {
    $storageCost = $matches[1]
}
if ($upgradeOutput -match 'Computation Cost:\s*(\d+)') {
    $computationCost = $matches[1]
}

# 创建 JSON 对象
$upgradeData = @{
    timestamp = $timestamp
    network = "onechain-testnet"
    address = $activeAddress
    packageId = $newPackageId
    upgradeCapId = $UpgradeCapId
    transactionDigest = $txDigest
    gasBudget = $GasBudget
    storageCost = $storageCost
    computationCost = $computationCost
}

if ($OctCoinId) {
    $upgradeData.octCoinId = $OctCoinId
}

# 保存 JSON
$docsPath = "taixu-move/docs"
if (-not (Test-Path $docsPath)) {
    New-Item -ItemType Directory -Path $docsPath -Force | Out-Null
}

$jsonFile = "$docsPath/upgrade_$fileTimestamp.json"
$upgradeData | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonFile -Encoding UTF8

# 追加到历史 JSON 数组
$historyFile = "$docsPath/upgrade_history.json"
$history = @()
if (Test-Path $historyFile) {
    $history = Get-Content $historyFile -Raw | ConvertFrom-Json
}
$history += $upgradeData
$history | ConvertTo-Json -Depth 10 | Out-File -FilePath $historyFile -Encoding UTF8

# 更新 .env 文件中的 PACKAGE_ID
$envPath = "taixu-move/.env"
if (-not (Test-Path $envPath)) {
    $envPath = ".env"
}

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match 'PACKAGE_ID=.*') {
        $envContent = $envContent -replace 'PACKAGE_ID=.*', "PACKAGE_ID=$newPackageId"
        $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
        Write-Host "已更新 .env 文件中的 PACKAGE_ID" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "升级完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package ID: $newPackageId" -ForegroundColor Yellow
Write-Host "Upgrade Cap: $UpgradeCapId" -ForegroundColor Yellow
Write-Host "TX Digest: $txDigest" -ForegroundColor Yellow
Write-Host ""
Write-Host "JSON 已保存:" -ForegroundColor Cyan
Write-Host "  - $jsonFile" -ForegroundColor White
Write-Host "  - $historyFile" -ForegroundColor White
Write-Host ""

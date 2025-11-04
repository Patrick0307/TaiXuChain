# 武器合约测试脚本
# 使用方法: .\test-weapon.ps1

Write-Host "=== 武器合约测试 ===" -ForegroundColor Cyan
Write-Host ""

# 配置（部署后填入）
$PACKAGE_ID = Read-Host "请输入 Package ID"
$MINT_CAP_ID = Read-Host "请输入 WeaponMintCap ID"
$PLAYER_ADDRESS = sui client active-address

Write-Host ""
Write-Host "配置信息:" -ForegroundColor Yellow
Write-Host "Package ID: $PACKAGE_ID" -ForegroundColor Cyan
Write-Host "MintCap ID: $MINT_CAP_ID" -ForegroundColor Cyan
Write-Host "玩家地址: $PLAYER_ADDRESS" -ForegroundColor Cyan
Write-Host ""

# 获取 gas coin
$objects = sui client objects --json | ConvertFrom-Json
$gasCoin = $objects | Where-Object { $_.data.type -like "*::oct::OCT" } | Select-Object -First 1
$gasCoinId = $gasCoin.data.objectId

# 测试 1: 铸造一把传说级神剑
Write-Host "测试 1: 铸造传说级神剑..." -ForegroundColor Yellow
$nameBytes = "[231,165,158,229,137,145]"  # "神剑"
sui client call `
  --package $PACKAGE_ID `
  --module weapon `
  --function mint_weapon `
  --args $MINT_CAP_ID $nameBytes 1 150 5 $PLAYER_ADDRESS `
  --gas $gasCoinId `
  --gas-budget 10000000

Write-Host ""
Write-Host "✓ 神剑铸造完成" -ForegroundColor Green
Write-Host ""

# 测试 2: 铸造一把稀有级长枪
Write-Host "测试 2: 铸造稀有级长枪..." -ForegroundColor Yellow
$nameBytes = "[233,149,191,230,158,170]"  # "长枪"
sui client call `
  --package $PACKAGE_ID `
  --module weapon `
  --function mint_weapon `
  --args $MINT_CAP_ID $nameBytes 2 100 3 $PLAYER_ADDRESS `
  --gas $gasCoinId `
  --gas-budget 10000000

Write-Host ""
Write-Host "✓ 长枪铸造完成" -ForegroundColor Green
Write-Host ""

# 测试 3: 铸造一把史诗级战刀
Write-Host "测试 3: 铸造史诗级战刀..." -ForegroundColor Yellow
$nameBytes = "[230,136,152,229,136,128]"  # "战刀"
sui client call `
  --package $PACKAGE_ID `
  --module weapon `
  --function mint_weapon `
  --args $MINT_CAP_ID $nameBytes 3 120 4 $PLAYER_ADDRESS `
  --gas $gasCoinId `
  --gas-budget 10000000

Write-Host ""
Write-Host "✓ 战刀铸造完成" -ForegroundColor Green
Write-Host ""

# 测试 4: 铸造一把优秀级战斧
Write-Host "测试 4: 铸造优秀级战斧..." -ForegroundColor Yellow
$nameBytes = "[230,136,152,230,150,167]"  # "战斧"
sui client call `
  --package $PACKAGE_ID `
  --module weapon `
  --function mint_weapon `
  --args $MINT_CAP_ID $nameBytes 4 80 2 $PLAYER_ADDRESS `
  --gas $gasCoinId `
  --gas-budget 10000000

Write-Host ""
Write-Host "✓ 战斧铸造完成" -ForegroundColor Green
Write-Host ""

Write-Host "=== 测试完成! ===" -ForegroundColor Green
Write-Host ""
Write-Host "查看你的武器:" -ForegroundColor Yellow
Write-Host "sui client objects" -ForegroundColor Cyan
Write-Host ""
Write-Host "或在 OneWallet 的 NFT 标签中查看" -ForegroundColor Yellow

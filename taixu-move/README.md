# TaiXu Move Contracts

太虚世界的智能合约项目，基于 Sui Move 开发。

## 项目结构

```
taixu-move/
├── sources/           # 智能合约源代码
│   ├── lingstone.move      # 灵石代币合约
│   ├── player.move         # 玩家系统合约
│   ├── weapon.move         # 武器系统合约
│   └── marketplace.move    # 市场合约
├── scripts/           # 部署和测试脚本
├── tests/            # 测试脚本
├── Move.toml         # Move 项目配置
└── .env.example      # 环境变量示例

# 以下目录包含敏感信息，不会提交到 Git
├── deployments/      # 部署记录（私有）
├── docs/            # 详细文档（私有）
└── .env             # 环境变量（私有）
```

## 合约模块

### 1. LingStone Token (灵石代币)
- 游戏内的主要代币
- 符号: LING
- 小数位: 9
- 用于市场交易和游戏内经济

### 2. Player System (玩家系统)
- 玩家角色 NFT
- 支持三种职业：术士、武者、射手
- 等级和经验系统

### 3. Weapon System (武器系统)
- 武器 NFT
- 三种武器类型：弓箭、剑、灵珠
- 三种稀有度：凡品、灵品、玄品
- 升级和强化系统

### 4. Marketplace (市场)
- 武器交易市场
- 使用 LING 代币进行交易
- 支持上架、购买、取消挂单

## 快速开始

### 1. 安装依赖

```bash
# 安装 Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

### 2. 配置环境

```bash
# 复制环境变量示例
cp .env.example .env

# 编辑 .env 文件，填入你的私钥
```

### 3. 构建合约

```bash
sui move build
```

### 4. 部署合约

```bash
# 使用部署脚本
.\scripts\deploy-all.ps1
```

## 网络配置

- **测试网**: OneChain Testnet
- **RPC**: https://rpc-testnet.onelabs.cc:443
- **水龙头**: https://faucet-testnet.onelabs.cc/

## 开发指南

### 添加新功能

1. 在 `sources/` 目录创建新的 .move 文件
2. 在 `Move.toml` 中添加必要的依赖
3. 运行 `sui move build` 测试编译
4. 编写测试脚本
5. 部署到测试网

### 测试

```bash
# 运行测试脚本
.\tests\test-weapon.ps1
```

## 安全注意事项

⚠️ **重要**: 以下文件包含敏感信息，请勿提交到公开仓库：

- `.env` - 包含私钥
- `deployments/` - 包含部署地址和 ID
- `docs/` - 包含详细的部署信息

这些文件已在 `.gitignore` 中配置。

## 许可证

MIT License

## 联系方式

- 项目: TaiXu Chain
- 游戏: 太虚世界

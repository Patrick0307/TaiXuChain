# TaiXu Chain - 太虚世界

一个基于区块链的 Web3 游戏项目，结合了 React 前端和 Sui Move 智能合约。

## ✨ 特色功能

🎉 **零门槛游戏** - 使用赞助交易（Sponsored Transactions），玩家无需任何代币即可开始游戏！

---

## 🚀 立即开始

**新用户？** 👉 [GET_STARTED.md](./GET_STARTED.md) - 3 分钟快速开始

**详细指南？** 👉 [QUICK_START.md](./QUICK_START.md) - 5 分钟完整设置

**查看所有文档？** 👉 [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - 文档索引

---

## 项目结构

```
TaiXuChain/
├── taixuchain/        # React 游戏前端
│   ├── src/          # 源代码
│   ├── public/       # 静态资源
│   └── package.json  # 依赖配置
│
├── taixu-backend/    # 赞助交易后端服务 ⭐ NEW
│   ├── services/     # 赞助服务
│   ├── server.js     # Express 服务器
│   └── package.json  # 依赖配置
│
└── taixu-move/       # Sui Move 智能合约
    ├── sources/      # 合约源代码
    ├── scripts/      # 部署脚本
    └── Move.toml     # Move 配置
```

## 技术栈

### 前端
- React 18
- TypeScript
- Sui TypeScript SDK
- Phaser 3 (游戏引擎)

### 智能合约
- Sui Move
- OneChain Testnet

## 🚀 快速开始

### 方式 1：一键启动（推荐）

```powershell
# 同时启动后端和前端
.\start-all.ps1
```

### 方式 2：手动启动

#### 1. 启动后端服务器（赞助交易）

```bash
cd taixu-backend
npm install
copy .env.example .env
# 编辑 .env 文件，填入你的钱包私钥
npm start
```

#### 2. 启动前端

```bash
cd taixuchain
npm install
npm run dev
```

#### 3. 智能合约开发

```bash
cd taixu-move
sui move build
```

### 📖 详细设置指南

**首次使用？** 请查看 [赞助交易设置指南](./SPONSORED_TRANSACTION_SETUP.md)

**后端文档：** [taixu-backend/README.md](./taixu-backend/README.md)

## 🎮 游戏特性

- 🎮 基于区块链的 RPG 游戏
- 💎 NFT 武器系统
- 👤 玩家角色系统（SBT - 灵魂绑定代币）
- 🏪 去中心化市场
- 💰 游戏内代币经济（灵石）
- ⭐ **零门槛** - 玩家无需代币即可开始游戏（赞助交易）

## 💰 赞助交易系统

本游戏使用 **Sponsored Transactions** 技术，让玩家无需持有任何代币即可：

- ✅ 创建角色
- ✅ 开始游戏
- ✅ 获得首个武器

所有 gas 费用由项目方承担，玩家只需签名确认操作。

**成本估算：**
- 每个玩家注册：~0.001 SUI
- 1000 个玩家：~1 SUI (~$0.10 USD)
- 测试网代币免费获取

## 开发状态

🚧 项目正在积极开发中

## 许可证

MIT License

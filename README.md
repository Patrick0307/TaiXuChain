# TaiXu Chain - TaiXu World

A blockchain-based Web3 gaming project that combines React frontend with Sui Move smart contracts.

## ✨ Key Features

🎉 **Zero Barrier Gaming** - Using Sponsored Transactions, players can start playing without any tokens!

---

## 🚀 Get Started

**New User?** 👉 [GET_STARTED.md](./GET_STARTED.md) - 3-minute quick start

**Detailed Guide?** 👉 [QUICK_START.md](./QUICK_START.md) - 5-minute complete setup

**View All Documentation?** 👉 [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - Documentation Index

---

## Project Structure

```
TaiXuChain/
├── taixuchain/        # React game frontend
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json  # Dependencies config
│
├── taixu-backend/    # Sponsored transaction backend service ⭐ NEW
│   ├── services/     # Sponsorship services
│   ├── server.js     # Express server
│   └── package.json  # Dependencies config
│
└── taixu-move/       # Sui Move smart contracts
    ├── sources/      # Contract source code
    ├── scripts/      # Deployment scripts
    └── Move.toml     # Move configuration
```

## Tech Stack

### Frontend
- React 18
- TypeScript
- Sui TypeScript SDK
- Phaser 3 (Game Engine)

### Smart Contracts
- Sui Move
- OneChain Testnet

## 🚀 Quick Start

### Method 1: One-Click Multiplayer Launch (Recommended) ⭐ NEW

```bash
# Windows
start-multiplayer.bat

# Or manual start
.\start-all.ps1
```

### Method 2: Manual Start

#### 1. Start Backend Server (Sponsored Transactions)

```bash
cd taixu-backend
npm install
copy .env.example .env
# Edit .env file and add your wallet private key
npm start
```

#### 2. Start Frontend

```bash
cd taixuchain
npm install
npm run dev
```

#### 3. Smart Contract Development

```bash
cd taixu-move
sui move build
```

### 📖 Detailed Setup Guide

**First Time?** Check out [Sponsored Transaction Setup Guide](./SPONSORED_TRANSACTION_SETUP.md)

**Multiplayer?** Check out [Multiplayer Quick Start](./QUICK_START.md) ⭐ NEW

**Backend Documentation:** [taixu-backend/README.md](./taixu-backend/README.md)

**Multiplayer Guide:** [MULTIPLAYER_GUIDE.md](./MULTIPLAYER_GUIDE.md) ⭐ NEW

## 🎮 Game Features

- 🎮 Blockchain-based RPG game
- 💎 NFT weapon system
- 👤 Player character system (SBT - Soulbound Token)
- 🏪 Decentralized marketplace
- 💰 In-game token economy (Spirit Stones)
- ⭐ **Zero Barrier** - Players can start without tokens (Sponsored Transactions)
- 👥 **Multiplayer Online** - Real-time multiplayer support ⭐ NEW

## 💰 Sponsored Transaction System

This game uses **Sponsored Transactions** technology, allowing players to:

- ✅ Create characters
- ✅ Start playing
- ✅ Obtain first weapon

All gas fees are covered by the project, players only need to sign to confirm operations.

**Cost Estimation:**
- Per player registration: ~0.001 SUI
- 1000 players: ~1 SUI (~$0.10 USD)
- Testnet tokens are free

## Development Status

🚧 Project is under active development

## License

MIT License

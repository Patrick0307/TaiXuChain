<div align="center">

<img src="./taixuchain/public/logo.png" alt="TaiXu World Logo" width="200"/>

# TaiXuChain

[![Live Demo](https://img.shields.io/badge/🎮%20Play%20Now-Live%20Demo-FF6B6B?style=for-the-badge)](https://tai-xu-chain.vercel.app)
[![YouTube](https://img.shields.io/badge/📺%20Demo-YouTube-red?style=for-the-badge)](https://www.youtube.com/watch?v=l86PfXooajU)

[![OneChain](https://img.shields.io/badge/Network-OneChain%20Testnet-purple)](https://onelabs.cc/)
[![Sui Move](https://img.shields.io/badge/Smart%20Contract-Sui%20Move-4A90E2)](https://sui.io/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

**A Web3 Blockchain RPG with Zero Gas Fee Entry**

*Sponsored Transactions • Real-time Multiplayer • NFT Weapons • On-chain Marketplace*

</div>

---

## ✨ Features

- 🎮 **Three Classes** — Mage, Warrior, Archer with unique stats
- ⚔️ **NFT Weapons** — Mint, upgrade, merge, and trade weapons on-chain
- 💎 **LING Token** — In-game currency for marketplace transactions
- 🌐 **Multiplayer** — Real-time co-op monster hunting via WebSocket
- 🆓 **Zero Entry Cost** — Sponsored transactions cover gas fees for new players
- 🏪 **Decentralized Marketplace** — P2P weapon trading with escrow

---

## 🚀 Quick Start

### Play Online
👉 **[tai-xu-chain.vercel.app](https://tai-xu-chain.vercel.app)**

1. Install [OneWallet](https://chromewebstore.google.com/detail/onechain/gclmcgmpkgblaglfokkaclneihpnbkli/) browser extension
2. Get free OCT from [Faucet](https://faucet-testnet.onelabs.cc/)
3. Start playing!

### Local Development

```bash
# Clone
git clone https://github.com/your-username/taixu-world.git
cd taixu-world

# Backend
cd taixu-backend
npm install
cp .env.example .env  # Add SPONSOR_PRIVATE_KEY
npm start

# Frontend (new terminal)
cd taixuchain
npm install
npm start
```

---

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Frontend  │────>│   Backend   │────>│ OneChain Testnet│
│   (React)   │ WS  │  (Node.js)  │ RPC │   (Sui Move)    │
└─────────────┘     └─────────────┘     └─────────────────┘
     Vercel             Render            Smart Contracts
```

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | React 19 + Vite | Game UI & wallet integration |
| Backend | Express + WebSocket | Sponsored TX & multiplayer |
| Contracts | Sui Move | Player SBT, Weapon NFT, LING token, Marketplace |

---

## 📁 Project Structure

```
TaiXuWorld/
├── taixuchain/      # Frontend (React)
├── taixu-backend/   # Backend (Node.js)
├── taixu-move/      # Smart Contracts (Sui Move)
└── maps-design/     # Tiled map files
```

---

## 📜 Smart Contracts

| Module | Type | Description |
|--------|------|-------------|
| `player.move` | SBT | Non-transferable character token |
| `weapon.move` | NFT | Tradeable weapons (3 types × 3 rarities) |
| `lingstone.move` | Token | In-game currency (9 decimals) |
| `marketplace.move` | DEX | P2P weapon trading with escrow |

**Package ID:** `0x2065f3f546d076e2a67de7900e471601e4fda71d34749143b3aa7fdf0fbcf9d5`

---

## 🗺️ Roadmap

- [x] Character system & customization
- [x] Weapon NFT & marketplace
- [x] Real-time multiplayer
- [x] Sponsored transactions
- [ ] More maps & monsters
- [ ] PvP combat
- [ ] Mobile support

---

## 📖 Documentation

| Doc | Description |
|-----|-------------|
| [Backend](./taixu-backend/README.md) | API endpoints & WebSocket events |
| [Contracts](./taixu-move/README.md) | Smart contract modules & deployment |
| [Test Guide](./taixuchain/TEST_GUIDE.md) | Testing instructions |

---

## 🔗 Links

| Resource | Link |
|----------|------|
| 🎮 Live Demo | [tai-xu-chain.vercel.app](https://tai-xu-chain.vercel.app) |
| 📊 Explorer | [explorer.onelabs.cc](https://explorer.onelabs.cc/) |
| 💧 Faucet | [faucet-testnet.onelabs.cc](https://faucet-testnet.onelabs.cc/) |

---

## 📄 License

MIT © TaiXu World

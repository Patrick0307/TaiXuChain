# TaiXu Move Contracts

Smart contract project for TaiXu World, developed with Sui Move.

## Project Structure

```
taixu-move/
├── sources/           # Smart contract source code
│   ├── lingstone.move      # LingStone token contract
│   ├── player.move         # Player system contract
│   ├── weapon.move         # Weapon system contract
│   └── marketplace.move    # Marketplace contract
├── scripts/           # Deployment and test scripts
├── tests/            # Test scripts
├── Move.toml         # Move project configuration
└── .env.example      # Environment variables example

# Following directories contain sensitive info, not committed to Git
├── deployments/      # Deployment records (private)
├── docs/            # Detailed documentation (private)
└── .env             # Environment variables (private)
```

## Contract Modules

### 1. LingStone Token
- Primary in-game token
- Symbol: LING
- Decimals: 9
- Used for marketplace trading and in-game economy

### 2. Player System
- Player character NFT
- Supports three classes: Mage, Warrior, Archer
- Level and experience system

### 3. Weapon System
- Weapon NFT
- Three weapon types: Bow, Sword, Spirit Orb
- Three rarities: Common, Rare, Legendary
- Upgrade and enhancement system

### 4. Marketplace
- Weapon trading marketplace
- Uses LING token for transactions
- Supports listing, buying, and canceling orders

## Quick Start

### 1. Install Dependencies

```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

### 2. Configure Environment

```bash
# Copy environment variables example
cp .env.example .env

# Edit .env file and add your private key
```

### 3. Build Contracts

```bash
sui move build
```

### 4. Deploy Contracts

```bash
# Use deployment script
.\scripts\deploy-all.ps1
```

## Network Configuration

- **Testnet**: OneChain Testnet
- **RPC**: https://rpc-testnet.onelabs.cc:443
- **Faucet**: https://faucet-testnet.onelabs.cc/

## Development Guide

### Adding New Features

1. Create new .move file in `sources/` directory
2. Add necessary dependencies in `Move.toml`
3. Run `sui move build` to test compilation
4. Write test scripts
5. Deploy to testnet

### Testing

```bash
# Run test scripts
.\tests\test-weapon.ps1
```

## Security Notes

⚠️ **Important**: Following files contain sensitive information, do not commit to public repository:

- `.env` - Contains private keys
- `deployments/` - Contains deployment addresses and IDs
- `docs/` - Contains detailed deployment information

These files are configured in `.gitignore`.

## License

MIT License

## Contact

- Project: TaiXu Chain
- Game: TaiXu World

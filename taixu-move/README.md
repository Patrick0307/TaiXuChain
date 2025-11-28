# TaiXu Move Contracts

Smart contracts for TaiXu World, built with Sui Move on OneChain Testnet.

## Modules

| Module | Type | Description |
|--------|------|-------------|
| `player.move` | SBT | Non-transferable character token |
| `weapon.move` | NFT | Tradeable weapons (3 types × 3 rarities) |
| `lingstone.move` | Token | In-game currency (LING, 9 decimals) |
| `marketplace.move` | DEX | P2P weapon trading with escrow |
| `random_utils.move` | Utility | On-chain randomness |

## Current Deployment (V7)

| Object | ID |
|--------|-----|
| Package | `0xb4c8177c0a999d5e49e532e17c67b69c83b059a018a94b70e24fcf1551f42888` |
| PlayerRegistry | `0x156c38f5923226135349a1439f84e237fa241c8c9359cdb452bd2e0f72477683` |
| Marketplace | `0x45ec2626c88321b42d680ac6048b402f8ef0fcc5a4612503b1e17d65cc49350a` |
| WeaponMintCap | `0x36afa27278a7476b67909576551b0f3db308cfa2c1d739e9bcf990624e89961b` |
| TreasuryCap | `0x48896cbf46e4849a05ad46e2b2456b8ccdc0724d8747665bef8fdbb9786c6693` |
| UpgradeCap | `0x637630ea01c6ad475f040756c3ec987be4c0bd8e033fbcd7d99d594cbb20d7f9` |

## Quick Start

### Prerequisites
- [Sui CLI](https://docs.sui.io/build/install)

### Build
```bash
sui move build
```

### Deploy
```bash
sui client publish --gas-budget 100000000
```

## Network

| Property | Value |
|----------|-------|
| Network | OneChain Testnet |
| RPC | `https://rpc-testnet.onelabs.cc:443` |
| Faucet | [faucet-testnet.onelabs.cc](https://faucet-testnet.onelabs.cc/) |
| Explorer | [explorer.onelabs.cc](https://explorer.onelabs.cc/) |

## Project Structure

```
taixu-move/
├── sources/          # Contract source code
├── build/            # Compiled output
├── scripts/          # Deployment scripts
├── docs/             # Deployment records (V1-V7)
├── Move.toml         # Package config
└── .env.example      # Environment template
```

## Security Notes

⚠️ Files not committed to Git:
- `.env` — Contains private keys
- `docs/` — Contains deployment details

## License

MIT

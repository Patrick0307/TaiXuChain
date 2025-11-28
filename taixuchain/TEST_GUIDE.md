# TaiXu Test Guide

## Configuration (V7)

| Property | Value |
|----------|-------|
| Package ID | `0xb4c8177c0a999d5e49e532e17c67b69c83b059a018a94b70e24fcf1551f42888` |
| Player Registry | `0x156c38f5923226135349a1439f84e237fa241c8c9359cdb452bd2e0f72477683` |
| Marketplace | `0x45ec2626c88321b42d680ac6048b402f8ef0fcc5a4612503b1e17d65cc49350a` |
| Network | OneChain Testnet |

## Start Testing

```bash
cd taixuchain
npm start
```

## Test Flow

### 1. Connect Wallet
- Install OneWallet browser extension
- Switch to Testnet
- Click "Connect OneChain Wallet"

### 2. Create Character
- Select class (Mage/Warrior/Archer)
- Customize appearance
- Enter name (3-20 characters)
- Click "Register" — creates SBT on-chain

### 3. Enter Game
- Select map (Forest available)
- Create or join multiplayer room
- Hunt monsters, collect loot!

### 4. Marketplace
- List weapons for LING
- Browse and buy weapons
- Merge weapons to upgrade

## Verify On-Chain

Check your transaction on explorer:
```
https://explorer.onelabs.cc/txblock/[tx-hash]?network=testnet
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Wallet not connecting | Refresh page, ensure OneWallet installed |
| Transaction failed | Check wallet has OCT for gas |
| Stuck on "Registering..." | Check console (F12) for errors |

## Resources

- [Faucet](https://faucet-testnet.onelabs.cc/) — Get free OCT
- [Explorer](https://explorer.onelabs.cc/) — View transactions

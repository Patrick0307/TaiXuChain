# Test Guide

## ✅ Configuration Complete

All configurations are complete, ready to test!

### Configuration Info
- **Package ID**: `0x2065f3f546d076e2a67de7900e471601e4fda71d34749143b3aa7fdf0fbcf9d5`
- **Player Registry ID**: `0x1586d814c0cd790cf281073d8a2de6f8cf398001866b2c717154f4c5a18572d9`
- **Network**: OneChain Testnet (`https://rpc-testnet.onelabs.cc:443`)

## 🚀 Start Testing

```bash
cd taixuchain
npm start
```

## 📝 Test Flow

### 1. Connect Wallet
- Ensure OneChain wallet extension is installed
- Switch to Testnet network
- Click "Connect OneChain Wallet"

### 2. Select Class
- Choose Mage, Warrior, or Archer

### 3. Customize Character
- Adjust hairstyle, face shape, body color, etc.

### 4. Name Character ⭐ New Feature
- Enter character name (3-20 characters)
- Click "Register and Start Adventure"
- **This step calls blockchain contract to create SBT**
- Wait for transaction confirmation (may take a few seconds)

### 5. Select Map ⭐ New Feature
- After successful registration, automatically enter map selection interface
- Three map options:
  - 🌲 Misty Forest (Easy)
  - ⛰️ Snow Peak Mountains (Medium)
  - 🏜️ Hot Desert (Hard)
- Click map card to select, then click "Enter Map"

### 6. Enter Game
- Display character info and blockchain registration info
- Display Player Object ID and transaction hash

## 🔍 Verify Blockchain Registration

### View in Browser
Visit OneChain explorer to view your transaction:
```
https://explorer.onelabs.cc/txblock/[your-transaction-hash]?network=testnet
```

### View in Console
Open browser developer tools (F12), check console output:
- "Registering character to blockchain..."
- "Registration successful!" + transaction result
- Player Object ID

## 🐛 Common Issues

### 1. "Please connect Sui wallet first"
- Ensure OneChain wallet is connected in step 1
- Refresh page and reconnect

### 2. Transaction Failed
- Check if wallet has enough test tokens
- Confirm wallet is on Testnet network
- Check console for error messages

### 3. Register button keeps showing "Registering..."
- Check network connection
- Check console for errors
- May need to confirm transaction in wallet

### 4. Map selection interface doesn't appear
- Ensure character registration succeeded
- Check console for error messages

## 📊 Expected Results

After successful registration, you should see:
1. ✅ Character registered to blockchain
2. Player ID: 0x... (a long hexadecimal address)
3. Transaction hash: a transaction ID

This information proves your character has been successfully created as an SBT and stored on the blockchain!

## 🎮 Next Steps

Map selection is currently UI only, no actual game logic yet. Future plans:
- Implement map scene rendering
- Add combat system
- Implement experience and leveling
- Add weapon system integration

# Taixu Backend - Sponsored Transaction Server

Backend server for Taixu game, handling Sponsored Transactions.

## Features

- 🎮 **Sponsored Character Creation** - Project pays gas fees when players create characters
- 💰 **Zero Barrier** - Players don't need any tokens to start playing
- 🔒 **Secure** - Players still need to sign to confirm operations

## Quick Start

### 1. Install Dependencies

```bash
cd taixu-backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Edit `.env` file and add your wallet private key:

```env
# Export private key from OneChain wallet
# Settings -> Security -> Export Private Key
SPONSOR_PRIVATE_KEY=your_private_key

# Other configurations are already preset
```

⚠️ **Important Security Notes:**
- Do not commit `.env` file to Git
- Keep private key confidential, don't share with anyone
- Recommend using dedicated sponsor wallet, not main wallet

### 3. Ensure Sponsor Wallet Has Balance

Your sponsor wallet needs some SUI/OCT tokens to pay gas:

- **Testnet Faucet**: https://faucet.onechain.com/
- Recommend at least 1 SUI/OCT (can support thousands of transactions)

### 4. Start Server

```bash
npm start
```

Or use development mode (auto-restart):

```bash
npm run dev
```

Server will start at `http://localhost:3001`.

### 5. Test Server

Open browser and visit:
```
http://localhost:3001/health
```

Should see:
```json
{
  "status": "ok",
  "message": "Taixu Backend is running"
}
```

## API Endpoints

### POST /api/sponsor/create-player

Create player character (sponsored transaction)

**Request Body:**
```json
{
  "playerAddress": "0x...",
  "name": "Player Name",
  "classId": 1
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "digest": "Transaction Hash",
    "effects": { ... }
  },
  "message": "Player created successfully with sponsored gas"
}
```

## Cost Estimation

- Per character creation: ~0.001 SUI/OCT
- 1 SUI/OCT can support ~1000 player registrations
- Testnet tokens are free, available from faucet

## Frontend Configuration

Add to frontend project's `.env` file:

```env
VITE_BACKEND_URL=http://localhost:3001
```

## Deploy to Production

### Using PM2 (Recommended)

```bash
npm install -g pm2
pm2 start server.js --name taixu-backend
pm2 save
pm2 startup
```

### Using Docker

```bash
docker build -t taixu-backend .
docker run -d -p 3001:3001 --env-file .env taixu-backend
```

## Security Recommendations

1. **Use Dedicated Sponsor Wallet** - Don't use main wallet
2. **Limit Sponsorship Count** - Can add per-address sponsorship limit
3. **Monitor Balance** - Regularly check sponsor wallet balance
4. **Use HTTPS** - Production must use HTTPS
5. **Add Rate Limiting** - Prevent abuse

## Troubleshooting

### Error: SPONSOR_PRIVATE_KEY not set

Ensure `.env` file exists and contains correct private key.

### Error: Sponsor wallet has no gas coins

Sponsor wallet balance insufficient, need to get tokens from faucet.

### Error: Connection refused

Ensure backend server is running, check if port is occupied.

## License

MIT

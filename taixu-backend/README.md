# TaiXu Backend

Sponsored transaction server & multiplayer WebSocket for TaiXu World.

## Features

- 🆓 **Sponsored Transactions** — Project pays gas fees for players
- 🌐 **Real-time Multiplayer** — WebSocket server for co-op gameplay
- 🎮 **Game API** — Player, weapon, marketplace endpoints

## Quick Start

```bash
# Install
npm install

# Configure
cp .env.example .env
# Edit .env and add your SPONSOR_PRIVATE_KEY

# Run
npm start
```

Server runs at `http://localhost:3001`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SPONSOR_PRIVATE_KEY` | Wallet private key for paying gas |
| `WEAPON_DEPLOY_PRIVATE_KEY` | Wallet with WeaponMintCap |
| `GAME_TREASURY_PRIVATE_KEY` | Wallet receiving LING payments |
| `PORT` | Server port (default: 3001) |

See `.env.example` for full configuration.

## API Endpoints

### Health Check
```
GET /health
```

### Player
```
GET  /api/player/:address          # Get player info
POST /api/sponsor/create-player    # Create player (sponsored)
```

### Weapons
```
GET  /api/weapons/:address              # Get player's weapons
POST /api/sponsor/mint-weapon           # Mint class weapon
POST /api/sponsor/mint-random-weapon    # Mint random drop
POST /api/sponsor/burn-weapon           # Burn weapon
POST /api/sponsor/merge-weapon          # Merge weapons
```

### LingStone
```
GET  /api/lingstone/balance/:address    # Get LING balance
POST /api/sponsor/mint-lingstone        # Mint LING tokens
```

### Marketplace
```
GET /api/marketplace/listings           # Get all listings
```

## WebSocket Events

### Client → Server
- `join_room` — Join multiplayer room
- `leave_room` — Leave room
- `player_move` — Broadcast movement
- `player_attack` — Broadcast attack
- `monster_damage` — Report monster damage
- `monster_killed` — Report monster death

### Server → Client
- `room_joined` — Confirm join
- `player_joined` / `player_left` — Player updates
- `room_state` — Full state sync
- `monster_died` — Monster death + loot

## Deployment

### Render
Configure in `render.yaml` at project root.

### Docker
```bash
docker build -t taixu-backend .
docker run -d -p 3001:3001 --env-file .env taixu-backend
```

## Security Notes

⚠️ Never commit `.env` to Git — contains private keys!

- Use dedicated sponsor wallet (not your main wallet)
- Keep minimal OCT balance in sponsor wallet
- Monitor balance regularly

## License

MIT

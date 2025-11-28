// WebSocket client service
class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect(url) {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        const url = this.ws?.url;
        if (url) {
          this.connect(url).catch(console.error);
        }
      }, this.reconnectDelay);
    } else {
      console.error('❌ Max reconnect attempts reached');
      this.emit('max_reconnect_reached');
    }
  }

  handleMessage(message) {
    const { type, data } = message;
    this.emit(type, data);
  }

  send(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('⚠️ WebSocket not connected');
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  // Room-related methods
  createRoom(playerId, playerData, mapName, isPublic) {
    this.send('create_room', { playerId, playerData, mapName, isPublic });
  }

  joinRoom(roomId, playerId, playerData) {
    this.send('join_room', { roomId, playerId, playerData });
  }

  leaveRoom() {
    this.send('leave_room', {});
  }

  getPublicRooms() {
    this.send('get_public_rooms', {});
  }

  // Game sync methods
  sendPlayerMove(position, direction, isMoving) {
    this.send('player_move', { position, direction, isMoving });
  }

  sendPlayerAttack(attackData) {
    this.send('player_attack', attackData);
  }

  sendMonsterUpdate(monsters) {
    this.send('monster_update', { monsters });
  }

  sendPlayerHpUpdate(hp) {
    this.send('player_hp_update', { hp });
  }

  // Game state sync (host only)
  syncGameState(gameState) {
    this.send('game_state_sync', { gameState });
  }

  requestGameState() {
    this.send('request_game_state', {});
  }

  // Loot box pickup
  pickupLootBox(lootBoxId) {
    this.send('lootbox_pickup', { lootBoxId });
  }

  // Monster damaged
  reportMonsterDamage(monsterId, damage, attackerId) {
    this.send('monster_damage', { monsterId, damage, attackerId });
  }

  // Monster death (notify host to spawn loot box)
  reportMonsterDeath(monsterId, killerId, killerName, position) {
    this.send('monster_death', { monsterId, killerId, killerName, position });
  }

  // Monster state update (host broadcasts attack actions, HP changes, etc.)
  sendMonsterStateUpdate(monsterId, state) {
    this.send('monster_state_update', { monsterId, state });
  }
}

export default new WebSocketClient();

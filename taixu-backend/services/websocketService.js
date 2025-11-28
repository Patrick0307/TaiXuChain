// WebSocket Service
import { WebSocketServer } from 'ws';
import roomService from './roomService.js';

// Fix WebSocket constant reference
const WS_OPEN = 1; // Value of WebSocket.OPEN

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // ws -> { playerId, roomId }
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws) => {
      console.log('🔌 New WebSocket connection');

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('❌ WebSocket message error:', error);
          ws.send(JSON.stringify({ type: 'error', data: { message: error.message } }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });

    console.log('✅ WebSocket server initialized');
  }

  handleMessage(ws, message) {
    const { type, data } = message;

    switch (type) {
      case 'create_room':
        this.handleCreateRoom(ws, data);
        break;
      
      case 'join_room':
        this.handleJoinRoom(ws, data);
        break;
      
      case 'leave_room':
        this.handleLeaveRoom(ws);
        break;
      
      case 'get_public_rooms':
        this.handleGetPublicRooms(ws);
        break;
      
      case 'player_move':
        this.handlePlayerMove(ws, data);
        break;
      
      case 'player_attack':
        this.handlePlayerAttack(ws, data);
        break;
      
      case 'monster_update':
        this.handleMonsterUpdate(ws, data);
        break;
      
      case 'player_hp_update':
        this.handlePlayerHpUpdate(ws, data);
        break;
      
      case 'game_state_sync':
        this.handleGameStateSync(ws, data);
        break;
      
      case 'request_game_state':
        this.handleRequestGameState(ws, data);
        break;
      
      case 'lootbox_pickup':
        this.handleLootBoxPickup(ws, data);
        break;
      
      case 'monster_damage':
        this.handleMonsterDamage(ws, data);
        break;
      
      case 'monster_death':
        this.handleMonsterDeath(ws, data);
        break;

      case 'monster_state_update':
        this.handleMonsterStateUpdate(ws, data);
        break;

      default:
        console.warn('⚠️ Unknown message type:', type);
    }
  }

  handleCreateRoom(ws, data) {
    const { playerId, playerData, mapName, isPublic } = data;

    try {
      const room = roomService.createRoom(playerId, mapName, isPublic);
      roomService.joinRoom(room.id, playerId, playerData);

      this.clients.set(ws, { playerId, roomId: room.id });

      ws.send(JSON.stringify({
        type: 'room_created',
        data: {
          roomId: room.id,
          isPublic: room.isPublic,
          mapName: room.mapName
        }
      }));

      console.log(`✅ Room ${room.id} created by ${playerId}`);
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', data: { message: error.message } }));
    }
  }

  handleJoinRoom(ws, data) {
    const { roomId, playerId, playerData } = data;

    console.log(`🔍 Attempting to join room: ${roomId}, player: ${playerId}`);

    try {
      const room = roomService.joinRoom(roomId, playerId, playerData);
      this.clients.set(ws, { playerId, roomId });

      // Notify new player of room status
      ws.send(JSON.stringify({
        type: 'room_joined',
        data: {
          roomId: room.id,
          players: Array.from(room.players.values()),
          monsters: room.monsters,
          lootBoxes: room.lootBoxes,
          isHost: room.hostId === playerId,
          hostId: room.hostId
        }
      }));

      // Notify other players in room
      this.broadcastToRoom(roomId, {
        type: 'player_joined',
        data: {
          player: room.players.get(playerId)
        }
      }, playerId);

      console.log(`✅ Player ${playerId} joined room ${roomId}`);
    } catch (error) {
      console.error(`❌ Failed to join room ${roomId}:`, error.message);
      ws.send(JSON.stringify({ type: 'error', data: { message: error.message } }));
    }
  }

  handleLeaveRoom(ws) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { playerId, roomId } = client;
    roomService.leaveRoom(playerId);

    // Notify other players in room
    this.broadcastToRoom(roomId, {
      type: 'player_left',
      data: { playerId }
    });

    this.clients.delete(ws);
    console.log(`✅ Player ${playerId} left room ${roomId}`);
  }

  handleDisconnect(ws) {
    const client = this.clients.get(ws);
    
    if (client) {
      const { playerId, roomId } = client;
      roomService.leaveRoom(playerId);

      // Notify other players in room
      this.broadcastToRoom(roomId, {
        type: 'player_disconnected',
        data: { playerId }
      });

      this.clients.delete(ws);
      console.log(`🔌 Player ${playerId} disconnected from room ${roomId}`);
    }
  }

  handleGetPublicRooms(ws) {
    const rooms = roomService.getPublicRooms();
    ws.send(JSON.stringify({
      type: 'public_rooms',
      data: { rooms }
    }));
  }

  handlePlayerMove(ws, data) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { playerId, roomId } = client;
    const { position, direction, isMoving } = data;

    roomService.updatePlayerPosition(playerId, position, direction, isMoving);

    // Broadcast to other players in room
    this.broadcastToRoom(roomId, {
      type: 'player_moved',
      data: {
        playerId,
        position,
        direction,
        isMoving
      }
    }, playerId);
  }

  handlePlayerAttack(ws, data) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { roomId } = client;

    // Broadcast attack event to all players in room
    this.broadcastToRoom(roomId, {
      type: 'player_attacked',
      data: data
    });
  }

  handleMonsterUpdate(ws, data) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { roomId, playerId } = client;

    // Only host can update monster status
    if (!roomService.isHost(roomId, playerId)) {
      console.warn(`⚠️ Non-host ${playerId} tried to update monsters`);
      return;
    }

    const { monsters } = data;
    roomService.syncGameState(roomId, { monsters });

    // Broadcast monster status to other players in room
    this.broadcastToRoom(roomId, {
      type: 'monsters_updated',
      data: { monsters }
    }, playerId);
  }

  handleGameStateSync(ws, data) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { roomId, playerId } = client;

    // Only host can sync game state
    if (!roomService.isHost(roomId, playerId)) {
      console.warn(`⚠️ Non-host ${playerId} tried to sync game state`);
      return;
    }

    const { gameState } = data;
    roomService.syncGameState(roomId, gameState);

    // Broadcast game state to all players in room
    this.broadcastToRoom(roomId, {
      type: 'game_state_synced',
      data: { gameState }
    }, playerId);
  }

  handleRequestGameState(ws, data) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { roomId } = client;
    const gameState = roomService.getGameState(roomId);

    if (gameState) {
      ws.send(JSON.stringify({
        type: 'game_state_response',
        data: { gameState }
      }));
    }
  }

  handleLootBoxPickup(ws, data) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { roomId, playerId } = client;
    const { lootBoxId } = data;

    const result = roomService.pickupLootBox(roomId, lootBoxId, playerId);

    if (result.success) {
      console.log(`📦 Loot box ${lootBoxId} picked by ${playerId}, broadcasting to room ${roomId}`);
      
      // Broadcast loot box pickup to all players in room (including initiator)
      // Note: Don't exclude initiator, they also need event to remove UI
      this.broadcastToRoom(roomId, {
        type: 'lootbox_picked',
        data: {
          lootBoxId,
          playerId,
          lootBox: result.lootBox
        }
      });
      
      // No need to send separately to initiator, broadcastToRoom already includes everyone
    } else {
      // Notify player of pickup failure
      ws.send(JSON.stringify({
        type: 'lootbox_pickup_failed',
        data: { 
          lootBoxId,
          message: result.message 
        }
      }));
    }
  }

  handleMonsterDamage(ws, data) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { roomId } = client;
    const { monsterId, damage, attackerId } = data;

    // Broadcast monster damaged event
    this.broadcastToRoom(roomId, {
      type: 'monster_damaged',
      data: { monsterId, damage, attackerId }
    });
  }

  handleMonsterDeath(ws, data) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { roomId } = client;
    const { monsterId, killerId, killerName, position } = data;

    console.log(`💀 Monster ${monsterId} killed by ${killerName} in room ${roomId}`);

    // Broadcast monster death event (notify host to spawn loot box)
    this.broadcastToRoom(roomId, {
      type: 'monster_died',
      data: { monsterId, killerId, killerName, position }
    });
  }

  handlePlayerHpUpdate(ws, data) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { playerId, roomId } = client;
    const { hp } = data;

    roomService.updatePlayerHp(playerId, hp);

    // Broadcast HP update to other players in room
    this.broadcastToRoom(roomId, {
      type: 'player_hp_updated',
      data: { playerId, hp }
    }, playerId);
  }

  handleMonsterStateUpdate(ws, data) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { roomId, playerId } = client;

    // Only host can broadcast monster state
    if (!roomService.isHost(roomId, playerId)) {
      console.warn(`⚠️ Non-host ${playerId} tried to update monster state`);
      return;
    }

    const { monsterId, state } = data;

    // Broadcast monster state to other players in room
    this.broadcastToRoom(roomId, {
      type: 'monster_state_updated',
      data: { monsterId, state }
    }, playerId);
  }

  // Broadcast message to all players in room (optionally exclude a player)
  broadcastToRoom(roomId, message, excludePlayerId = null) {
    this.clients.forEach((client, ws) => {
      if (client.roomId === roomId && client.playerId !== excludePlayerId) {
        if (ws.readyState === WS_OPEN) {
          ws.send(JSON.stringify(message));
        }
      }
    });
  }
}

export default new WebSocketService();

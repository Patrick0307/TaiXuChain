// WebSocket 服务
import { WebSocketServer } from 'ws';
import roomService from './roomService.js';

// 修复 WebSocket 常量引用
const WS_OPEN = 1; // WebSocket.OPEN 的值

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

      // 通知新玩家房间状态
      ws.send(JSON.stringify({
        type: 'room_joined',
        data: {
          roomId: room.id,
          players: Array.from(room.players.values()),
          monsters: room.monsters
        }
      }));

      // 通知房间内其他玩家
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

    // 通知房间内其他玩家
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

      // 通知房间内其他玩家
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

    // 广播给房间内其他玩家
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

    // 广播攻击事件给房间内所有玩家
    this.broadcastToRoom(roomId, {
      type: 'player_attacked',
      data: data
    });
  }

  handleMonsterUpdate(ws, data) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { roomId } = client;
    const { monsters } = data;

    roomService.syncMonsters(roomId, monsters);

    // 广播怪物状态给房间内其他玩家
    this.broadcastToRoom(roomId, {
      type: 'monsters_updated',
      data: { monsters }
    }, client.playerId);
  }

  handlePlayerHpUpdate(ws, data) {
    const client = this.clients.get(ws);
    
    if (!client) return;

    const { playerId, roomId } = client;
    const { hp } = data;

    roomService.updatePlayerHp(playerId, hp);

    // 广播HP更新给房间内其他玩家
    this.broadcastToRoom(roomId, {
      type: 'player_hp_updated',
      data: { playerId, hp }
    }, playerId);
  }

  // 广播消息到房间内所有玩家（可选排除某个玩家）
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

// Room management service
import { v4 as uuidv4 } from 'uuid';

class RoomService {
  constructor() {
    this.rooms = new Map(); // roomId -> Room
    this.playerRooms = new Map(); // playerId -> roomId
  }

  // Create new room
  createRoom(hostPlayerId, mapName, isPublic = true) {
    // Generate 8-character uppercase alphanumeric room ID
    const roomId = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
    const room = {
      id: roomId,
      hostId: hostPlayerId, // Room host (host player)
      mapName: mapName,
      isPublic: isPublic,
      players: new Map(), // playerId -> playerData
      monsters: [], // Monster state (managed by host)
      lootBoxes: [], // Loot box state (managed by host)
      gameState: {
        initialized: false,
        lastUpdate: Date.now()
      },
      createdAt: Date.now(),
      maxPlayers: 2 // Limited to 2-player mode
    };

    this.rooms.set(roomId, room);
    console.log(`🏠 Room created: ${roomId} (${isPublic ? 'Public' : 'Private'}) by ${hostPlayerId} (HOST)`);
    
    return room;
  }

  // Join room
  joinRoom(roomId, playerId, playerData) {
    // Ensure room ID is uppercase
    const normalizedRoomId = roomId.toUpperCase();
    const room = this.rooms.get(normalizedRoomId);
    
    if (!room) {
      console.log(`❌ Room not found: ${normalizedRoomId}`);
      console.log(`📋 Available rooms:`, Array.from(this.rooms.keys()));
      throw new Error('Room not found');
    }

    if (room.players.size >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    // Add player to room
    room.players.set(playerId, {
      id: playerId,
      ...playerData,
      position: { x: 0, y: 0 },
      direction: 'down',
      isMoving: false,
      hp: playerData.hp || 100,
      joinedAt: Date.now()
    });

    this.playerRooms.set(playerId, normalizedRoomId);
    
    console.log(`👤 Player ${playerId} joined room ${normalizedRoomId} (${room.players.size}/${room.maxPlayers})`);
    
    return room;
  }

  // Leave room
  leaveRoom(playerId) {
    const roomId = this.playerRooms.get(playerId);
    
    if (!roomId) {
      return null;
    }

    const room = this.rooms.get(roomId);
    
    if (room) {
      room.players.delete(playerId);
      console.log(`👋 Player ${playerId} left room ${roomId}`);

      // If room is empty, delete room
      if (room.players.size === 0) {
        this.rooms.delete(roomId);
        console.log(`🗑️ Room ${roomId} deleted (empty)`);
      }
    }

    this.playerRooms.delete(playerId);
    return roomId;
  }

  // Get room
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  // 获取玩家所在房间
  getPlayerRoom(playerId) {
    const roomId = this.playerRooms.get(playerId);
    return roomId ? this.rooms.get(roomId) : null;
  }

  // 获取所有公开房间
  getPublicRooms() {
    return Array.from(this.rooms.values())
      .filter(room => room.isPublic)
      .map(room => ({
        id: room.id,
        hostId: room.hostId,
        mapName: room.mapName,
        playerCount: room.players.size,
        maxPlayers: room.maxPlayers,
        createdAt: room.createdAt
      }));
  }

  // 更新玩家位置
  updatePlayerPosition(playerId, position, direction, isMoving) {
    const room = this.getPlayerRoom(playerId);
    
    if (!room) {
      return null;
    }

    const player = room.players.get(playerId);
    
    if (player) {
      player.position = position;
      player.direction = direction;
      player.isMoving = isMoving;
    }

    return room;
  }

  // 更新玩家HP
  updatePlayerHp(playerId, hp) {
    const room = this.getPlayerRoom(playerId);
    
    if (!room) {
      return null;
    }

    const player = room.players.get(playerId);
    
    if (player) {
      player.hp = hp;
    }

    return room;
  }

  // 同步游戏状态（由主机调用）
  syncGameState(roomId, gameState) {
    const room = this.rooms.get(roomId);
    
    if (room) {
      room.monsters = gameState.monsters || room.monsters;
      room.lootBoxes = gameState.lootBoxes || room.lootBoxes;
      room.gameState.lastUpdate = Date.now();
      room.gameState.initialized = true;
    }

    return room;
  }

  // 获取游戏状态
  getGameState(roomId) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null;
    }

    return {
      monsters: room.monsters,
      lootBoxes: room.lootBoxes,
      initialized: room.gameState.initialized
    };
  }

  // 检查是否是主机
  isHost(roomId, playerId) {
    const room = this.rooms.get(roomId);
    return room && room.hostId === playerId;
  }

  // 拾取宝箱（归属检查 + 先到先得）
  pickupLootBox(roomId, lootBoxId, playerId) {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    const lootBoxIndex = room.lootBoxes.findIndex(box => box.id === lootBoxId);
    
    if (lootBoxIndex === -1) {
      return { success: false, message: 'Loot box not found' };
    }

    const lootBox = room.lootBoxes[lootBoxIndex];
    
    // 检查归属
    if (lootBox.ownerId && lootBox.ownerId !== playerId) {
      return { 
        success: false, 
        message: `This loot box belongs to ${lootBox.ownerName || 'another player'}` 
      };
    }
    
    // 检查是否已被拾取
    if (lootBox.pickedBy) {
      return { success: false, message: 'Already picked up' };
    }

    // 标记为已拾取
    lootBox.pickedBy = playerId;
    lootBox.pickedAt = Date.now();

    // 从房间中移除宝箱（已拾取的宝箱不再需要保留）
    room.lootBoxes.splice(lootBoxIndex, 1);
    console.log(`📦 Removed loot box ${lootBoxId} from room ${roomId}, remaining: ${room.lootBoxes.length}`);

    return { success: true, lootBox };
  }
}

export default new RoomService();

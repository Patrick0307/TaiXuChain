import { useState, useEffect } from 'react'
import websocketClient from '../services/websocketClient'
import '../css/RoomSelection.css'

function RoomSelection({ character, onRoomJoined, onBack }) {
  const [mode, setMode] = useState('menu') // 'menu', 'create', 'join', 'public'
  const [roomId, setRoomId] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [publicRooms, setPublicRooms] = useState([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // 连接 WebSocket
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
    
    websocketClient.connect(wsUrl).catch(err => {
      console.error('Failed to connect WebSocket:', err)
      setError('无法连接到服务器')
    })

    // 监听房间创建成功
    websocketClient.on('room_created', (data) => {
      console.log('Room created:', data)
      setIsConnecting(false)
      // 创建者就是主机
      onRoomJoined(data.roomId, data.mapName, [], true, null, []) // players, isHost, hostId, monsters
    })

    // 监听加入房间成功
    websocketClient.on('room_joined', (data) => {
      console.log('Room joined:', data)
      console.log('Players in room:', data.players)
      console.log('Is host:', data.isHost)
      console.log('Monsters from server:', data.monsters?.length || 0)
      setIsConnecting(false)
      onRoomJoined(data.roomId, 'forest', data.players, data.isHost, data.hostId, data.monsters || [])
    })

    // 监听公开房间列表
    websocketClient.on('public_rooms', (data) => {
      setPublicRooms(data.rooms)
    })

    // 监听错误
    websocketClient.on('error', (data) => {
      setError(data?.message || '发生未知错误')
      setIsConnecting(false)
    })

    return () => {
      // 清理监听器
      websocketClient.off('room_created')
      websocketClient.off('room_joined')
      websocketClient.off('public_rooms')
      websocketClient.off('error')
    }
  }, [onRoomJoined])

  const handleCreateRoom = () => {
    if (isConnecting) return

    setIsConnecting(true)
    setError('')

    const playerId = window.currentWalletAddress || character.owner
    const playerData = {
      name: character.name,
      classId: character.id,
      hp: character.hp,
      attack: character.attack
    }

    websocketClient.createRoom(playerId, playerData, 'forest', isPublic)
  }

  const handleJoinRoom = (targetRoomId) => {
    if (isConnecting) return

    const finalRoomId = targetRoomId || roomId.trim()
    
    if (!finalRoomId) {
      setError('请输入房间号')
      return
    }

    setIsConnecting(true)
    setError('')

    const playerId = window.currentWalletAddress || character.owner
    const playerData = {
      name: character.name,
      classId: character.id,
      hp: character.hp,
      attack: character.attack
    }

    console.log('🔍 Joining room:', finalRoomId, 'as player:', playerId)
    websocketClient.joinRoom(finalRoomId, playerId, playerData)
  }

  const handleShowPublicRooms = () => {
    setMode('public')
    websocketClient.getPublicRooms()
  }

  const renderMenu = () => (
    <div className="room-menu">
      <h2>🎮 多人游戏</h2>
      
      <div className="menu-buttons">
        <button 
          className="menu-button create"
          onClick={() => setMode('create')}
        >
          <span className="button-icon">🏠</span>
          <span className="button-text">创建房间</span>
        </button>

        <button 
          className="menu-button join"
          onClick={() => setMode('join')}
        >
          <span className="button-icon">🔑</span>
          <span className="button-text">加入房间</span>
        </button>

        <button 
          className="menu-button public"
          onClick={handleShowPublicRooms}
        >
          <span className="button-icon">🌐</span>
          <span className="button-text">公开房间</span>
        </button>

        <button 
          className="menu-button back"
          onClick={onBack}
        >
          <span className="button-icon">⬅️</span>
          <span className="button-text">返回</span>
        </button>
      </div>
    </div>
  )

  const renderCreate = () => (
    <div className="room-create">
      <h2>🏠 创建房间</h2>
      
      <div className="create-options">
        <div className="option-group">
          <label>房间类型：</label>
          <div className="radio-group">
            <label className="radio-label">
              <input 
                type="radio" 
                checked={isPublic} 
                onChange={() => setIsPublic(true)}
              />
              <span>公开（所有人可见）</span>
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                checked={!isPublic} 
                onChange={() => setIsPublic(false)}
              />
              <span>私密（需要房间号）</span>
            </label>
          </div>
        </div>

        <div className="option-info">
          <p>地图：🌲 森林地图</p>
          <p>角色：{character.name} ({character.id})</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="action-buttons">
        <button 
          className="action-button primary"
          onClick={handleCreateRoom}
          disabled={isConnecting}
        >
          {isConnecting ? '创建中...' : '创建并进入'}
        </button>
        <button 
          className="action-button secondary"
          onClick={() => setMode('menu')}
          disabled={isConnecting}
        >
          返回
        </button>
      </div>
    </div>
  )

  const renderJoin = () => (
    <div className="room-join">
      <h2>🔑 加入房间</h2>
      
      <div className="join-form">
        <label>房间号：</label>
        <input 
          type="text"
          className="room-input"
          placeholder="输入8位房间号"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          maxLength={8}
          disabled={isConnecting}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="action-buttons">
        <button 
          className="action-button primary"
          onClick={() => handleJoinRoom()}
          disabled={isConnecting || !roomId.trim()}
        >
          {isConnecting ? '加入中...' : '加入房间'}
        </button>
        <button 
          className="action-button secondary"
          onClick={() => setMode('menu')}
          disabled={isConnecting}
        >
          返回
        </button>
      </div>
    </div>
  )

  const renderPublic = () => (
    <div className="room-public">
      <h2>🌐 公开房间</h2>
      
      <div className="rooms-list">
        {publicRooms.length === 0 ? (
          <div className="no-rooms">
            <p>暂无公开房间</p>
            <p>创建一个新房间吧！</p>
          </div>
        ) : (
          publicRooms.map(room => (
            <div key={room.id} className="room-card">
              <div className="room-info">
                <div className="room-id">房间号: {room.id}</div>
                <div className="room-map">地图: 🌲 {room.mapName}</div>
                <div className="room-players">
                  玩家: {room.playerCount}/{room.maxPlayers}
                </div>
              </div>
              <button 
                className="join-button"
                onClick={() => handleJoinRoom(room.id)}
                disabled={isConnecting || room.playerCount >= room.maxPlayers}
              >
                {room.playerCount >= room.maxPlayers ? '已满' : '加入'}
              </button>
            </div>
          ))
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="action-buttons">
        <button 
          className="action-button secondary"
          onClick={() => setMode('menu')}
          disabled={isConnecting}
        >
          返回
        </button>
      </div>
    </div>
  )

  return (
    <div className="room-selection-container">
      <div className="room-selection-content">
        {mode === 'menu' && renderMenu()}
        {mode === 'create' && renderCreate()}
        {mode === 'join' && renderJoin()}
        {mode === 'public' && renderPublic()}
      </div>
    </div>
  )
}

export default RoomSelection

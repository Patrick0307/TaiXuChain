import { useState } from 'react'
import '../css/MapSelection.css'
import AnimatedCharacter from './AnimatedCharacter'
import RoomSelection from './RoomSelection'

function MapSelection({ character, onMapSelected }) {
  const [selectedMap, setSelectedMap] = useState(null)
  const [gameMode, setGameMode] = useState(null) // 'single' or 'multi'
  const [showRoomSelection, setShowRoomSelection] = useState(false)
  const [roomData, setRoomData] = useState(null) // 存储房间数据

  const maps = [
    {
      id: 'forest',
      name: 'Misty Forest',
      description: 'Ancient forest filled with unknown dangers',
      difficulty: 'Easy',
      icon: '🌲'
    },
    {
      id: 'mountain',
      name: 'Snow Peak Mountains',
      description: 'Cold highlands testing your survival skills',
      difficulty: 'Medium',
      icon: '⛰️'
    },
    {
      id: 'desert',
      name: 'Scorching Desert',
      description: 'Hot desert ruins hiding ancient secrets',
      difficulty: 'Hard',
      icon: '🏜️'
    }
  ]

  const handleMapClick = (map) => {
    setSelectedMap(map.id)
  }

  const handleConfirm = () => {
    if (selectedMap && gameMode) {
      if (gameMode === 'single') {
        // 单人模式直接进入地图
        onMapSelected(selectedMap, null)
      } else {
        // 多人模式显示房间选择
        setShowRoomSelection(true)
      }
    }
  }

  const handleRoomJoined = (roomId, mapName, players, isHost, hostId, monsters) => {
    // 加入房间后进入地图，传递房间数据
    setRoomData({ roomId, players, isHost, hostId, monsters })
    onMapSelected(mapName, roomId, players, isHost, hostId, monsters)
  }

  // 如果显示房间选择界面
  if (showRoomSelection) {
    return (
      <RoomSelection 
        character={character}
        onRoomJoined={handleRoomJoined}
        onBack={() => setShowRoomSelection(false)}
      />
    )
  }

  return (
    <div className="map-selection">
      <h1 className="map-title">Choose Your Adventure</h1>
      
      <div className="character-info-bar">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '30px',
          justifyContent: 'center'
        }}>
          <div style={{ 
            background: 
              `repeating-linear-gradient(
                45deg,
                rgba(0, 0, 0, 0.3) 0px,
                rgba(0, 0, 0, 0.3) 10px,
                rgba(0, 0, 0, 0.4) 10px,
                rgba(0, 0, 0, 0.4) 20px
              )`,
            padding: '15px',
            border: '4px solid #4a4a4a',
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)'
          }}>
            <AnimatedCharacter character={character} scale={1.5} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ 
              fontSize: '1.2rem', 
              color: '#ffd700',
              textShadow: '3px 3px 0 #8b4513, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              marginBottom: '12px',
              letterSpacing: '2px'
            }}>
              ⚔️ {character.name}
            </div>
            <div style={{ 
              fontSize: '0.7rem', 
              color: '#e0e0e0',
              textShadow: '2px 2px 0 #000',
              marginBottom: '8px',
              letterSpacing: '1px'
            }}>
              {character.class}
            </div>
            {character.playerObjectId && (
              <div style={{ 
                fontSize: '0.5rem', 
                color: '#8b7355',
                textShadow: '1px 1px 0 #000',
                marginTop: '8px',
                letterSpacing: '0.5px',
                fontFamily: 'monospace'
              }}>
                ID: {character.playerObjectId.slice(0, 8)}...{character.playerObjectId.slice(-6)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 游戏模式选择 */}
      <div className="game-mode-selection">
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#ffd700' }}>选择游戏模式</h2>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button
            className={`mode-button ${gameMode === 'single' ? 'selected' : ''}`}
            onClick={() => setGameMode('single')}
          >
            <span style={{ fontSize: '2rem' }}>🎮</span>
            <div>单人模式</div>
          </button>
          <button
            className={`mode-button ${gameMode === 'multi' ? 'selected' : ''}`}
            onClick={() => setGameMode('multi')}
          >
            <span style={{ fontSize: '2rem' }}>👥</span>
            <div>多人模式</div>
          </button>
        </div>
      </div>

      <div className="maps-container">
        {maps.map((map) => (
          <div
            key={map.id}
            className={`map-card ${selectedMap === map.id ? 'selected' : ''}`}
            onClick={() => handleMapClick(map)}
          >
            <div className="map-icon">{map.icon}</div>
            <h3 className="map-name">{map.name}</h3>
            <p className="map-description">{map.description}</p>
            <div className="map-difficulty">
              <span className={`difficulty-badge ${map.difficulty}`}>
                {map.difficulty}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="map-actions">
        <button 
          className="confirm-button"
          onClick={handleConfirm}
          disabled={!selectedMap || !gameMode}
        >
          {selectedMap && gameMode ? (gameMode === 'multi' ? '选择房间 →' : '进入地图 →') : '请选择模式和地图'}
        </button>
      </div>
    </div>
  )
}

export default MapSelection

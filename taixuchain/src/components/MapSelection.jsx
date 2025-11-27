import { useState } from 'react'
import '../css/MapSelection.css'
import AnimatedCharacter from './AnimatedCharacter'
import RoomSelection from './RoomSelection'

function MapSelection({ character, onMapSelected }) {
  const [selectedMap, setSelectedMap] = useState(null)
  const [gameMode, setGameMode] = useState(null)
  const [showRoomSelection, setShowRoomSelection] = useState(false)
  const [roomData, setRoomData] = useState(null)

  const maps = [
    {
      id: 'forest',
      name: 'Misty Forest',
      description: 'Ancient forest filled with unknown dangers',
      difficulty: 'EASY',
      icon: '🌲',
      color: '#2d5016',
      locked: false,
      rewards: {
        swords: ['Iron Sword', 'Azure Edge Sword', 'Dragon Roar Sword'],
        bows: ['Hunter Bow', 'Swift Wind Bow', 'Cloud Piercer Bow'],
        staves: ['Wooden Stave', 'Starlight Stave', 'Primordial Stave']
      },
      enemies: [
        'Verdant Guardian',
        'Shadow Stalker'
      ]
    },
    {
      id: 'mountain',
      name: 'Snow Peak',
      description: 'Cold highlands testing your survival skills',
      difficulty: 'MEDIUM',
      icon: '⛰️',
      color: '#5a4a00',
      locked: true,
      unlockRequirement: 'Comming Soon',
      rewards: {
        swords: ['Iron Sword', 'Azure Edge Sword', 'Dragon Roar Sword'],
        bows: ['Hunter Bow', 'Swift Wind Bow', 'Cloud Piercer Bow'],
        staves: ['Wooden Stave', 'Starlight Stave', 'Primordial Stave']
      },
      enemies: [
        'Frost Behemoth',
        'Ice Wraith'
      ]
    },
    {
      id: 'desert',
      name: 'Scorching Desert',
      description: 'Hot desert ruins hiding ancient secrets',
      difficulty: 'HARD',
      icon: '🏜️',
      color: '#5a1a00',
      locked: true,
      unlockRequirement: 'Comming Soon',
      rewards: {
        swords: ['Iron Sword', 'Azure Edge Sword', 'Dragon Roar Sword'],
        bows: ['Hunter Bow', 'Swift Wind Bow', 'Cloud Piercer Bow'],
        staves: ['Wooden Stave', 'Starlight Stave', 'Primordial Stave']
      },
      enemies: [
        'Sandstorm Titan',
        'Dune Phantom'
      ]
    }
  ]

  const handleMapClick = (map) => {
    if (!map.locked) {
      setSelectedMap(map.id)
    }
  }

  const selectedMapData = maps.find(m => m.id === selectedMap)

  const handleConfirm = () => {
    if (selectedMap && gameMode) {
      if (gameMode === 'single') {
        onMapSelected(selectedMap, null)
      } else {
        setShowRoomSelection(true)
      }
    }
  }

  const handleRoomJoined = (roomId, mapName, players, isHost, hostId, monsters) => {
    setRoomData({ roomId, players, isHost, hostId, monsters })
    onMapSelected(mapName, roomId, players, isHost, hostId, monsters)
  }

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
    <div className="map-selection-new">
      {/* 马赛克背景层 */}
      <div className="mosaic-bg"></div>
      <div className="mosaic-overlay"></div>
      
      {/* 魔法圆环 */}
      <div className="magic-circle"></div>
      
      {/* 粒子特效容器 */}
      <div className="particles-container">
        {/* 星空 */}
        {[...Array(50)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
        
        {/* 金色粒子 */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${8 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
        
        {/* 能量球 */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="energy-orb"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--orbit-x': `${(Math.random() - 0.5) * 400}px`,
              '--orbit-y': `${(Math.random() - 0.5) * 400}px`,
              animationDuration: `${6 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
        
        {/* 流星 */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`meteor-${i}`}
            className="meteor"
            style={{
              left: `${Math.random() * 50}%`,
              top: `${Math.random() * 50}%`,
              animationDuration: `${1 + Math.random()}s`,
              animationDelay: `${Math.random() * 10}s`
            }}
          />
        ))}
        
        {/* 光束 */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`beam-${i}`}
            className="light-beam"
            style={{
              left: `${20 + i * 15}%`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>
      
      {/* 顶部标题区 */}
      <div className="title-section">
        <div className="title-decoration-top"></div>
        <h1 className="main-title">
          <span className="title-line"></span>
          <span className="title-text">CHOOSE YOUR ADVENTURE</span>
          <span className="title-line"></span>
        </h1>
        <div className="title-decoration-bottom"></div>
      </div>

      {/* 左侧栏 */}
      <div className="left-sidebar">
        {/* 角色信息卡片 */}
        <div className="character-card">
          <div className="card-corner tl"></div>
          <div className="card-corner tr"></div>
          <div className="card-corner bl"></div>
          <div className="card-corner br"></div>
          
          <div className="character-display">
            <div className="character-avatar">
              <AnimatedCharacter character={character} scale={1.5} />
            </div>
            <div className="character-details">
              <div className="character-name">{character.name}</div>
              <div className="character-class">{character.class}</div>
              {character.playerObjectId && (
                <div className="character-id">
                  ID: {character.playerObjectId.slice(0, 8)}...{character.playerObjectId.slice(-6)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 游戏模式选择 */}
        <div className="mode-section">
          <div className="section-label">GAME MODE</div>
          <div className="mode-grid">
            <div 
              className={`mode-tile ${gameMode === 'single' ? 'active' : ''}`}
              onClick={() => setGameMode('single')}
            >
              <div className="mode-icon">🎮</div>
              <div className="mode-name">SOLO</div>
              <div className="mode-pixels"></div>
            </div>
            <div 
              className={`mode-tile ${gameMode === 'multi' ? 'active' : ''}`}
              onClick={() => setGameMode('multi')}
            >
              <div className="mode-icon">👥</div>
              <div className="mode-name">MULTIPLAYER</div>
              <div className="mode-pixels"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧主内容区 */}
      <div className="right-content">
        {/* 地图选择区 */}
        <div className="maps-section">
          <div className="maps-grid">
            {maps.map((map, index) => (
              <div
                key={map.id}
                className={`map-tile ${selectedMap === map.id ? 'active' : ''} ${map.locked ? 'locked' : ''}`}
                onClick={() => handleMapClick(map)}
                style={{ '--map-color': map.color }}
              >
                <div className="map-tile-bg"></div>
                <div className="map-tile-border"></div>
                
                {map.locked && (
                  <div className="lock-overlay">
                    <div className="lock-icon">🔒</div>
                    <div className="lock-chains">
                      <div className="chain chain-1">⛓️</div>
                      <div className="chain chain-2">⛓️</div>
                    </div>
                    <div className="unlock-text">{map.unlockRequirement}</div>
                  </div>
                )}
                
                <div className="map-icon-large" style={{ opacity: map.locked ? 0.3 : 1 }}>{map.icon}</div>
                <div className="map-name" style={{ opacity: map.locked ? 0.5 : 1 }}>{map.name}</div>
                <div className="map-desc" style={{ opacity: map.locked ? 0.5 : 1 }}>{map.description}</div>
                
                <div className="map-difficulty-tag">
                  <span className="difficulty-text">{map.difficulty}</span>
                </div>
                
                <div className="map-pixels"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 地图详情信息区 */}
        {selectedMapData && (
          <div className="map-details">
            <div className="details-header">
              <span className="details-icon">{selectedMapData.icon}</span>
              <span className="details-title">{selectedMapData.name}</span>
            </div>

            <div className="details-grid">
              <div className="details-section">
                <div className="section-title">⚔️ ENEMIES</div>
                <div className="section-list">
                  {selectedMapData.enemies.map((enemy, i) => (
                    <div key={i} className="list-item">• {enemy}</div>
                  ))}
                </div>
              </div>

              <div className="details-section rewards-section">
                <div className="section-title">💎 WEAPON DROPS</div>
                <div className="rewards-columns">
                  <div className="reward-column">
                    <div className="reward-category">⚔️ Swords</div>
                    {selectedMapData.rewards.swords.map((sword, i) => (
                      <div key={i} className="list-item">• {sword}</div>
                    ))}
                  </div>
                  <div className="reward-column">
                    <div className="reward-category">🏹 Bows</div>
                    {selectedMapData.rewards.bows.map((bow, i) => (
                      <div key={i} className="list-item">• {bow}</div>
                    ))}
                  </div>
                  <div className="reward-column">
                    <div className="reward-category">🔮 Staves</div>
                    {selectedMapData.rewards.staves.map((stave, i) => (
                      <div key={i} className="list-item">• {stave}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 确认按钮 */}
      <div className="action-section">
        <button 
          className={`confirm-btn ${(!selectedMap || !gameMode) ? 'disabled' : ''}`}
          onClick={handleConfirm}
          disabled={!selectedMap || !gameMode}
        >
          <span className="btn-bg"></span>
          <span className="btn-text">
            {selectedMap && gameMode 
              ? (gameMode === 'multi' ? '▶ SELECT ROOM' : '▶ ENTER MAP') 
              : 'SELECT MODE & MAP'}
          </span>
          <span className="btn-shine"></span>
        </button>
      </div>
    </div>
  )
}

export default MapSelection

import { useState } from 'react'
import CharacterSelection from './components/CharacterSelection'
import CharacterCustomization from './components/CharacterCustomization'
import CharacterNaming from './components/CharacterNaming'
import MapSelection from './components/MapSelection'
import CharacterWithWeapon from './components/CharacterWithWeapon'
import UIDDisplay from './components/UIDDisplay'
import ForestMap from './components/maps/ForestMap'
import GameLoading from './components/GameLoading'
import { checkExistingPlayer } from './utils/suiClient'

function App() {
  const [walletAddress, setWalletAddress] = useState(null)
  const [gameStage, setGameStage] = useState('wallet') // wallet, selection, customization, naming, mapSelection, game
  const [selectedClass, setSelectedClass] = useState(null)
  const [customizedCharacter, setCustomizedCharacter] = useState(null)
  const [finalCharacter, setFinalCharacter] = useState(null)
  const [selectedMap, setSelectedMap] = useState(null)
  const [roomId, setRoomId] = useState(null) // 多人房间ID
  const [roomPlayers, setRoomPlayers] = useState([]) // 房间内的玩家列表
  const [isHost, setIsHost] = useState(false) // 是否是主机
  const [hostId, setHostId] = useState(null) // 主机ID
  const [initialMonsters, setInitialMonsters] = useState([]) // 初始怪物列表
  const [isCheckingPlayer, setIsCheckingPlayer] = useState(false)

  const handleWalletConnected = async (address) => {
    setWalletAddress(address)
    setIsCheckingPlayer(true)
    
    try {
      // 检查钱包是否已有角色
      const existingPlayer = await checkExistingPlayer(address)
      
      if (existingPlayer) {
        // 已有角色，直接加载角色信息并跳到地图选择
        console.log('🎮 Loading existing character...')
        
        // 将后端返回的数据转换为前端格式
        const classMap = {
          1: { id: 'mage', name: 'Mage' },
          2: { id: 'warrior', name: 'Warrior' },
          3: { id: 'archer', name: 'Archer' }
        }
        
        // 计算默认属性（如果是旧角色没有这些字段）
        const classId = existingPlayer.class
        const level = existingPlayer.level
        
        // 职业成长系数（与合约保持一致）
        const getDefaultStats = (classId, level) => {
          const statsMap = {
            1: { hpPerLevel: 350, atkPerLevel: 40 },  // Mage
            2: { hpPerLevel: 500, atkPerLevel: 30 },  // Warrior
            3: { hpPerLevel: 400, atkPerLevel: 35 },  // Archer
          }
          const stats = statsMap[classId] || statsMap[1]
          return {
            hp: stats.hpPerLevel * level,
            max_hp: stats.hpPerLevel * level,
            attack: stats.atkPerLevel * level
          }
        }
        
        const defaultStats = getDefaultStats(classId, level)
        
        const characterData = {
          id: classMap[existingPlayer.class].id,
          name: existingPlayer.name,
          class: classMap[existingPlayer.class].name,
          level: existingPlayer.level,
          exp: existingPlayer.exp,
          hp: existingPlayer.hp || defaultStats.hp,
          max_hp: existingPlayer.max_hp || defaultStats.max_hp,
          attack: existingPlayer.attack || defaultStats.attack,
          playerObjectId: existingPlayer.objectId,
          customization: existingPlayer.customization
        }
        
        setFinalCharacter(characterData)
        setGameStage('mapSelection')
      } else {
        // 没有角色，进入角色选择阶段
        console.log('ℹ️ No existing character, entering selection stage...')
        setGameStage('selection')
      }
    } catch (error) {
      console.error('Error checking existing player:', error)
      // 出错时也进入角色选择阶段
      setGameStage('selection')
    } finally {
      setIsCheckingPlayer(false)
    }
  }

  const handleCharacterSelected = (classData) => {
    setSelectedClass(classData)
    setGameStage('customization')
  }
  
  const handleWalletRegistrationSuccess = () => {
    // 钱包注册成功后，从 wallet 阶段进入 selection 阶段
    setGameStage('selection')
  }

  const handleCustomizationComplete = (character) => {
    setCustomizedCharacter(character)
    setGameStage('naming')
  }

  const handleNamingComplete = (character) => {
    setFinalCharacter(character)
    setGameStage('mapSelection')
    console.log('Character registered to blockchain:', character)
  }

  const handleMapSelected = (mapId, roomIdParam = null, playersParam = [], isHostParam = false, hostIdParam = null, monstersParam = []) => {
    setSelectedMap(mapId)
    setRoomId(roomIdParam)
    setRoomPlayers(playersParam)
    setIsHost(isHostParam)
    setHostId(hostIdParam)
    setInitialMonsters(monstersParam)
    setGameStage('game')
    console.log('Selected map:', mapId, roomIdParam ? `(Room: ${roomIdParam}, Players: ${playersParam.length}, Host: ${isHostParam}, Monsters: ${monstersParam.length})` : '(Single Player)')
  }

  const handleExitMap = () => {
    setSelectedMap(null)
    setRoomId(null)
    setRoomPlayers([])
    setIsHost(false)
    setHostId(null)
    setInitialMonsters([])
    setGameStage('mapSelection')
  }

  const handleBackToSelection = () => {
    setSelectedClass(null)
    setGameStage('wallet')
  }

  const handleBackToCustomization = () => {
    setGameStage('customization')
  }

  return (
    <>
      {isCheckingPlayer && <GameLoading />}
      
      {!isCheckingPlayer && (gameStage === 'wallet' || gameStage === 'selection') && (
        <CharacterSelection 
          onCharacterSelected={handleCharacterSelected}
          onWalletConnected={handleWalletConnected}
          shouldShowSelection={gameStage === 'selection'}
        />
      )}
      
      {!isCheckingPlayer && gameStage === 'customization' && selectedClass && (
        <CharacterCustomization 
          characterClass={selectedClass}
          onCustomizationComplete={handleCustomizationComplete}
          onBack={handleBackToSelection}
        />
      )}
      
      {!isCheckingPlayer && gameStage === 'naming' && customizedCharacter && (
        <CharacterNaming 
          character={customizedCharacter}
          onNamingComplete={handleNamingComplete}
          onBack={handleBackToCustomization}
        />
      )}
      
      {!isCheckingPlayer && gameStage === 'mapSelection' && finalCharacter && (
        <MapSelection 
          character={finalCharacter}
          onMapSelected={handleMapSelected}
        />
      )}
      
      {!isCheckingPlayer && gameStage === 'game' && finalCharacter && selectedMap && (
        <>
          {selectedMap === 'forest' && (
            <ForestMap 
              character={finalCharacter} 
              onExit={handleExitMap} 
              roomId={roomId} 
              initialPlayers={roomPlayers}
              isHostProp={isHost}
              hostIdProp={hostId}
              initialMonstersProp={initialMonsters}
            />
          )}
          {selectedMap !== 'forest' && (
            <div style={{ 
              width: '100%', 
              height: '100vh', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
              color: 'white',
              gap: '30px'
            }}>
              <h1>Welcome, {finalCharacter.name}!</h1>
              <h2>Map: {selectedMap}</h2>
              <p style={{ fontSize: '1rem', opacity: 0.7 }}>
                🚧 This map is under construction...
              </p>
              <button 
                onClick={handleExitMap}
                style={{
                  padding: '12px 24px',
                  background: '#4169E1',
                  color: 'white',
                  border: '2px solid #FFF',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ← Back to Map Selection
              </button>
            </div>
          )}
        </>
      )}
      
      <UIDDisplay walletAddress={walletAddress} />
    </>
  )
}

export default App

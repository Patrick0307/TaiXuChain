import { useState, useEffect } from 'react'
import CharacterSelection from './components/CharacterSelection'
import CharacterCustomization from './components/CharacterCustomization'
import CharacterNaming from './components/CharacterNaming'
import MapSelection from './components/MapSelection'
import CharacterWithWeapon from './components/CharacterWithWeapon'
import UIDDisplay from './components/UIDDisplay'
import ForestMap from './components/maps/ForestMap'
import GameLoading from './components/GameLoading'
import { NotificationContainer } from './components/Notification'
import { AlertContainer } from './components/AlertDialog'
import { checkExistingPlayer } from './utils/suiClient'
import soundManager from './utils/soundManager'

function App() {
  const [walletAddress, setWalletAddress] = useState(null)
  const [gameStage, setGameStage] = useState('wallet') // wallet, selection, customization, naming, mapSelection, game
  const [selectedClass, setSelectedClass] = useState(null)
  const [customizedCharacter, setCustomizedCharacter] = useState(null)
  const [finalCharacter, setFinalCharacter] = useState(null)
  const [selectedMap, setSelectedMap] = useState(null)
  const [roomId, setRoomId] = useState(null) // Multiplayer room ID
  const [roomPlayers, setRoomPlayers] = useState([]) // List of players in room
  const [isHost, setIsHost] = useState(false) // Whether is host
  const [hostId, setHostId] = useState(null) // Host ID
  const [initialMonsters, setInitialMonsters] = useState([]) // Initial monster list
  const [isCheckingPlayer, setIsCheckingPlayer] = useState(false)

  // Play overall background music on app load
  useEffect(() => {
    // Reset isInMap flag on app load (in case of page refresh)
    soundManager.isInMap = false
    soundManager.playOverallBGM(0.1) // Volume set to 10%
    
    // Don't stop overall BGM on cleanup - it should keep playing
    // Only stop when actually leaving the app (which we can't detect reliably)
  }, [])

  // Add global click sound effect and try to play pending BGM
  useEffect(() => {
    const handleClick = () => {
      // Try to play pending overall BGM on user interaction (do this first!)
      soundManager.tryPlayPendingOverallBGM()
      // Then play click sound
      soundManager.play('click', 0.3) // Volume set to 30%
    }

    // Listen to all click events
    document.addEventListener('click', handleClick)

    // Cleanup function
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])

  const handleWalletConnected = async (address) => {
    setWalletAddress(address)
    setIsCheckingPlayer(true)
    
    try {
      // Check if wallet already has a character
      const existingPlayer = await checkExistingPlayer(address)
      
      if (existingPlayer) {
        // Has character, directly load character info and jump to map selection
        console.log('🎮 Loading existing character...')
        
        // Convert backend data to frontend format
        const classMap = {
          1: { id: 'mage', name: 'Mage' },
          2: { id: 'warrior', name: 'Warrior' },
          3: { id: 'archer', name: 'Archer' }
        }
        
        // Calculate default stats (if old character doesn't have these fields)
        const classId = existingPlayer.class
        const level = existingPlayer.level
        
        // Class growth coefficients (consistent with contract)
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
        // No character, enter character selection stage
        console.log('ℹ️ No existing character, entering selection stage...')
        setGameStage('selection')
      }
    } catch (error) {
      console.error('Error checking existing player:', error)
      // On error, also enter character selection stage
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
    // After wallet registration success, enter selection stage from wallet stage
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
      <NotificationContainer />
      <AlertContainer />
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

import { useState } from 'react'
import BackgroundStory from './components/BackgroundStory'
import CharacterSelection from './components/CharacterSelection'
import CharacterCustomization from './components/CharacterCustomization'
import CharacterNaming from './components/CharacterNaming'
import MapSelection from './components/MapSelection'
import CharacterWithWeapon from './components/CharacterWithWeapon'
import UIDDisplay from './components/UIDDisplay'
import { checkExistingPlayer } from './utils/suiClient'

function App() {
  const [walletAddress, setWalletAddress] = useState(null)
  const [gameStage, setGameStage] = useState('story') // story, selection, customization, naming, mapSelection, game
  const [selectedClass, setSelectedClass] = useState(null)
  const [customizedCharacter, setCustomizedCharacter] = useState(null)
  const [finalCharacter, setFinalCharacter] = useState(null)
  const [selectedMap, setSelectedMap] = useState(null)
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
        
        const characterData = {
          id: classMap[existingPlayer.class].id,
          name: existingPlayer.name,
          class: classMap[existingPlayer.class].name,
          level: existingPlayer.level,
          exp: existingPlayer.exp,
          playerObjectId: existingPlayer.objectId,
          customization: existingPlayer.customization
        }
        
        setFinalCharacter(characterData)
        setGameStage('mapSelection')
      } else {
        // 没有角色，进入角色创建流程
        console.log('ℹ️ No existing character, starting character creation...')
        setGameStage('selection')
      }
    } catch (error) {
      console.error('Error checking existing player:', error)
      // 出错时也进入角色创建流程
      setGameStage('selection')
    } finally {
      setIsCheckingPlayer(false)
    }
  }

  const handleCharacterSelected = (classData) => {
    setSelectedClass(classData)
    setGameStage('customization')
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

  const handleMapSelected = (mapId) => {
    setSelectedMap(mapId)
    setGameStage('game')
    console.log('Selected map:', mapId)
  }

  const handleBackToSelection = () => {
    setSelectedClass(null)
    setGameStage('selection')
  }

  const handleBackToCustomization = () => {
    setGameStage('customization')
  }

  return (
    <>
      {isCheckingPlayer && (
        <div style={{ 
          width: '100%', 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
          color: 'white',
          gap: '20px'
        }}>
          <div style={{ fontSize: '1.5rem' }}>🔍 Checking for existing character...</div>
          <div style={{ fontSize: '1rem', opacity: 0.7 }}>Please wait...</div>
        </div>
      )}
      
      {!isCheckingPlayer && gameStage === 'story' && (
        <BackgroundStory onWalletConnected={handleWalletConnected} />
      )}
      
      {!isCheckingPlayer && gameStage === 'selection' && (
        <CharacterSelection onCharacterSelected={handleCharacterSelected} />
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
          
          {finalCharacter.playerObjectId && (
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: '20px', 
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                ✅ Character registered on blockchain
              </p>
              <p style={{ fontSize: '0.8rem', opacity: 0.6, wordBreak: 'break-all' }}>
                Player ID: {finalCharacter.playerObjectId}
              </p>
              {finalCharacter.txDigest && (
                <p style={{ fontSize: '0.8rem', opacity: 0.6, wordBreak: 'break-all' }}>
                  Transaction Hash: {finalCharacter.txDigest}
                </p>
              )}
            </div>
          )}
          
          {/* Example: Character with weapon in game */}
          <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <CharacterWithWeapon 
                character={finalCharacter} 
                weaponId={null}
                size="medium"
              />
              <p style={{ fontSize: '1rem', marginTop: '10px' }}>No Weapon</p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <CharacterWithWeapon 
                character={finalCharacter} 
                weaponId="sword_01"
                size="medium"
              />
              <p style={{ fontSize: '1rem', marginTop: '10px' }}>With Sword</p>
            </div>
          </div>
          
          <p style={{ fontSize: '1rem', opacity: 0.7, marginTop: '20px' }}>
            💡 Game in progress...
          </p>
        </div>
      )}
      
      <UIDDisplay walletAddress={walletAddress} />
    </>
  )
}

export default App

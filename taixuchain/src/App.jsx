import { useState } from 'react'
import BackgroundStory from './components/BackgroundStory'
import CharacterSelection from './components/CharacterSelection'
import CharacterCustomization from './components/CharacterCustomization'
import CharacterNaming from './components/CharacterNaming'
import MapSelection from './components/MapSelection'
import CharacterWithWeapon from './components/CharacterWithWeapon'
import UIDDisplay from './components/UIDDisplay'

function App() {
  const [walletAddress, setWalletAddress] = useState(null)
  const [gameStage, setGameStage] = useState('story') // story, selection, customization, naming, mapSelection, game
  const [selectedClass, setSelectedClass] = useState(null)
  const [customizedCharacter, setCustomizedCharacter] = useState(null)
  const [finalCharacter, setFinalCharacter] = useState(null)
  const [selectedMap, setSelectedMap] = useState(null)

  const handleWalletConnected = (address) => {
    setWalletAddress(address)
    setGameStage('selection')
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
      {gameStage === 'story' && (
        <BackgroundStory onWalletConnected={handleWalletConnected} />
      )}
      
      {gameStage === 'selection' && (
        <CharacterSelection onCharacterSelected={handleCharacterSelected} />
      )}
      
      {gameStage === 'customization' && selectedClass && (
        <CharacterCustomization 
          characterClass={selectedClass}
          onCustomizationComplete={handleCustomizationComplete}
          onBack={handleBackToSelection}
        />
      )}
      
      {gameStage === 'naming' && customizedCharacter && (
        <CharacterNaming 
          character={customizedCharacter}
          onNamingComplete={handleNamingComplete}
          onBack={handleBackToCustomization}
        />
      )}
      
      {gameStage === 'mapSelection' && finalCharacter && (
        <MapSelection 
          character={finalCharacter}
          onMapSelected={handleMapSelected}
        />
      )}
      
      {gameStage === 'game' && finalCharacter && selectedMap && (
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

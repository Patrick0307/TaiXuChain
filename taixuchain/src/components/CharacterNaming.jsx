import { useState } from 'react'
import '../css/CharacterNaming.css'
import AnimatedCharacter from './AnimatedCharacter'
import { createPlayerOnChain } from '../utils/suiClient'

function CharacterNaming({ character, onNamingComplete, onBack }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const handleNameChange = (e) => {
    const value = e.target.value
    setName(value)
    setError('')
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a name')
      return
    }
    
    if (name.length < 3) {
      setError('Name must be at least 3 characters')
      return
    }
    
    if (name.length > 20) {
      setError('Name must be less than 20 characters')
      return
    }

    setIsRegistering(true)
    setError('')

    try {
      // Get Sui wallet
      if (!window.suiWallet) {
        throw new Error('Please connect your wallet first')
      }

      // Register to blockchain
      console.log('Registering character to blockchain...')
      console.log('Character customization:', character.customization)
      const result = await createPlayerOnChain(
        name.trim(),
        character.nameEn, // className (Mage, Warrior, Archer)
        window.suiWallet,
        character.customization // 传递角色自定义数据
      )

      console.log('Registration successful!', result)

      // 提取玩家对象 ID
      const playerObjectId = result.effects?.created?.[0]?.reference?.objectId

      onNamingComplete({
        ...character,
        name: name.trim(),
        playerObjectId, // 保存玩家对象 ID
        txDigest: result.digest // 保存交易哈希
      })
    } catch (err) {
      console.error('Registration failed:', err)
      setError(err.message || 'Registration failed, please try again')
    } finally {
      setIsRegistering(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="character-naming">
      <h1 className="naming-title">Name Your Hero</h1>
      
      <div className="naming-container">
        <div className="character-preview">
          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            padding: '30px', 
            borderRadius: '15px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <AnimatedCharacter 
              character={character}
              scale={2.5}
            />
          </div>
          
          <div className="character-info">
            <p className="character-class">{character.name}</p>
            <div className="character-stats-mini">
              <span>HP: {character.stats.hp}</span>
              <span>ATK: {character.stats.attack}</span>
              <span>DEF: {character.stats.defense}</span>
            </div>
          </div>
        </div>

        <div className="naming-form">
          <label htmlFor="character-name">Character Name</label>
          <input
            id="character-name"
            type="text"
            value={name}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter your hero's name"
            maxLength={20}
            autoFocus
          />
          
          {error && <p className="error-text">{error}</p>}
          
          <div className="name-length">
            {name.length}/20 characters
          </div>

          <div className="button-group-naming">
            <button 
              className="back-button-naming" 
              onClick={onBack}
              disabled={isRegistering}
            >
              ← Back
            </button>
            <button 
              className="start-button" 
              onClick={handleSubmit}
              disabled={!name.trim() || isRegistering}
            >
              {isRegistering ? 'Registering...' : 'Register & Start Adventure →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CharacterNaming

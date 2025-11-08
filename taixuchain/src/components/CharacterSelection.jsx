import { useState } from 'react'
import '../css/CharacterSelection.css'
import AnimatedCharacter from './AnimatedCharacter'

function CharacterSelection({ onCharacterSelected }) {
  const [selectedClass, setSelectedClass] = useState(null)

  const classes = [
    {
      id: 'warrior',
      name: 'Warrior',
      nameEn: 'Warrior',
      description: 'Melee fighter with high defense',
      stats: { hp: 120, attack: 15, defense: 12 }
    },
    {
      id: 'archer',
      name: 'Archer',
      nameEn: 'Archer',
      description: 'Ranged attacker with precision',
      stats: { hp: 90, attack: 18, defense: 8 }
    },
    {
      id: 'mage',
      name: 'Mage',
      nameEn: 'Mage',
      description: 'Magic user with powerful spells',
      stats: { hp: 80, attack: 20, defense: 6 }
    }
  ]

  const handleSelect = (classData) => {
    setSelectedClass(classData.id)
  }

  const handleConfirm = () => {
    if (selectedClass) {
      const classData = classes.find(c => c.id === selectedClass)
      onCharacterSelected(classData)
    }
  }

  return (
    <div className="character-selection">
      <h1 className="selection-title">Choose Your Path</h1>
      
      <div className="classes-container">
        {classes.map((classData) => (
          <div
            key={classData.id}
            className={`class-card ${selectedClass === classData.id ? 'selected' : ''}`}
            onClick={() => handleSelect(classData)}
          >
            <div className="character-image-container">
              <AnimatedCharacter 
                character={{
                  ...classData,
                  customization: {
                    gender: 'male',
                    skinColor: '#ffd4a3',
                    hairStyle: 'short',
                    hairColor: '#000000',
                    clothesStyle: 'default',
                    clothesColor: classData.id === 'warrior' ? '#8b0000' : 
                                 classData.id === 'archer' ? '#228b22' : '#4b0082',
                    shoesColor: '#4a4a4a'
                  }
                }}
                scale={2}
              />
            </div>
            <h2 className="class-name">{classData.name}</h2>
            <p className="class-description">{classData.description}</p>
            
            <div className="class-stats">
              <div className="stat">
                <span className="stat-label">HP:</span>
                <span className="stat-value">{classData.stats.hp}</span>
              </div>
              <div className="stat">
                <span className="stat-label">ATK:</span>
                <span className="stat-value">{classData.stats.attack}</span>
              </div>
              <div className="stat">
                <span className="stat-label">DEF:</span>
                <span className="stat-value">{classData.stats.defense}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedClass && (
        <button className="confirm-button" onClick={handleConfirm}>
          Customize Character
        </button>
      )}
    </div>
  )
}

export default CharacterSelection

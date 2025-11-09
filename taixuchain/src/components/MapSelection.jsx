import { useState } from 'react'
import '../css/MapSelection.css'
import AnimatedCharacter from './AnimatedCharacter'

function MapSelection({ character, onMapSelected }) {
  const [selectedMap, setSelectedMap] = useState(null)

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
    if (selectedMap) {
      onMapSelected(selectedMap)
    }
  }

  return (
    <div className="map-selection">
      <h1 className="map-title">Choose Your Adventure Map</h1>
      
      <div className="character-info-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px' }}>
            <AnimatedCharacter character={character} scale={1.2} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>⚔️ {character.name}</div>
            <div style={{ fontSize: '1rem', opacity: 0.8 }}>{character.class} • Level {character.level || 1}</div>
            {character.playerObjectId && (
              <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '5px' }}>
                ID: {character.playerObjectId.slice(0, 8)}...{character.playerObjectId.slice(-6)}
              </div>
            )}
          </div>
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
          disabled={!selectedMap}
        >
          {selectedMap ? 'Enter Map →' : 'Please Select a Map'}
        </button>
      </div>
    </div>
  )
}

export default MapSelection

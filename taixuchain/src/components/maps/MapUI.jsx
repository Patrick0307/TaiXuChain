import '../../css/maps/MapUI.css'

function MapUI({ character, playerPos, tileSize, onExit }) {
  return (
    <div className="game-ui">
      <div className="top-bar">
        <div className="character-info">
          <span className="info-item">
            ⚔️ {character.level || 1} {character.name}
          </span>
          <span className="info-separator">|</span>
          <span className="info-item">
            Class: {character.class}
          </span>
          <span className="info-separator">|</span>
          <span className="info-item">
            Pos: ({Math.floor(playerPos.x / tileSize)}, {Math.floor(playerPos.y / tileSize)})
          </span>
        </div>

        <button onClick={onExit} className="exit-map-button">
          ← Exit
        </button>
      </div>

      <div className="controls-hint">
        🎮 WASD/Arrows | ESC=Exit
      </div>
    </div>
  )
}

export default MapUI

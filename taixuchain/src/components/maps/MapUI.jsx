import '../../css/maps/MapUI.css'

function MapUI({ character, playerPos, tileSize, onExit, playerCurrentHp, playerWeapon }) {
  // 计算玩家总攻击力
  const weaponAttack = playerWeapon ? playerWeapon.attack : 0
  const totalAttack = (character.attack || 0) + weaponAttack
  const maxHp = character.max_hp || character.hp || 100
  const currentHp = playerCurrentHp !== undefined ? playerCurrentHp : maxHp
  const hpPercentage = (currentHp / maxHp) * 100

  return (
    <div className="game-ui">
      <div className="top-bar">
        <div className="character-info">
          <span className="info-item">
            ⚔️ Lv.{character.level || 1} {character.name}
          </span>
          <span className="info-separator">|</span>
          <span className="info-item">
            {character.class}
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

      {/* 玩家状态栏 */}
      <div className="player-status">
        {/* 生命值条 */}
        <div className="status-row">
          <span className="status-label">❤️ HP</span>
          <div className="status-bar hp-bar">
            <div 
              className="status-bar-fill hp-fill" 
              style={{ width: `${hpPercentage}%` }}
            />
            <span className="status-text">{currentHp} / {maxHp}</span>
          </div>
        </div>

        {/* 攻击力 */}
        <div className="status-row">
          <span className="status-label">⚔️ ATK</span>
          <div className="attack-display">
            <span className="attack-value">{totalAttack}</span>
            {weaponAttack > 0 && (
              <span className="attack-breakdown">
                ({character.attack || 0} + {weaponAttack})
              </span>
            )}
          </div>
        </div>

        {/* 武器信息 */}
        {playerWeapon && (
          <div className="weapon-info">
            <span className="weapon-icon">🗡️</span>
            <span className="weapon-name">{playerWeapon.name}</span>
            <span className="weapon-level">Lv.{playerWeapon.level}</span>
          </div>
        )}
      </div>

      <div className="controls-hint">
        🎮 WASD/Arrows | SPACE=Attack | ESC=Exit
      </div>
    </div>
  )
}

export default MapUI

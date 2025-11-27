import { useState, useEffect } from 'react'
import '../../css/maps/WeaponReward.css'

function WeaponReward({ weapon, onClose }) {
  const [showReward, setShowReward] = useState(false)
  const [animationStage, setAnimationStage] = useState('enter') // enter, reveal, exit

  useEffect(() => {
    // 延迟显示，配合开箱动画
    setTimeout(() => setShowReward(true), 500)
    
    // 进入动画
    setTimeout(() => setAnimationStage('reveal'), 800)
    
    // 5秒后自动关闭
    const autoCloseTimer = setTimeout(() => {
      handleClose()
    }, 5000)
    
    return () => clearTimeout(autoCloseTimer)
  }, [])

  const handleClose = () => {
    setAnimationStage('exit')
    setTimeout(() => {
      if (onClose) onClose()
    }, 500)
  }

  if (!showReward) return null

  // 获取武器类型名称
  const getWeaponTypeName = (weaponType) => {
    const names = { 1: 'Sword', 2: 'Bow', 3: 'Staff' }
    return names[weaponType] || 'Unknown'
  }

  // 获取品质名称和颜色
  const getRarityInfo = (rarity) => {
    const info = {
      1: { name: 'Common', color: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.5)' },
      2: { name: 'Rare', color: '#4169E1', glow: 'rgba(65, 105, 225, 0.8)' },
      3: { name: 'Epic', color: '#9370DB', glow: 'rgba(147, 112, 219, 0.8)' }
    }
    return info[rarity] || info[1]
  }

  // 获取武器图片路径
  const getWeaponImage = (weaponName, weaponType) => {
    const typeFolder = { 1: 'swords', 2: 'bows', 3: 'staves' }
    const folder = typeFolder[weaponType] || 'swords'
    return `/weapons/${folder}/${weaponName}.png`
  }

  const rarityInfo = getRarityInfo(weapon.rarity)

  return (
    <div className={`weapon-reward-overlay ${animationStage}`} onClick={handleClose}>
      <div className="weapon-reward-container" onClick={(e) => e.stopPropagation()}>
        {/* 背景光效 */}
        <div className="reward-bg-glow" style={{ 
          background: `radial-gradient(circle, ${rarityInfo.glow} 0%, transparent 70%)` 
        }}></div>
        
        {/* 标题 */}
        <div className="reward-title">
          <div className="reward-title-text">🎉 WEAPON ACQUIRED 🎉</div>
        </div>
        
        {/* 武器展示区 */}
        <div className="weapon-display">
          {/* 旋转光环 */}
          <div className="weapon-ring" style={{ borderColor: rarityInfo.color }}></div>
          <div className="weapon-ring-2" style={{ borderColor: rarityInfo.color }}></div>
          
          {/* 武器图标 */}
          <div className="weapon-icon-container">
            <img 
              src={getWeaponImage(weapon.name, weapon.weaponType)}
              alt={weapon.name}
              className="weapon-icon-large"
              style={{ filter: `drop-shadow(0 0 20px ${rarityInfo.glow})` }}
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = '<div style="font-size: 4em;">⚔️</div>'
              }}
            />
          </div>
          
          {/* 光芒效果 */}
          {[...Array(12)].map((_, i) => (
            <div 
              key={`ray-${i}`}
              className="light-ray"
              style={{
                '--angle': `${i * 30}deg`,
                background: `linear-gradient(to bottom, ${rarityInfo.glow}, transparent)`
              }}
            />
          ))}
        </div>
        
        {/* 武器信息 */}
        <div className="weapon-info">
          <div className="weapon-name" style={{ color: rarityInfo.color }}>
            {weapon.name}
          </div>
          <div className="weapon-rarity" style={{ color: rarityInfo.color }}>
            【{rarityInfo.name}】
          </div>
          
          <div className="weapon-stats">
            <div className="stat-item">
              <span className="stat-label">Type</span>
              <span className="stat-value">{getWeaponTypeName(weapon.weaponType)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Attack</span>
              <span className="stat-value attack">+{weapon.attack}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Level</span>
              <span className="stat-value">Lv.{weapon.level}</span>
            </div>
          </div>
        </div>
        
        {/* 提示文字 */}
        <div className="reward-hint">
          Weapon added to inventory
        </div>
        
        {/* 关闭按钮 */}
        <button className="reward-close-btn" onClick={handleClose}>
          CONFIRM
        </button>
        
        {/* 粒子效果 */}
        {[...Array(30)].map((_, i) => (
          <div 
            key={`star-${i}`}
            className="floating-star"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            ✨
          </div>
        ))}
      </div>
    </div>
  )
}

export default WeaponReward

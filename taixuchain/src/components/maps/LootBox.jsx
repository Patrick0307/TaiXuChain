import { useState } from 'react'
import '../../css/maps/LootBox.css'

function LootBox({ 
  screenPosition, 
  onOpen, 
  onClose,
  boxSize = 40,
  ownerName = null, // 宝箱归属者名字
  isOwner = true, // 当前玩家是否是归属者
  canOpen = true // 是否可以打开（用于冷却控制）
}) {
  const [isOpening, setIsOpening] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (isOpening || !canOpen) return
    
    // 如果不是归属者，不允许打开
    if (!isOwner) {
      return
    }
    
    // 标记为正在开启（防止重复点击）
    setIsOpening(true)
    
    // 触发开箱逻辑
    if (onOpen) {
      onOpen()
    }
    
    // 不调用 onClose，让服务器的 lootbox_picked 事件统一移除宝箱
    // 这样可以确保所有玩家同步移除
  }

  return (
    <div
      className={`loot-box ${isOpening ? 'opening' : ''} ${isHovered ? 'hovered' : ''} ${!canOpen ? 'disabled' : ''}`}
      style={{
        position: 'absolute',
        left: `${screenPosition.x}px`,
        top: `${screenPosition.y}px`,
        width: `${boxSize}px`,
        height: `${boxSize}px`,
        transform: 'translate(-50%, -50%)',
        cursor: canOpen && !isOpening && isOwner ? 'pointer' : 'default',
        zIndex: 100,
        opacity: canOpen ? 1 : 0.5,
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 宝箱图片 */}
      <img 
        src="/maps/treasure.png" 
        alt="treasure box"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          filter: isHovered && canOpen && isOwner ? 'brightness(1.2) drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))' : 'none',
          transition: 'filter 0.2s ease'
        }}
      />
      
      {/* 可点击提示 */}
      {canOpen && !isOpening && isOwner && (
        <div className="click-hint">
          Click to open
        </div>
      )}
      
      {/* Owner name */}
      {ownerName && !isOwner && (
        <div style={{
          position: 'absolute',
          top: '-25px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#FFD700',
          fontSize: '12px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}>
          {ownerName}'s Loot Box
        </div>
      )}
      
      {/* 光效 - 只在可以打开时显示 */}
      {canOpen && !isOpening && isOwner && (
        <>
          <div className="glow-ring" style={{ 
            borderColor: '#FFD700'
          }}></div>
          <div className="glow-pulse" style={{ 
            background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%)'
          }}></div>
        </>
      )}
      
      {/* 开箱动画 */}
      {isOpening && (
        <div className="opening-animation">
          {/* 爆炸光效 */}
          <div className="explosion-light"></div>
          
          {/* 粒子效果 */}
          {[...Array(20)].map((_, i) => (
            <div 
              key={`particle-${i}`}
              className="particle"
              style={{
                '--angle': `${i * 18}deg`,
                '--delay': `${i * 0.05}s`
              }}
            />
          ))}
          
          {/* 旋转光环 */}
          <div className="rotating-ring"></div>
        </div>
      )}
    </div>
  )
}

export default LootBox

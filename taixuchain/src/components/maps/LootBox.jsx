import { useState, useEffect } from 'react'
import '../../css/maps/LootBox.css'

function LootBox({ 
  screenPosition, 
  onOpen, 
  onClose,
  boxSize = 40
}) {
  const [countdown, setCountdown] = useState(5) // 5秒倒计时
  const [isOpening, setIsOpening] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleClick = () => {
    if (countdown > 0 || isOpening) return
    
    setIsOpening(true)
    
    // 触发开箱动画和逻辑
    if (onOpen) {
      onOpen()
    }
    
    // 3秒后关闭宝箱（动画结束）
    setTimeout(() => {
      if (onClose) {
        onClose()
      }
    }, 3000)
  }

  return (
    <div
      className={`loot-box ${isOpening ? 'opening' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{
        position: 'absolute',
        left: `${screenPosition.x}px`,
        top: `${screenPosition.y}px`,
        width: `${boxSize}px`,
        height: `${boxSize}px`,
        transform: 'translate(-50%, -50%)',
        cursor: countdown === 0 && !isOpening ? 'pointer' : 'default',
        zIndex: 100,
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 宝箱图标 */}
      <div className="box-icon">
        📦
      </div>
      
      {/* 倒计时显示 */}
      {countdown > 0 && (
        <div className="countdown-overlay">
          <div className="countdown-number">{countdown}</div>
          <div className="countdown-text">秒后可开启</div>
        </div>
      )}
      
      {/* 可点击提示 */}
      {countdown === 0 && !isOpening && (
        <div className="click-hint">
          点击开启
        </div>
      )}
      
      {/* 光效 */}
      {countdown === 0 && !isOpening && (
        <>
          <div className="glow-ring"></div>
          <div className="glow-pulse"></div>
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

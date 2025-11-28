import { useState, useEffect } from 'react'
import '../../css/maps/TutorialPopup.css'

function TutorialPopup({ onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  const [particles, setParticles] = useState([])

  useEffect(() => {
    // 淡入动画
    setTimeout(() => setIsVisible(true), 50)
    
    // 生成粒子
    const newParticles = []
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2
      })
    }
    setParticles(newParticles)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const controls = [
    { key: 'W / ↑', description: 'Move Up' },
    { key: 'S / ↓', description: 'Move Down' },
    { key: 'A / ←', description: 'Move Left' },
    { key: 'D / →', description: 'Move Right' },
    { key: 'Space', description: 'Attack' },
    { key: 'I', description: 'Inventory' },
    { key: 'M', description: 'Marketplace' },
    { key: 'ESC', description: 'Exit Map' },
  ]

  return (
    <div className={`tutorial-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
      <div className={`tutorial-popup ${isVisible ? 'visible' : ''}`} onClick={e => e.stopPropagation()}>
        {/* 粒子效果 */}
        <div className="tutorial-particles">
          {particles.map(p => (
            <div
              key={p.id}
              className="tutorial-particle"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`
              }}
            />
          ))}
        </div>
        
        {/* 呼吸光晕 */}
        <div className="tutorial-glow" />
        
        <div className="tutorial-header">
          <h2>⚔️ Controls Guide</h2>
        </div>
        
        <div className="tutorial-content">
          <div className="controls-list">
            {controls.map((control, index) => (
              <div key={index} className="control-item">
                <span className="control-key">{control.key}</span>
                <span className="control-desc">{control.description}</span>
              </div>
            ))}
          </div>
          
          <div className="tutorial-tips">
            <h3>💡 Tips</h3>
            <ul>
              <li>Defeat monsters to get loot boxes</li>
              <li>Open loot boxes to receive random weapons</li>
              <li>Trade weapons in the marketplace</li>
            </ul>
          </div>
        </div>
        
        <button className="tutorial-close-btn" onClick={handleClose}>
          Got it!
        </button>
      </div>
    </div>
  )
}

export default TutorialPopup

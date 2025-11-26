import { useState, useEffect } from 'react'
import '../css/CharacterSelection.css'
import AnimatedCharacter from './AnimatedCharacter'

function CharacterSelection({ onCharacterSelected }) {
  const [selectedClass, setSelectedClass] = useState(null)
  const [hoveredClass, setHoveredClass] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [characterScale, setCharacterScale] = useState(1.8)

  // 响应式缩放
  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth
      if (width >= 1400) {
        setCharacterScale(2.2)
      } else if (width >= 900) {
        setCharacterScale(1.8)
      } else if (width >= 480) {
        setCharacterScale(1.5)
      } else {
        setCharacterScale(1.3)
      }
    }
    
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const classes = [
    {
      id: 'warrior',
      name: 'Warrior',
      nameZh: '战士',
      description: 'Master of close combat with unbreakable defense',
      descriptionZh: '近战大师，拥有坚不可摧的防御',
      stats: { hp: 120, attack: 15, defense: 12, speed: 8 },
      color: '#8b0000'
    },
    {
      id: 'archer',
      name: 'Archer',
      nameZh: '弓箭手',
      description: 'Swift ranger with deadly precision strikes',
      descriptionZh: '敏捷游侠，拥有致命的精准打击',
      stats: { hp: 90, attack: 18, defense: 8, speed: 12 },
      color: '#228b22'
    },
    {
      id: 'mage',
      name: 'Mage',
      nameZh: '法师',
      description: 'Arcane wielder commanding devastating magic',
      descriptionZh: '奥术使者，掌控毁灭性的魔法',
      stats: { hp: 80, attack: 20, defense: 6, speed: 10 },
      color: '#4b0082'
    }
  ]

  useEffect(() => {
    // 入场动画
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleSelect = (classData) => {
    if (selectedClass !== classData.id) {
      setSelectedClass(classData.id)
    }
  }

  const handleConfirm = () => {
    if (selectedClass) {
      const classData = classes.find(c => c.id === selectedClass)
      onCharacterSelected(classData)
    }
  }

  return (
    <div className="character-selection">
      {/* 马赛克动态背景 */}
      <div className="mosaic-bg"></div>
      <div className="mosaic-overlay"></div>
      
      {/* 魔法圆环 */}
      <div className="magic-circle"></div>
      
      {/* 星空闪烁效果 */}
      <div className="stars-container">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}></div>
        ))}
      </div>
      
      {/* 金色粒子效果 */}
      <div className="particles-container">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 5}s`
          }}></div>
        ))}
      </div>
      
      {/* 流星效果 */}
      <div className="particles-container">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="meteor" style={{
            left: `${Math.random() * 50}%`,
            top: `${Math.random() * 50}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${1 + Math.random()}s`,
            animationIterationCount: 'infinite'
          }}></div>
        ))}
      </div>
      
      {/* 能量球轨迹 */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => {
          const angle = (Math.random() * 360) * Math.PI / 180;
          const distance = 200 + Math.random() * 300;
          return (
            <div key={i} className="energy-orb" style={{
              left: '50%',
              top: '50%',
              '--orbit-x': `${Math.cos(angle) * distance}px`,
              '--orbit-y': `${Math.sin(angle) * distance}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 3}s`
            }}></div>
          );
        })}
      </div>
      
      {/* 光束效果 */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="light-beam" style={{
          left: `${20 + i * 30}%`,
          animationDelay: `${i * 1}s`
        }}></div>
      ))}

      <div className="selection-content">
        {/* 标题区域 */}
        <div className="title-section">
          <h1 className="selection-title">
            <span className="title-main">Choose Your Destiny</span>
          </h1>
          <div className="title-decoration">
            <div className="decoration-line left"></div>
            <div className="decoration-center">✦</div>
            <div className="decoration-line right"></div>
          </div>
        </div>

        {/* 角色卡片容器 */}
        <div className="classes-grid">
          {classes.map((classData, index) => (
            <div
              key={classData.id}
              className={`class-card ${selectedClass === classData.id ? 'selected' : ''} ${hoveredClass === classData.id ? 'hovered' : ''}`}
              onClick={() => handleSelect(classData)}
              onMouseEnter={() => setHoveredClass(classData.id)}
              onMouseLeave={() => setHoveredClass(null)}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* 光环效果 */}
              <div className="card-aura"></div>
              
              {/* 卡片光效 */}
              <div className="card-glow"></div>
              <div className="card-shine"></div>
              
              {/* 角色展示区 */}
              <div className="character-display">
                <div className="character-frame">
                  <div className="frame-corners">
                    <span className="corner top-left"></span>
                    <span className="corner top-right"></span>
                    <span className="corner bottom-left"></span>
                    <span className="corner bottom-right"></span>
                  </div>
                  <AnimatedCharacter 
                    character={{
                      ...classData,
                      customization: {
                        gender: 'male',
                        skinColor: '#ffd4a3',
                        hairStyle: 'short',
                        hairColor: '#000000',
                        clothesStyle: 'default',
                        clothesColor: classData.color,
                        shoesColor: '#4a4a4a'
                      }
                    }}
                    scale={characterScale}
                  />
                </div>
              </div>

              {/* 角色信息 */}
              <div className="character-info">
                <h2 className="class-name">
                  <span className="name-en">{classData.name}</span>
                </h2>
                
                <p className="class-description">{classData.description}</p>

                {/* 属性条 */}
                <div className="stats-container">
                  {Object.entries(classData.stats).map(([key, value]) => (
                    <div key={key} className="stat-row">
                      <span className="stat-label">{key.toUpperCase()}</span>
                      <div className="stat-bar-bg">
                        <div 
                          className="stat-bar-fill" 
                          style={{ 
                            width: `${(value / 20) * 100}%`,
                            animationDelay: `${index * 0.1}s`
                          }}
                        ></div>
                      </div>
                      <span className="stat-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 选中指示器 */}
              {selectedClass === classData.id && (
                <div className="selected-indicator">
                  <span className="indicator-icon">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 确认按钮 */}
        {selectedClass && (
          <button className="selection-confirm-btn" onClick={handleConfirm}>
            <span className="button-text">Begin Your Journey</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default CharacterSelection

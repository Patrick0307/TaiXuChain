import { useState, useEffect } from 'react'
import '../css/CharacterCustomization.css'
import AnimatedCharacter from './AnimatedCharacter'

function CharacterCustomization({ characterClass, onCustomizationComplete, onBack }) {
  const [customization, setCustomization] = useState({
    gender: 'male',
    skinColor: '#ffd4a3',
    hairStyle: 'short',
    hairColor: '#000000',
    clothesStyle: 'default',
    clothesColor: characterClass.id === 'warrior' ? '#8b0000' : 
                  characterClass.id === 'archer' ? '#228b22' : '#4b0082',
    shoesColor: '#4a4a4a'
  })
  const [characterScale, setCharacterScale] = useState(3)

  // 响应式缩放
  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth
      const isLandscape = window.innerWidth > window.innerHeight
      
      if (width >= 1400) {
        setCharacterScale(4)
      } else if (width >= 900) {
        setCharacterScale(3)
      } else if (width >= 768 && isLandscape) {
        setCharacterScale(2)
      } else if (width >= 480) {
        setCharacterScale(2.5)
      } else {
        setCharacterScale(2)
      }
    }
    
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  const hairStyles = customization.gender === 'male' 
    ? ['short', 'long', 'topknot', 'frontponytail']
    : ['short', 'long', 'bun', 'frontponytail', 'braids']

  const handleChange = (key, value) => {
    setCustomization(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleConfirm = () => {
    onCustomizationComplete({
      ...characterClass,
      customization
    })
  }

  return (
    <div className="character-customization">
      {/* 马赛克背景 */}
      <div className="mosaic-bg"></div>
      <div className="mosaic-overlay"></div>

      {/* 粒子特效容器 */}
      <div className="particles-container">
        {/* 星空闪烁 */}
        {[...Array(40)].map((_, i) => (
          <div 
            key={`star-${i}`}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* 金色粒子上升 */}
        {[...Array(15)].map((_, i) => (
          <div 
            key={`particle-${i}`}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}
          />
        ))}
        
        {/* 能量球轨迹 */}
        {[...Array(12)].map((_, i) => {
          const angle = (Math.random() * 360) * Math.PI / 180;
          const distance = 200 + Math.random() * 300;
          return (
            <div 
              key={`orb-${i}`}
              className="energy-orb"
              style={{
                left: '50%',
                top: '50%',
                '--orbit-x': `${Math.cos(angle) * distance}px`,
                '--orbit-y': `${Math.sin(angle) * distance}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 3}s`
              }}
            />
          );
        })}
        
        {/* 流星效果 */}
        {[...Array(4)].map((_, i) => (
          <div 
            key={`meteor-${i}`}
            className="meteor"
            style={{
              left: `${Math.random() * 50}%`,
              top: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${1 + Math.random()}s`,
              animationIterationCount: 'infinite'
            }}
          />
        ))}
        
        {/* 魔法圆环 */}
        {[800, 600, 400].map((size, i) => (
          <div 
            key={`circle-${i}`}
            className="magic-circle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              animationDuration: `${20 - i * 5}s`,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
            }}
          />
        ))}
      </div>

      {/* 标题 */}
      <div className="title-section">
        <h1 className="customization-title">
          <span className="title-main">Customize Your {characterClass.name}</span>
        </h1>
        <div className="title-decoration">
          <div className="decoration-line left"></div>
          <div className="decoration-center">✦</div>
          <div className="decoration-line right"></div>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="customization-main">
        {/* 左侧预览 */}
        <div className="preview-section">
          <div className="preview-label">PREVIEW</div>
          <div className="preview-frame">
            <div className="frame-corners">
              <span className="corner tl"></span>
              <span className="corner tr"></span>
              <span className="corner bl"></span>
              <span className="corner br"></span>
            </div>
            <AnimatedCharacter 
              character={{
                ...characterClass,
                customization
              }}
              scale={characterScale}
            />
          </div>
        </div>

        {/* 右侧选项 */}
        <div className="options-section">
          {/* Gender */}
          <div className="option-card">
            <h3 className="option-title">Gender</h3>
            <div className="button-row">
              <button 
                className={`option-btn ${customization.gender === 'male' ? 'selected' : ''}`}
                onClick={() => handleChange('gender', 'male')}
              >
                Male
              </button>
              <button 
                className={`option-btn ${customization.gender === 'female' ? 'selected' : ''}`}
                onClick={() => handleChange('gender', 'female')}
              >
                Female
              </button>
            </div>
          </div>

          {/* Hair Style */}
          <div className="option-card">
            <h3 className="option-title">Hair Style</h3>
            <div className="button-row">
              {hairStyles.map(style => (
                <button 
                  key={style}
                  className={`option-btn ${customization.hairStyle === style ? 'selected' : ''}`}
                  onClick={() => handleChange('hairStyle', style)}
                >
                  {style === 'short' ? 'Short' : 
                   style === 'long' ? 'Long' : 
                   style === 'bun' ? 'Bun' : 
                   style === 'frontponytail' ? 'Bald' :
                   style === 'braids' ? 'Braids' : 'Topknot'}
                </button>
              ))}
            </div>
          </div>

          {/* Colors Grid */}
          <div className="colors-grid">
            <div className="color-card">
              <h3 className="color-title">Skin Color</h3>
              <input 
                type="color" 
                value={customization.skinColor}
                onChange={(e) => handleChange('skinColor', e.target.value)}
                className="color-picker"
              />
            </div>

            <div className="color-card">
              <h3 className="color-title">Hair Color</h3>
              <input 
                type="color" 
                value={customization.hairColor}
                onChange={(e) => handleChange('hairColor', e.target.value)}
                className="color-picker"
              />
            </div>

            <div className="color-card">
              <h3 className="color-title">Clothes Color</h3>
              <input 
                type="color" 
                value={customization.clothesColor}
                onChange={(e) => handleChange('clothesColor', e.target.value)}
                className="color-picker"
              />
            </div>

            <div className="color-card">
              <h3 className="color-title">Shoes Color</h3>
              <input 
                type="color" 
                value={customization.shoesColor}
                onChange={(e) => handleChange('shoesColor', e.target.value)}
                className="color-picker"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="action-section">
        <button className="custom-btn" onClick={onBack}>
          Back to Selection
        </button>
        <button className="custom-btn" onClick={handleConfirm}>
          Continue to Naming
        </button>
      </div>
    </div>
  )
}

export default CharacterCustomization

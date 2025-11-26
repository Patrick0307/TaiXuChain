import { useState } from 'react'
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
              scale={3}
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
        <button className="back-button" onClick={onBack}>
          <span className="button-text">Back to Selection</span>
        </button>
        <button className="confirm-button" onClick={handleConfirm}>
          <span className="button-bg"></span>
          <span className="button-text">Continue to Naming</span>
          <span className="button-shine"></span>
        </button>
      </div>
    </div>
  )
}

export default CharacterCustomization

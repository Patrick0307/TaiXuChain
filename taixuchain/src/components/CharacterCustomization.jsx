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

  const colorOptions = {
    skin: ['#ffd4a3', '#f4c2a0', '#d4a574', '#c68642', '#8d5524', '#5c3317', '#4a3728', '#2d1f1a'],
    hair: ['#000000', '#1a1a1a', '#2c1608', '#4a2511', '#8b4513', '#a0522d', '#cd853f', 
           '#daa520', '#ffd700', '#ff6347', '#dc143c', '#9370db', '#4b0082', '#ffffff', '#e6e6e6'],
    clothes: ['#8b0000', '#dc143c', '#ff0000', '#ff4500', '#ff8c00', '#ffd700', 
              '#228b22', '#32cd32', '#00ced1', '#4169e1', '#4b0082', '#8b008b',
              '#ff1493', '#ff69b4', '#c0c0c0', '#ffffff', '#000000', '#2f4f4f'],
    shoes: ['#000000', '#1a1a1a', '#2f4f4f', '#4a4a4a', '#696969', '#8b4513', 
            '#654321', '#a0522d', '#8b0000', '#ffffff']
  }

  const hairStyles = customization.gender === 'male' 
    ? ['short', 'long', 'topknot', 'ponytail']
    : ['short', 'long', 'bun', 'ponytail', 'braids']
  
  const clothesStyles = ['default', 'robe', 'armor']

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
      <h1 className="customization-title">Customize Your {characterClass.name}</h1>
      
      <div className="customization-container">
        <div className="preview-section">
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '30px', borderRadius: '15px' }}>
            <AnimatedCharacter 
              character={{
                ...characterClass,
                customization
              }}
              scale={2.5}
            />
          </div>
        </div>

        <div className="options-section">
          <div className="color-group">
            <h3>Gender</h3>
            <div className="style-options">
              <button 
                className={`style-btn ${customization.gender === 'male' ? 'selected' : ''}`}
                onClick={() => handleChange('gender', 'male')}
              >
                Male
              </button>
              <button 
                className={`style-btn ${customization.gender === 'female' ? 'selected' : ''}`}
                onClick={() => handleChange('gender', 'female')}
              >
                Female
              </button>
            </div>
          </div>

          <div className="color-group">
            <h3>Skin Color</h3>
            <div className="color-palette">
              {colorOptions.skin.map(color => (
                <div
                  key={color}
                  className={`color-option ${customization.skinColor === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => handleChange('skinColor', color)}
                ></div>
              ))}
            </div>
          </div>

          <div className="color-group">
            <h3>Hair Style</h3>
            <div className="style-options">
              {hairStyles.map(style => (
                <button 
                  key={style}
                  className={`style-btn ${customization.hairStyle === style ? 'selected' : ''}`}
                  onClick={() => handleChange('hairStyle', style)}
                >
                  {style === 'short' ? 'Short' : 
                   style === 'long' ? 'Long' : 
                   style === 'bun' ? 'Bun' : 
                   style === 'ponytail' ? 'Ponytail' :
                   style === 'braids' ? 'Braids' : 'Topknot'}
                </button>
              ))}
            </div>
          </div>

          <div className="color-group">
            <h3>Hair Color</h3>
            <div className="color-palette">
              {colorOptions.hair.map(color => (
                <div
                  key={color}
                  className={`color-option ${customization.hairColor === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => handleChange('hairColor', color)}
                ></div>
              ))}
              <input 
                type="color" 
                value={customization.hairColor}
                onChange={(e) => handleChange('hairColor', e.target.value)}
                className="color-picker"
                title="Custom Color"
              />
            </div>
          </div>

          <div className="color-group">
            <h3>Clothes Style</h3>
            <div className="style-options">
              {clothesStyles.map(style => (
                <button 
                  key={style}
                  className={`style-btn ${customization.clothesStyle === style ? 'selected' : ''}`}
                  onClick={() => handleChange('clothesStyle', style)}
                >
                  {style === 'default' ? 'Default' : 
                   style === 'robe' ? 'Robe' : 'Armor'}
                </button>
              ))}
            </div>
          </div>

          <div className="color-group">
            <h3>Clothes Color</h3>
            <div className="color-palette">
              {colorOptions.clothes.map(color => (
                <div
                  key={color}
                  className={`color-option ${customization.clothesColor === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => handleChange('clothesColor', color)}
                ></div>
              ))}
              <input 
                type="color" 
                value={customization.clothesColor}
                onChange={(e) => handleChange('clothesColor', e.target.value)}
                className="color-picker"
                title="Custom Color"
              />
            </div>
          </div>

          <div className="color-group">
            <h3>Shoes Color</h3>
            <div className="color-palette">
              {colorOptions.shoes.map(color => (
                <div
                  key={color}
                  className={`color-option ${customization.shoesColor === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => handleChange('shoesColor', color)}
                ></div>
              ))}
              <input 
                type="color" 
                value={customization.shoesColor}
                onChange={(e) => handleChange('shoesColor', e.target.value)}
                className="color-picker"
                title="Custom Color"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="button-group">
        <button className="back-button" onClick={onBack}>
          ← Back to Selection
        </button>
        <button className="confirm-button" onClick={handleConfirm}>
          Continue to Naming →
        </button>
      </div>
    </div>
  )
}

export default CharacterCustomization

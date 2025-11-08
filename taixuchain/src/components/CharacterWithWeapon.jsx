import '../css/CharacterWithWeapon.css'

/**
 * Component to display character with optional weapon overlay
 * Used in gameplay, not in character creation
 */
function CharacterWithWeapon({ character, weaponId = null, size = 'medium' }) {
  const { id, customization } = character

  const getHueRotation = (color) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    
    if (max !== min) {
      const d = max - min
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    
    return h * 360
  }

  const getBrightness = (color) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r + g + b) / 3 / 255
    return 0.5 + brightness * 0.5
  }

  const getSaturation = (color) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    
    if (max === min) return 1
    
    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    return 0.5 + s * 1.5
  }

  return (
    <div className={`character-with-weapon ${size}`}>
      {/* Character layers */}
      <img 
        src={`/characters/${id}_body.png`}
        alt="body"
        className="game-character-layer"
        style={{ filter: `hue-rotate(${getHueRotation(customization.skinColor)}deg)` }}
        onError={(e) => e.target.style.display = 'none'}
      />
      
      <img 
        src={`/characters/${id}_hair.png`}
        alt="hair"
        className="game-character-layer"
        style={{ filter: `hue-rotate(${getHueRotation(customization.hairColor)}deg) brightness(${getBrightness(customization.hairColor)})` }}
        onError={(e) => e.target.style.display = 'none'}
      />
      
      <img 
        src={`/characters/${id}_clothes.png`}
        alt="clothes"
        className="game-character-layer"
        style={{ filter: `hue-rotate(${getHueRotation(customization.clothesColor)}deg) saturate(${getSaturation(customization.clothesColor)})` }}
        onError={(e) => e.target.style.display = 'none'}
      />
      
      <img 
        src={`/characters/${id}_shoes.png`}
        alt="shoes"
        className="game-character-layer"
        style={{ filter: `hue-rotate(${getHueRotation(customization.shoesColor)}deg) brightness(${getBrightness(customization.shoesColor)})` }}
        onError={(e) => e.target.style.display = 'none'}
      />

      {/* Weapon layer - only shown if weaponId is provided */}
      {weaponId && (
        <img 
          src={`/weapons/${weaponId}.png`}
          alt="weapon"
          className="game-weapon-layer"
          onError={(e) => e.target.style.display = 'none'}
        />
      )}
    </div>
  )
}

export default CharacterWithWeapon

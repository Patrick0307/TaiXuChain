import { useEffect, useRef } from 'react'
import { drawWarriorBody } from './CharacterBody'
import { drawWarriorFace } from './CharacterFace'
import { drawHair } from './CharacterHair'
import { drawShoes } from './CharacterShoes'

function WarriorCharacter({ gender, customization, scale = 2 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    const pixel = (x, y, color) => {
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    }
    
    const adjustBrightness = (color, amount) => {
      const hex = color.replace('#', '')
      const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount))
      const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount))
      const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount))
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    }
    
    // Draw character layers
    drawWarriorBody(pixel, adjustBrightness, customization.skinColor, gender)
    drawClothes(pixel, adjustBrightness, customization.clothesStyle, customization.clothesColor, gender)
    drawShoes(pixel, adjustBrightness, customization.shoesColor)
    drawHair(pixel, adjustBrightness, customization.hairStyle, customization.hairColor, gender)
    drawWarriorFace(pixel, adjustBrightness, customization.skinColor, gender)
  }, [gender, customization, scale])

  // 战士服装绘制 - 只有这个是战士独有的
  const drawClothes = (pixel, adjustBrightness, style, color, gender) => {
    const darkColor = adjustBrightness(color, -40)
    const lightColor = adjustBrightness(color, 30)
    const metalColor = '#c0c0c0'
    const darkMetal = '#808080'
    const lightMetal = '#e8e8e8'
    
    if (gender === 'male') {
      drawMaleWarriorArmor(pixel, adjustBrightness, color, darkColor, lightColor, metalColor, darkMetal, lightMetal)
    } else {
      drawFemaleWarriorArmor(pixel, adjustBrightness, color, darkColor, lightColor, metalColor, darkMetal, lightMetal)
    }
  }

  const drawMaleWarriorArmor = (pixel, adjustBrightness, color, darkColor, lightColor, metalColor, darkMetal, lightMetal) => {
    // 胸甲主体 - 更宽更厚重
    for (let x = 26; x <= 54; x++) {
      for (let y = 45; y <= 74; y++) {
        pixel(x, y, color)
      }
    }
    
    // 金属护甲板 - 左胸（更大）
    for (let x = 28; x <= 37; x++) {
      for (let y = 48; y <= 60; y++) {
        pixel(x, y, metalColor)
      }
    }
    for (let x = 30; x <= 35; x++) {
      pixel(x, 50, lightMetal)
      pixel(x, 51, lightMetal)
    }
    pixel(32, 58, darkMetal)
    pixel(33, 58, darkMetal)
    pixel(34, 58, darkMetal)
    
    // 金属护甲板 - 右胸（更大）
    for (let x = 43; x <= 52; x++) {
      for (let y = 48; y <= 60; y++) {
        pixel(x, y, metalColor)
      }
    }
    for (let x = 45; x <= 50; x++) {
      pixel(x, 50, lightMetal)
      pixel(x, 51, lightMetal)
    }
    pixel(46, 58, darkMetal)
    pixel(47, 58, darkMetal)
    pixel(48, 58, darkMetal)
    
    // 中央护心镜（更宽）
    for (let x = 36; x <= 44; x++) {
      for (let y = 46; y <= 68; y++) {
        pixel(x, y, lightMetal)
      }
    }
    // 护心镜装饰
    for (let y = 48; y <= 66; y += 3) {
      pixel(40, y, darkMetal)
    }
    pixel(38, 52, darkMetal)
    pixel(42, 52, darkMetal)
    pixel(38, 60, darkMetal)
    pixel(42, 60, darkMetal)
    
    // 肩甲 - 超大型护肩（魁梧）
    for (let x = 14; x <= 27; x++) {
      for (let y = 45; y <= 54; y++) {
        pixel(x, y, metalColor)
      }
    }
    // 护肩装饰
    for (let x = 16; x <= 25; x++) {
      pixel(x, 47, lightMetal)
      pixel(x, 48, lightMetal)
    }
    pixel(18, 50, darkMetal)
    pixel(20, 50, darkMetal)
    pixel(22, 50, darkMetal)
    pixel(24, 50, darkMetal)
    
    // 护肩尖刺
    pixel(15, 44, metalColor)
    pixel(16, 43, lightMetal)
    pixel(17, 44, metalColor)
    
    for (let x = 53; x <= 66; x++) {
      for (let y = 45; y <= 54; y++) {
        pixel(x, y, metalColor)
      }
    }
    for (let x = 55; x <= 64; x++) {
      pixel(x, 47, lightMetal)
      pixel(x, 48, lightMetal)
    }
    pixel(56, 50, darkMetal)
    pixel(58, 50, darkMetal)
    pixel(60, 50, darkMetal)
    pixel(62, 50, darkMetal)
    
    // 护肩尖刺
    pixel(65, 44, metalColor)
    pixel(64, 43, lightMetal)
    pixel(63, 44, metalColor)
    
    // 腰带
    for (let x = 28; x <= 52; x++) {
      pixel(x, 73, '#654321')
      pixel(x, 74, '#8b4513')
      pixel(x, 75, '#654321')
    }
    // 腰带扣
    for (let x = 38; x <= 42; x++) {
      pixel(x, 73, '#daa520')
      pixel(x, 74, '#ffd700')
      pixel(x, 75, '#daa520')
    }
    
    // 战裙/护腿
    for (let y = 76; y <= 82; y++) {
      for (let x = 28; x <= 36; x++) {
        pixel(x, y, darkColor)
      }
      for (let x = 44; x <= 52; x++) {
        pixel(x, y, darkColor)
      }
    }
    
    // 腿部护甲
    for (let y = 80; y <= 86; y++) {
      pixel(30, y, metalColor)
      pixel(31, y, metalColor)
      pixel(34, y, metalColor)
      pixel(35, y, metalColor)
      pixel(45, y, metalColor)
      pixel(46, y, metalColor)
      pixel(49, y, metalColor)
      pixel(50, y, metalColor)
    }
  }

  const drawFemaleWarriorArmor = (pixel, adjustBrightness, color, darkColor, lightColor, metalColor, darkMetal, lightMetal) => {
    // 胸甲主体 - 更大覆盖面积
    for (let x = 28; x <= 52; x++) {
      for (let y = 45; y <= 68; y++) {
        pixel(x, y, color)
      }
    }
    
    // 金属胸甲 - 完整覆盖
    // 左侧胸甲
    for (let x = 30; x <= 39; x++) {
      for (let y = 47; y <= 60; y++) {
        pixel(x, y, metalColor)
      }
    }
    // 左侧胸甲高光
    for (let x = 32; x <= 37; x++) {
      pixel(x, 49, lightMetal)
      pixel(x, 50, lightMetal)
    }
    pixel(34, 58, darkMetal)
    pixel(35, 58, darkMetal)
    
    // 右侧胸甲
    for (let x = 41; x <= 50; x++) {
      for (let y = 47; y <= 60; y++) {
        pixel(x, y, metalColor)
      }
    }
    // 右侧胸甲高光
    for (let x = 43; x <= 48; x++) {
      pixel(x, 49, lightMetal)
      pixel(x, 50, lightMetal)
    }
    pixel(45, 58, darkMetal)
    pixel(46, 58, darkMetal)
    
    // 中央连接装饰
    for (let y = 47; y <= 60; y++) {
      pixel(40, y, lightMetal)
    }
    // 中央宝石装饰
    pixel(39, 52, '#daa520')
    pixel(40, 52, '#ffd700')
    pixel(41, 52, '#daa520')
    pixel(40, 53, '#ffd700')
    
    // 腹部护甲
    for (let x = 32; x <= 48; x++) {
      for (let y = 61; y <= 66; y++) {
        pixel(x, y, metalColor)
      }
    }
    // 腹部护甲细节
    for (let x = 34; x <= 46; x += 3) {
      pixel(x, 63, darkMetal)
    }
    
    // 肩甲 - 适中大小
    for (let x = 20; x <= 27; x++) {
      for (let y = 45; y <= 50; y++) {
        pixel(x, y, metalColor)
      }
    }
    for (let x = 22; x <= 25; x++) {
      pixel(x, 46, lightMetal)
      pixel(x, 47, lightMetal)
    }
    pixel(23, 49, darkMetal)
    
    for (let x = 53; x <= 60; x++) {
      for (let y = 45; y <= 50; y++) {
        pixel(x, y, metalColor)
      }
    }
    for (let x = 55; x <= 58; x++) {
      pixel(x, 46, lightMetal)
      pixel(x, 47, lightMetal)
    }
    pixel(57, 49, darkMetal)
    
    // 腰带
    for (let x = 30; x <= 50; x++) {
      pixel(x, 69, '#654321')
      pixel(x, 70, '#8b4513')
    }
    // 腰带扣
    for (let x = 38; x <= 42; x++) {
      pixel(x, 69, '#daa520')
      pixel(x, 70, '#ffd700')
    }
    
    // 战裙
    for (let y = 71; y <= 80; y++) {
      for (let x = 28; x <= 52; x++) {
        pixel(x, y, darkColor)
      }
    }
    // 战裙边缘装饰
    for (let x = 28; x <= 52; x += 4) {
      pixel(x, 80, lightColor)
      pixel(x + 1, 80, lightColor)
    }
    
    // 裙摆
    for (let y = 81; y <= 84; y++) {
      pixel(28, y, darkColor)
      pixel(29, y, darkColor)
      pixel(30, y, darkColor)
      pixel(50, y, darkColor)
      pixel(51, y, darkColor)
      pixel(52, y, darkColor)
    }
    
    // 护腿
    for (let y = 81; y <= 86; y++) {
      for (let x = 32; x <= 34; x++) {
        pixel(x, y, color)
      }
      for (let x = 46; x <= 48; x++) {
        pixel(x, y, color)
      }
    }
  }

  return (
    <canvas 
      ref={canvasRef} 
      width={80} 
      height={100}
      style={{ 
        width: `${80 * scale}px`, 
        height: `${100 * scale}px`,
        imageRendering: 'pixelated',
        imageRendering: '-moz-crisp-edges',
        imageRendering: 'crisp-edges'
      }}
    />
  )
}

export default WarriorCharacter

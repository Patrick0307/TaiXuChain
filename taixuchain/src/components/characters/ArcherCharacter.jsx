import { useEffect, useRef } from 'react'
import { drawArcherBody } from './CharacterBody'
import { drawArcherFace } from './CharacterFace'
import { drawHair } from './CharacterHair'
import { drawShoes } from './CharacterShoes'

function ArcherCharacter({ gender, customization, scale = 2 }) {
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
    
    // 绘制角色
    drawArcherBody(pixel, adjustBrightness, customization.skinColor, gender)
    drawClothes(pixel, adjustBrightness, customization.clothesStyle, customization.clothesColor, gender)
    drawShoes(pixel, adjustBrightness, customization.shoesColor)
    drawHair(pixel, adjustBrightness, customization.hairStyle, customization.hairColor, gender)
    drawArcherFace(pixel, adjustBrightness, customization.skinColor, gender)
  }, [gender, customization, scale])

  // 弓箭手服装绘制
  const drawClothes = (pixel, adjustBrightness, style, color, gender) => {
    const darkColor = adjustBrightness(color, -40)
    const lightColor = adjustBrightness(color, 30)
    const leatherColor = '#8b4513'
    const darkLeather = '#654321'
    const lightLeather = '#a0522d'
    
    if (gender === 'male') {
      drawMaleArcherClothes(pixel, adjustBrightness, color, darkColor, lightColor, leatherColor, darkLeather, lightLeather)
    } else {
      drawFemaleArcherClothes(pixel, adjustBrightness, color, darkColor, lightColor, leatherColor, darkLeather, lightLeather)
    }
  }

  const drawMaleArcherClothes = (pixel, adjustBrightness, color, darkColor, lightColor, leatherColor, darkLeather, lightLeather) => {
    // 帅气衬衫
    for (let x = 28; x <= 52; x++) {
      for (let y = 44; y <= 74; y++) {
        pixel(x, y, color)
      }
    }
    
    // 领口设计
    for (let x = 36; x <= 44; x++) {
      pixel(x, 44, darkColor)
      pixel(x, 45, lightColor)
    }
    pixel(37, 46, darkColor)
    pixel(43, 46, darkColor)
    
    // 帅气皮甲背心
    for (let x = 30; x <= 50; x++) {
      for (let y = 46; y <= 70; y++) {
        if (x >= 37 && x <= 43 && y >= 50 && y <= 66) continue
        pixel(x, y, leatherColor)
      }
    }
    
    // 背心装饰线条
    for (let y = 50; y <= 66; y++) {
      pixel(35, y, darkLeather)
      pixel(36, y, darkLeather)
      pixel(44, y, darkLeather)
      pixel(45, y, darkLeather)
    }
    
    // 背心高光
    for (let y = 48; y <= 68; y += 4) {
      pixel(32, y, lightLeather)
      pixel(48, y, lightLeather)
    }
    
    // 帅气肩带
    for (let x = 25; x <= 29; x++) {
      pixel(x, 44, leatherColor)
      pixel(x, 45, darkLeather)
      pixel(x, 46, leatherColor)
    }
    pixel(26, 47, lightLeather)
    
    for (let x = 51; x <= 55; x++) {
      pixel(x, 44, leatherColor)
      pixel(x, 45, darkLeather)
      pixel(x, 46, leatherColor)
    }
    pixel(54, 47, lightLeather)
    
    // 箭袋 - 更精致
    for (let y = 48; y <= 68; y++) {
      pixel(54, y, darkLeather)
      pixel(55, y, leatherColor)
      pixel(56, y, darkLeather)
    }
    // 箭羽 - 多支箭
    pixel(53, 46, '#8b0000')
    pixel(54, 46, '#8b0000')
    pixel(55, 46, '#8b0000')
    pixel(56, 46, '#8b0000')
    pixel(53, 47, '#ff0000')
    pixel(54, 47, '#ff0000')
    pixel(55, 47, '#ff0000')
    pixel(56, 47, '#ff0000')
    
    pixel(54, 48, '#228b22')
    pixel(55, 48, '#228b22')
    pixel(54, 49, '#32cd32')
    pixel(55, 49, '#32cd32')
    
    // 帅气腰带
    for (let x = 28; x <= 52; x++) {
      pixel(x, 75, darkLeather)
      pixel(x, 76, leatherColor)
      pixel(x, 77, darkLeather)
    }
    // 腰带扣
    for (let x = 38; x <= 42; x++) {
      pixel(x, 75, '#c0c0c0')
      pixel(x, 76, '#e8e8e8')
      pixel(x, 77, '#808080')
    }
    
    // 修身裤子
    for (let y = 78; y <= 86; y++) {
      for (let x = 29; x <= 36; x++) {
        pixel(x, y, darkColor)
      }
      for (let x = 44; x <= 51; x++) {
        pixel(x, y, darkColor)
      }
    }
    
    // 裤子装饰线
    for (let y = 80; y <= 84; y++) {
      pixel(33, y, lightColor)
      pixel(47, y, lightColor)
    }
  }

  const drawFemaleArcherClothes = (pixel, adjustBrightness, color, darkColor, lightColor, leatherColor, darkLeather, lightLeather) => {
    // 可爱紧身衣
    for (let x = 30; x <= 50; x++) {
      for (let y = 43; y <= 72; y++) {
        pixel(x, y, color)
      }
    }
    
    // 可爱领口
    for (let x = 36; x <= 44; x++) {
      pixel(x, 43, lightColor)
      pixel(x, 44, darkColor)
    }
    pixel(37, 45, lightColor)
    pixel(38, 45, lightColor)
    pixel(42, 45, lightColor)
    pixel(43, 45, lightColor)
    
    // 可爱皮质胸甲 - 小巧
    for (let x = 32; x <= 38; x++) {
      for (let y = 48; y <= 58; y++) {
        pixel(x, y, leatherColor)
      }
    }
    for (let x = 42; x <= 48; x++) {
      for (let y = 48; y <= 58; y++) {
        pixel(x, y, leatherColor)
      }
    }
    
    // 系带装饰 - 可爱
    for (let y = 50; y <= 56; y += 2) {
      pixel(38, y, darkLeather)
      pixel(42, y, darkLeather)
      pixel(39, y + 1, lightColor)
      pixel(40, y + 1, lightColor)
      pixel(41, y + 1, lightColor)
    }
    
    // 蝴蝶结装饰
    pixel(39, 48, '#ff69b4')
    pixel(40, 48, '#ff1493')
    pixel(41, 48, '#ff69b4')
    pixel(40, 49, '#ff1493')
    
    // 可爱披风
    for (let x = 24; x <= 28; x++) {
      for (let y = 46; y <= 64; y++) {
        pixel(x, y, darkColor)
      }
    }
    for (let x = 52; x <= 56; x++) {
      for (let y = 46; y <= 64; y++) {
        pixel(x, y, darkColor)
      }
    }
    // 披风边缘
    for (let y = 48; y <= 62; y += 3) {
      pixel(25, y, lightColor)
      pixel(55, y, lightColor)
    }
    
    // 细腰带
    for (let x = 30; x <= 50; x++) {
      pixel(x, 68, darkLeather)
      pixel(x, 69, leatherColor)
    }
    // 腰带蝴蝶结
    pixel(39, 67, '#ff69b4')
    pixel(40, 67, '#ff1493')
    pixel(41, 67, '#ff69b4')
    pixel(40, 68, '#ff1493')
    
    // 可爱短裙
    for (let y = 70; y <= 80; y++) {
      for (let x = 28; x <= 52; x++) {
        pixel(x, y, color)
      }
    }
    // 裙摆波浪
    for (let x = 28; x <= 52; x += 3) {
      pixel(x, 80, lightColor)
      pixel(x + 1, 80, lightColor)
      pixel(x, 81, lightColor)
    }
    
    // 可爱护腿袜
    for (let y = 81; y <= 86; y++) {
      for (let x = 32; x <= 34; x++) {
        pixel(x, y, '#ffffff')
      }
      for (let x = 46; x <= 48; x++) {
        pixel(x, y, '#ffffff')
      }
    }
    // 袜子装饰
    pixel(33, 82, '#ff69b4')
    pixel(33, 84, '#ff69b4')
    pixel(47, 82, '#ff69b4')
    pixel(47, 84, '#ff69b4')
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

export default ArcherCharacter

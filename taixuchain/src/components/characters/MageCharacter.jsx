import { useEffect, useRef } from 'react'

function MageCharacter({ gender, customization, scale = 2 }) {
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
    
    drawBody(pixel, adjustBrightness, customization.skinColor, gender)
    drawClothes(pixel, adjustBrightness, customization.clothesStyle, customization.clothesColor, gender)
    drawShoes(pixel, adjustBrightness, customization.shoesColor)
    drawHair(pixel, adjustBrightness, customization.hairStyle, customization.hairColor, gender)
    drawFace(pixel, adjustBrightness, customization.skinColor, gender)
  }, [gender, customization, scale])

  const drawBody = (pixel, adjustBrightness, skinColor, gender) => {
    const darkSkin = adjustBrightness(skinColor, -20)
    
    // 头部
    for (let x = 28; x <= 52; x++) {
      for (let y = 12; y <= 36; y++) {
        if (x === 28 && (y < 16 || y > 32)) continue
        if (x === 29 && (y < 14 || y > 34)) continue
        if (x === 52 && (y < 16 || y > 32)) continue
        if (x === 51 && (y < 14 || y > 34)) continue
        pixel(x, y, skinColor)
      }
    }
    
    // 脖子
    for (let x = 34; x <= 46; x++) {
      for (let y = 38; y <= 42; y++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 手臂 - 术士手臂纤细
    for (let y = 48; y <= 64; y++) {
      for (let x = 22; x <= 24; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 56; x <= 58; x++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 手部
    for (let x = 22; x <= 24; x++) {
      pixel(x, 65, skinColor)
      pixel(x, 66, darkSkin)
    }
    for (let x = 56; x <= 58; x++) {
      pixel(x, 65, skinColor)
      pixel(x, 66, darkSkin)
    }
    
    // 腿部
    for (let y = 88; y <= 94; y++) {
      for (let x = 32; x <= 36; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 44; x <= 48; x++) {
        pixel(x, y, skinColor)
      }
    }
  }

  const drawClothes = (pixel, adjustBrightness, style, color, gender) => {
    const darkColor = adjustBrightness(color, -40)
    const lightColor = adjustBrightness(color, 30)
    const mysticColor = '#ffd700'
    const glowColor = adjustBrightness(color, 50)
    
    if (gender === 'male') {
      drawMaleMageRobe(pixel, adjustBrightness, color, darkColor, lightColor, mysticColor, glowColor)
    } else {
      drawFemaleMageRobe(pixel, adjustBrightness, color, darkColor, lightColor, mysticColor, glowColor)
    }
  }

  const drawMaleMageRobe = (pixel, adjustBrightness, color, darkColor, lightColor, mysticColor, glowColor) => {
    // 长袍主体
    for (let x = 26; x <= 54; x++) {
      for (let y = 44; y <= 88; y++) {
        pixel(x, y, color)
      }
    }
    
    // 袍子底部扩展
    for (let y = 82; y <= 88; y++) {
      pixel(24, y, color)
      pixel(25, y, color)
      pixel(55, y, color)
      pixel(56, y, color)
    }
    pixel(22, 86, darkColor)
    pixel(23, 86, darkColor)
    pixel(22, 87, darkColor)
    pixel(23, 87, darkColor)
    pixel(22, 88, darkColor)
    pixel(23, 88, darkColor)
    pixel(57, 86, darkColor)
    pixel(58, 86, darkColor)
    pixel(57, 87, darkColor)
    pixel(58, 87, darkColor)
    pixel(57, 88, darkColor)
    pixel(58, 88, darkColor)
    
    // 内层袍
    for (let x = 34; x <= 46; x++) {
      for (let y = 48; y <= 88; y++) {
        pixel(x, y, darkColor)
      }
    }
    
    // 神秘符文
    pixel(38, 52, mysticColor)
    pixel(39, 52, mysticColor)
    pixel(40, 52, mysticColor)
    pixel(41, 52, mysticColor)
    pixel(42, 52, mysticColor)
    pixel(36, 54, mysticColor)
    pixel(44, 54, mysticColor)
    pixel(38, 56, mysticColor)
    pixel(42, 56, mysticColor)
    pixel(40, 58, mysticColor)
    
    // 领口
    for (let x = 32; x <= 48; x++) {
      pixel(x, 44, darkColor)
      pixel(x, 45, lightColor)
      pixel(x, 46, darkColor)
    }
    
    // 宽袖
    for (let x = 18; x <= 26; x++) {
      for (let y = 48; y <= 64; y++) {
        pixel(x, y, color)
      }
    }
    for (let x = 54; x <= 62; x++) {
      for (let y = 48; y <= 64; y++) {
        pixel(x, y, color)
      }
    }
    pixel(16, 62, darkColor)
    pixel(17, 62, darkColor)
    pixel(16, 63, darkColor)
    pixel(17, 63, darkColor)
    pixel(63, 62, darkColor)
    pixel(64, 62, darkColor)
    pixel(63, 63, darkColor)
    pixel(64, 63, darkColor)
    
    // 腰带
    for (let x = 28; x <= 52; x++) {
      pixel(x, 72, '#8b0000')
    }
    pixel(38, 71, mysticColor)
    pixel(39, 71, mysticColor)
    pixel(40, 71, mysticColor)
    pixel(41, 71, mysticColor)
    pixel(42, 71, mysticColor)
    pixel(40, 72, mysticColor)
  }

  const drawFemaleMageRobe = (pixel, adjustBrightness, color, darkColor, lightColor, mysticColor, glowColor) => {
    // 优雅长袍
    for (let x = 28; x <= 52; x++) {
      for (let y = 44; y <= 88; y++) {
        pixel(x, y, color)
      }
    }
    
    // 袍子底部
    for (let y = 78; y <= 88; y++) {
      pixel(26, y, color)
      pixel(27, y, color)
      pixel(53, y, color)
      pixel(54, y, color)
    }
    for (let y = 84; y <= 88; y++) {
      pixel(24, y, darkColor)
      pixel(25, y, darkColor)
      pixel(55, y, darkColor)
      pixel(56, y, darkColor)
    }
    
    // 内层
    for (let x = 34; x <= 46; x++) {
      for (let y = 48; y <= 88; y++) {
        pixel(x, y, lightColor)
      }
    }
    
    // 精致符文
    pixel(38, 50, mysticColor)
    pixel(39, 50, mysticColor)
    pixel(40, 50, mysticColor)
    pixel(41, 50, mysticColor)
    pixel(42, 50, mysticColor)
    pixel(40, 52, mysticColor)
    pixel(38, 54, mysticColor)
    pixel(42, 54, mysticColor)
    pixel(36, 56, glowColor)
    pixel(44, 56, glowColor)
    pixel(40, 58, mysticColor)
    
    // 华丽领口
    for (let x = 32; x <= 48; x++) {
      pixel(x, 44, lightColor)
      pixel(x, 45, mysticColor)
      pixel(x, 46, lightColor)
    }
    pixel(34, 48, mysticColor)
    pixel(46, 48, mysticColor)
    
    // 合身袖子
    for (let x = 20; x <= 26; x++) {
      for (let y = 48; y <= 62; y++) {
        pixel(x, y, color)
      }
    }
    for (let x = 54; x <= 60; x++) {
      for (let y = 48; y <= 62; y++) {
        pixel(x, y, color)
      }
    }
    
    // 袖口
    for (let x = 20; x <= 26; x++) {
      pixel(x, 63, lightColor)
      pixel(x, 64, mysticColor)
    }
    for (let x = 54; x <= 60; x++) {
      pixel(x, 63, lightColor)
      pixel(x, 64, mysticColor)
    }
    
    // 腰带
    for (let x = 30; x <= 50; x++) {
      pixel(x, 68, '#8b0000')
      pixel(x, 69, '#ff0000')
    }
    pixel(38, 68, mysticColor)
    pixel(39, 68, mysticColor)
    pixel(40, 68, mysticColor)
    pixel(41, 68, mysticColor)
    pixel(42, 68, mysticColor)
  }

  const drawShoes = (pixel, adjustBrightness, color) => {
    const darkShoe = adjustBrightness(color, -40)
    const lightShoe = adjustBrightness(color, 20)
    
    for (let x = 30; x <= 38; x++) {
      pixel(x, 95, color)
      pixel(x, 96, color)
      pixel(x, 97, color)
    }
    pixel(30, 98, color)
    pixel(31, 98, color)
    pixel(32, 98, darkShoe)
    pixel(32, 95, lightShoe)
    
    for (let x = 42; x <= 50; x++) {
      pixel(x, 95, color)
      pixel(x, 96, color)
      pixel(x, 97, color)
    }
    pixel(48, 98, darkShoe)
    pixel(49, 98, color)
    pixel(50, 98, color)
    pixel(48, 95, lightShoe)
  }

  const drawHair = (pixel, adjustBrightness, style, color, gender) => {
    const darkHair = adjustBrightness(color, -40)
    const lightHair = adjustBrightness(color, 20)
    
    if (style === 'short') {
      if (gender === 'male') {
        for (let x = 28; x <= 52; x++) {
          for (let y = 8; y <= 12; y++) {
            pixel(x, y, color)
          }
        }
        for (let y = 13; y <= 18; y++) {
          pixel(26, y, color)
          pixel(27, y, color)
          pixel(53, y, color)
          pixel(54, y, color)
        }
        for (let x = 30; x <= 50; x += 4) {
          pixel(x, 6, color)
          pixel(x + 1, 6, darkHair)
        }
      } else {
        for (let x = 26; x <= 54; x++) {
          for (let y = 8; y <= 12; y++) {
            pixel(x, y, color)
          }
        }
        for (let y = 13; y <= 24; y++) {
          pixel(24, y, color)
          pixel(25, y, color)
          pixel(55, y, color)
          pixel(56, y, color)
        }
      }
    } else if (style === 'long') {
      for (let x = 26; x <= 54; x++) {
        for (let y = 8; y <= 12; y++) {
          pixel(x, y, color)
        }
      }
      for (let y = 13; y <= 46; y++) {
        pixel(22, y, color)
        pixel(23, y, color)
        pixel(24, y, color)
        pixel(57, y, color)
        pixel(58, y, color)
        pixel(59, y, color)
      }
      for (let y = 36; y <= 46; y++) {
        pixel(25, y, darkHair)
        pixel(56, y, darkHair)
      }
    } else if (style === 'ponytail') {
      for (let x = 28; x <= 52; x++) {
        for (let y = 8; y <= 12; y++) {
          pixel(x, y, color)
        }
      }
      for (let y = 13; y <= 18; y++) {
        pixel(26, y, color)
        pixel(27, y, color)
        pixel(53, y, color)
        pixel(54, y, color)
      }
      for (let y = 12; y <= 42; y++) {
        pixel(38, y, color)
        pixel(39, y, color)
        pixel(40, y, color)
        pixel(41, y, color)
        pixel(42, y, color)
      }
      for (let y = 30; y <= 42; y++) {
        pixel(37, y, darkHair)
        pixel(43, y, darkHair)
      }
    } else if (style === 'braids') {
      for (let x = 28; x <= 52; x++) {
        for (let y = 8; y <= 12; y++) {
          pixel(x, y, color)
        }
      }
      for (let y = 13; y <= 20; y++) {
        pixel(26, y, color)
        pixel(27, y, color)
        pixel(53, y, color)
        pixel(54, y, color)
      }
      for (let y = 21; y <= 50; y++) {
        pixel(24, y, color)
        pixel(25, y, color)
        pixel(26, y, color)
        if (y % 6 === 0) {
          pixel(23, y, darkHair)
          pixel(27, y, darkHair)
        }
      }
      for (let y = 21; y <= 50; y++) {
        pixel(54, y, color)
        pixel(55, y, color)
        pixel(56, y, color)
        if (y % 6 === 0) {
          pixel(53, y, darkHair)
          pixel(57, y, darkHair)
        }
      }
    } else if (style === 'bun') {
      for (let x = 28; x <= 52; x++) {
        for (let y = 8; y <= 12; y++) {
          pixel(x, y, color)
        }
      }
      for (let y = 13; y <= 20; y++) {
        pixel(26, y, color)
        pixel(27, y, color)
        pixel(53, y, color)
        pixel(54, y, color)
      }
      for (let x = 34; x <= 46; x++) {
        for (let y = 2; y <= 8; y++) {
          pixel(x, y, color)
        }
      }
      pixel(40, 2, '#daa520')
      pixel(40, 3, '#daa520')
      pixel(40, 4, '#ffd700')
    } else if (style === 'topknot') {
      for (let x = 28; x <= 52; x++) {
        for (let y = 10; y <= 12; y++) {
          pixel(x, y, color)
        }
      }
      for (let y = 13; y <= 16; y++) {
        pixel(26, y, color)
        pixel(27, y, color)
        pixel(53, y, color)
        pixel(54, y, color)
      }
      for (let x = 34; x <= 46; x++) {
        for (let y = 2; y <= 9; y++) {
          pixel(x, y, color)
        }
      }
    }
  }

  const drawFace = (pixel, adjustBrightness, skinColor, gender) => {
    const darkSkin = adjustBrightness(skinColor, -40)
    
    for (let x = 32; x <= 35; x++) {
      pixel(x, 22, '#ffffff')
      pixel(x, 23, '#ffffff')
    }
    for (let x = 45; x <= 48; x++) {
      pixel(x, 22, '#ffffff')
      pixel(x, 23, '#ffffff')
    }
    pixel(34, 24, '#000000')
    pixel(35, 24, '#000000')
    pixel(34, 25, '#000000')
    pixel(46, 24, '#000000')
    pixel(47, 24, '#000000')
    pixel(47, 25, '#000000')
    
    for (let x = 32; x <= 36; x++) {
      pixel(x, 18, darkSkin)
      pixel(x, 19, darkSkin)
    }
    for (let x = 44; x <= 48; x++) {
      pixel(x, 18, darkSkin)
      pixel(x, 19, darkSkin)
    }
    
    pixel(40, 26, darkSkin)
    pixel(40, 27, darkSkin)
    pixel(40, 28, darkSkin)
    pixel(39, 29, darkSkin)
    pixel(41, 29, darkSkin)
    
    for (let x = 38; x <= 42; x++) {
      pixel(x, 32, darkSkin)
    }
    pixel(39, 33, darkSkin)
    pixel(40, 33, darkSkin)
    pixel(41, 33, darkSkin)
    
    pixel(30, 28, adjustBrightness('#ff9999', -30))
    pixel(31, 28, adjustBrightness('#ff9999', -30))
    pixel(50, 28, adjustBrightness('#ff9999', -30))
    pixel(49, 28, adjustBrightness('#ff9999', -30))
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

export default MageCharacter

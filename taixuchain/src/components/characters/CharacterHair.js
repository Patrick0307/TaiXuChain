// 头发绘制函数 - 所有职业共享
export const drawHair = (pixel, adjustBrightness, style, color, gender) => {
  const darkHair = adjustBrightness(color, -40)
  const lightHair = adjustBrightness(color, 20)
  
  if (style === 'short') {
    if (gender === 'male') {
      // 男性短发 - 刺猬头
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
      // 刺猬效果
      for (let x = 30; x <= 50; x += 4) {
        pixel(x, 6, color)
        pixel(x + 1, 6, darkHair)
        pixel(x, 7, darkHair)
        pixel(x + 1, 5, color)
      }
    } else {
      // 女性短发 - 波波头
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
      pixel(26, 24, darkHair)
      pixel(27, 24, darkHair)
      pixel(53, 24, darkHair)
      pixel(54, 24, darkHair)
    }
  } else if (style === 'long') {
    // 长发
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
    // 发丝细节
    for (let y = 36; y <= 46; y++) {
      pixel(25, y, darkHair)
      pixel(56, y, darkHair)
    }
    pixel(23, 47, darkHair)
    pixel(24, 47, darkHair)
    pixel(57, 47, darkHair)
    pixel(58, 47, darkHair)
  } else if (style === 'topknot') {
    // 武士发髻
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
    // 发髻
    for (let x = 34; x <= 46; x++) {
      for (let y = 2; y <= 9; y++) {
        pixel(x, y, color)
      }
    }
    pixel(36, 1, darkHair)
    pixel(38, 1, color)
    pixel(40, 1, lightHair)
    pixel(42, 1, color)
    pixel(44, 1, darkHair)
  } else if (style === 'ponytail') {
    // 马尾
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
    // 马尾辫
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
    pixel(38, 43, darkHair)
    pixel(39, 43, darkHair)
    pixel(40, 43, darkHair)
    pixel(41, 43, darkHair)
    pixel(42, 43, darkHair)
  } else if (style === 'braids') {
    // 双辫
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
    // 左辫子
    for (let y = 21; y <= 50; y++) {
      pixel(24, y, color)
      pixel(25, y, color)
      pixel(26, y, color)
      if (y % 6 === 0) {
        pixel(23, y, darkHair)
        pixel(27, y, darkHair)
      }
    }
    // 右辫子
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
    // 发髻
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
    // 发髻
    for (let x = 34; x <= 46; x++) {
      for (let y = 2; y <= 8; y++) {
        pixel(x, y, color)
      }
    }
    pixel(36, 1, darkHair)
    pixel(38, 1, color)
    pixel(40, 1, lightHair)
    pixel(42, 1, color)
    pixel(44, 1, darkHair)
    // 发簪
    pixel(40, 2, '#daa520')
    pixel(40, 3, '#daa520')
    pixel(40, 4, '#ffd700')
  }
}

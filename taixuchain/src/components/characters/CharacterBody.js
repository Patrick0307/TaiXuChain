// 身体绘制函数 - 战士专用（魁梧/英姿飒爽）
export const drawWarriorBody = (pixel, adjustBrightness, skinColor, gender) => {
  const darkSkin = adjustBrightness(skinColor, -20)
  const lightSkin = adjustBrightness(skinColor, 10)
  
  if (gender === 'male') {
    // 男性 - 方形脸，更宽
    for (let x = 26; x <= 54; x++) {
      for (let y = 10; y <= 38; y++) {
        if (x === 26 && (y < 14 || y > 34)) continue
        if (x === 27 && (y < 12 || y > 36)) continue
        if (x === 54 && (y < 14 || y > 34)) continue
        if (x === 53 && (y < 12 || y > 36)) continue
        pixel(x, y, skinColor)
      }
    }
    
    // 方下巴
    for (let x = 32; x <= 48; x++) {
      pixel(x, 39, skinColor)
    }
    pixel(33, 40, skinColor)
    pixel(34, 40, skinColor)
    pixel(46, 40, skinColor)
    pixel(47, 40, skinColor)
    
    // 粗壮脖子
    for (let x = 32; x <= 48; x++) {
      for (let y = 41; y <= 44; y++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 肌肉阴影
    pixel(28, 20, darkSkin)
    pixel(29, 20, darkSkin)
    pixel(52, 20, darkSkin)
    pixel(51, 20, darkSkin)
    
    // 粗壮手臂 - 有肌肉线条
    for (let y = 48; y <= 68; y++) {
      for (let x = 16; x <= 25; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 55; x <= 64; x++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 肌肉线条
    for (let y = 52; y <= 60; y++) {
      pixel(20, y, lightSkin)
      pixel(60, y, lightSkin)
    }
    for (let y = 54; y <= 58; y++) {
      pixel(18, y, darkSkin)
      pixel(62, y, darkSkin)
    }
    
    // 大手
    for (let x = 16; x <= 25; x++) {
      pixel(x, 69, skinColor)
      pixel(x, 70, skinColor)
      pixel(x, 71, darkSkin)
    }
    for (let x = 55; x <= 64; x++) {
      pixel(x, 69, skinColor)
      pixel(x, 70, skinColor)
      pixel(x, 71, darkSkin)
    }
    
    // 粗壮大腿
    for (let y = 88; y <= 94; y++) {
      for (let x = 30; x <= 38; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 42; x <= 50; x++) {
        pixel(x, y, skinColor)
      }
    }
    
  } else {
    // 女性 - 瓜子脸，更精致
    for (let x = 28; x <= 52; x++) {
      for (let y = 12; y <= 36; y++) {
        if (x === 28 && (y < 16 || y > 32)) continue
        if (x === 29 && (y < 14 || y > 34)) continue
        if (x === 52 && (y < 16 || y > 32)) continue
        if (x === 51 && (y < 14 || y > 34)) continue
        pixel(x, y, skinColor)
      }
    }
    
    // 尖下巴
    for (let x = 36; x <= 44; x++) {
      pixel(x, 37, skinColor)
    }
    pixel(38, 38, skinColor)
    pixel(39, 38, skinColor)
    pixel(40, 38, skinColor)
    pixel(41, 38, skinColor)
    pixel(42, 38, skinColor)
    pixel(39, 39, skinColor)
    pixel(40, 39, skinColor)
    pixel(41, 39, skinColor)
    
    // 细长脖子
    for (let x = 36; x <= 44; x++) {
      for (let y = 40; y <= 44; y++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 脸部高光
    pixel(30, 18, lightSkin)
    pixel(31, 18, lightSkin)
    pixel(50, 18, lightSkin)
    pixel(49, 18, lightSkin)
    
    // 纤细手臂
    for (let y = 48; y <= 66; y++) {
      for (let x = 20; x <= 24; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 56; x <= 60; x++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 小手
    for (let x = 20; x <= 24; x++) {
      pixel(x, 67, skinColor)
      pixel(x, 68, darkSkin)
    }
    for (let x = 56; x <= 60; x++) {
      pixel(x, 67, skinColor)
      pixel(x, 68, darkSkin)
    }
    
    // 修长腿部
    for (let y = 88; y <= 94; y++) {
      for (let x = 32; x <= 36; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 44; x <= 48; x++) {
        pixel(x, y, skinColor)
      }
    }
  }
}

// 弓修身体 - 灵活高瘦/苗条可爱
export const drawArcherBody = (pixel, adjustBrightness, skinColor, gender) => {
  const darkSkin = adjustBrightness(skinColor, -20)
  const lightSkin = adjustBrightness(skinColor, 10)
  
  if (gender === 'male') {
    // 男性 - 帅气灵活，高瘦，长脸
    for (let x = 29; x <= 51; x++) {
      for (let y = 10; y <= 36; y++) {
        if (x === 29 && (y < 14 || y > 32)) continue
        if (x === 30 && (y < 12 || y > 34)) continue
        if (x === 51 && (y < 14 || y > 32)) continue
        if (x === 50 && (y < 12 || y > 34)) continue
        pixel(x, y, skinColor)
      }
    }
    
    // 尖下巴
    for (let x = 36; x <= 44; x++) {
      pixel(x, 37, skinColor)
    }
    pixel(38, 38, skinColor)
    pixel(39, 38, skinColor)
    pixel(40, 38, skinColor)
    pixel(41, 38, skinColor)
    pixel(42, 38, skinColor)
    
    // 修长脖子
    for (let x = 36; x <= 44; x++) {
      for (let y = 39; y <= 43; y++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 脸部高光
    pixel(31, 18, lightSkin)
    pixel(32, 18, lightSkin)
    pixel(49, 18, lightSkin)
    pixel(48, 18, lightSkin)
    
    // 瘦长手臂 - 有力但不粗壮
    for (let y = 48; y <= 67; y++) {
      for (let x = 20; x <= 23; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 57; x <= 60; x++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 手部
    for (let x = 20; x <= 23; x++) {
      pixel(x, 68, skinColor)
      pixel(x, 69, darkSkin)
    }
    for (let x = 57; x <= 60; x++) {
      pixel(x, 68, skinColor)
      pixel(x, 69, darkSkin)
    }
    
    // 修长腿部
    for (let y = 88; y <= 94; y++) {
      for (let x = 33; x <= 36; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 44; x <= 47; x++) {
        pixel(x, y, skinColor)
      }
    }
    
  } else {
    // 女性 - 娇小可爱，圆圆的小脸
    for (let x = 30; x <= 50; x++) {
      for (let y = 14; y <= 34; y++) {
        if (x === 30 && (y < 18 || y > 30)) continue
        if (x === 31 && (y < 16 || y > 32)) continue
        if (x === 50 && (y < 18 || y > 30)) continue
        if (x === 49 && (y < 16 || y > 32)) continue
        pixel(x, y, skinColor)
      }
    }
    
    // 圆润可爱下巴
    for (let x = 36; x <= 44; x++) {
      pixel(x, 35, skinColor)
    }
    pixel(38, 36, skinColor)
    pixel(39, 36, skinColor)
    pixel(40, 36, skinColor)
    pixel(41, 36, skinColor)
    pixel(42, 36, skinColor)
    
    // 细细的脖子
    for (let x = 38; x <= 42; x++) {
      for (let y = 37; y <= 42; y++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 可爱脸颊高光
    pixel(32, 20, lightSkin)
    pixel(33, 20, lightSkin)
    pixel(34, 20, lightSkin)
    pixel(48, 20, lightSkin)
    pixel(47, 20, lightSkin)
    pixel(46, 20, lightSkin)
    
    // 娇小纤细手臂
    for (let y = 48; y <= 65; y++) {
      for (let x = 22; x <= 23; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 57; x <= 58; x++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 小小手
    pixel(22, 66, skinColor)
    pixel(23, 66, skinColor)
    pixel(22, 67, darkSkin)
    pixel(23, 67, darkSkin)
    pixel(57, 66, skinColor)
    pixel(58, 66, skinColor)
    pixel(57, 67, darkSkin)
    pixel(58, 67, darkSkin)
    
    // 娇小腿部
    for (let y = 88; y <= 94; y++) {
      for (let x = 34; x <= 35; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 45; x <= 46; x++) {
        pixel(x, y, skinColor)
      }
    }
  }
}

// 术士身体 - 沉稳知识渊博/高贵御姐
export const drawMageBody = (pixel, adjustBrightness, skinColor, gender) => {
  const darkSkin = adjustBrightness(skinColor, -20)
  const lightSkin = adjustBrightness(skinColor, 10)
  
  if (gender === 'male') {
    // 男性 - 沉稳知识渊博，方正脸型
    for (let x = 28; x <= 52; x++) {
      for (let y = 11; y <= 37; y++) {
        if (x === 28 && (y < 15 || y > 33)) continue
        if (x === 29 && (y < 13 || y > 35)) continue
        if (x === 52 && (y < 15 || y > 33)) continue
        if (x === 51 && (y < 13 || y > 35)) continue
        pixel(x, y, skinColor)
      }
    }
    
    // 方正下巴
    for (let x = 33; x <= 47; x++) {
      pixel(x, 38, skinColor)
    }
    pixel(34, 39, skinColor)
    pixel(35, 39, skinColor)
    pixel(45, 39, skinColor)
    pixel(46, 39, skinColor)
    
    // 修长脖子
    for (let x = 35; x <= 45; x++) {
      for (let y = 40; y <= 43; y++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 智慧额头高光
    for (let x = 34; x <= 46; x++) {
      pixel(x, 14, lightSkin)
    }
    
    // 纤细手臂 - 学者型
    for (let y = 48; y <= 64; y++) {
      for (let x = 22; x <= 24; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 56; x <= 58; x++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 修长手指
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
      for (let x = 33; x <= 36; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 44; x <= 47; x++) {
        pixel(x, y, skinColor)
      }
    }
    
  } else {
    // 女性 - 高贵美丽御姐，鹅蛋脸
    for (let x = 28; x <= 52; x++) {
      for (let y = 11; y <= 36; y++) {
        if (x === 28 && (y < 15 || y > 32)) continue
        if (x === 29 && (y < 13 || y > 34)) continue
        if (x === 52 && (y < 15 || y > 32)) continue
        if (x === 51 && (y < 13 || y > 34)) continue
        pixel(x, y, skinColor)
      }
    }
    
    // 优雅尖下巴
    for (let x = 36; x <= 44; x++) {
      pixel(x, 37, skinColor)
    }
    pixel(38, 38, skinColor)
    pixel(39, 38, skinColor)
    pixel(40, 38, skinColor)
    pixel(41, 38, skinColor)
    pixel(42, 38, skinColor)
    pixel(39, 39, skinColor)
    pixel(40, 39, skinColor)
    pixel(41, 39, skinColor)
    pixel(40, 40, skinColor)
    
    // 修长天鹅颈
    for (let x = 36; x <= 44; x++) {
      for (let y = 41; y <= 44; y++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 高贵额头和脸颊高光
    for (let x = 33; x <= 47; x++) {
      pixel(x, 14, lightSkin)
    }
    pixel(30, 20, lightSkin)
    pixel(31, 20, lightSkin)
    pixel(50, 20, lightSkin)
    pixel(49, 20, lightSkin)
    
    // 优雅纤细手臂
    for (let y = 48; y <= 64; y++) {
      for (let x = 22; x <= 24; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 56; x <= 58; x++) {
        pixel(x, y, skinColor)
      }
    }
    
    // 修长手指
    for (let x = 22; x <= 24; x++) {
      pixel(x, 65, skinColor)
      pixel(x, 66, darkSkin)
    }
    for (let x = 56; x <= 58; x++) {
      pixel(x, 65, skinColor)
      pixel(x, 66, darkSkin)
    }
    
    // 修长腿部
    for (let y = 88; y <= 94; y++) {
      for (let x = 33; x <= 36; x++) {
        pixel(x, y, skinColor)
      }
      for (let x = 44; x <= 47; x++) {
        pixel(x, y, skinColor)
      }
    }
  }
}

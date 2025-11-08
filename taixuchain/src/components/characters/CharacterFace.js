// 脸部绘制函数 - 战士专用
export const drawWarriorFace = (pixel, adjustBrightness, skinColor, gender) => {
  const darkSkin = adjustBrightness(skinColor, -40)
  const lightSkin = adjustBrightness(skinColor, 15)
  
  if (gender === 'male') {
    // 男性 - 刚毅的脸
    // 眼睛 - 较小，有神
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
    pixel(35, 25, '#000000')
    pixel(46, 24, '#000000')
    pixel(47, 24, '#000000')
    pixel(46, 25, '#000000')
    pixel(47, 25, '#000000')
    
    // 浓眉
    for (let x = 31; x <= 37; x++) {
      pixel(x, 18, darkSkin)
      pixel(x, 19, darkSkin)
      pixel(x, 20, darkSkin)
    }
    for (let x = 43; x <= 49; x++) {
      pixel(x, 18, darkSkin)
      pixel(x, 19, darkSkin)
      pixel(x, 20, darkSkin)
    }
    
    // 高鼻梁
    pixel(40, 26, darkSkin)
    pixel(40, 27, darkSkin)
    pixel(40, 28, darkSkin)
    pixel(40, 29, darkSkin)
    pixel(39, 30, darkSkin)
    pixel(41, 30, darkSkin)
    pixel(38, 31, darkSkin)
    pixel(42, 31, darkSkin)
    
    // 坚毅的嘴
    for (let x = 37; x <= 43; x++) {
      pixel(x, 33, darkSkin)
    }
    pixel(38, 34, darkSkin)
    pixel(39, 34, darkSkin)
    pixel(40, 34, darkSkin)
    pixel(41, 34, darkSkin)
    pixel(42, 34, darkSkin)
    
    // 胡茬
    pixel(36, 35, darkSkin)
    pixel(37, 36, darkSkin)
    pixel(38, 36, darkSkin)
    pixel(42, 36, darkSkin)
    pixel(43, 36, darkSkin)
    pixel(44, 35, darkSkin)
    
    // 脸部轮廓阴影
    for (let y = 22; y <= 30; y++) {
      pixel(28, y, darkSkin)
      pixel(52, y, darkSkin)
    }
    
  } else {
    // 女性 - 英姿飒爽的脸
    // 眼睛 - 较大，明亮
    for (let x = 31; x <= 36; x++) {
      pixel(x, 21, '#ffffff')
      pixel(x, 22, '#ffffff')
      pixel(x, 23, '#ffffff')
    }
    for (let x = 44; x <= 49; x++) {
      pixel(x, 21, '#ffffff')
      pixel(x, 22, '#ffffff')
      pixel(x, 23, '#ffffff')
    }
    
    // 瞳孔 - 有神采
    pixel(33, 23, '#000000')
    pixel(34, 23, '#000000')
    pixel(35, 23, '#000000')
    pixel(33, 24, '#000000')
    pixel(34, 24, '#000000')
    pixel(35, 24, '#000000')
    pixel(34, 25, '#000000')
    
    pixel(46, 23, '#000000')
    pixel(47, 23, '#000000')
    pixel(48, 23, '#000000')
    pixel(46, 24, '#000000')
    pixel(47, 24, '#000000')
    pixel(48, 24, '#000000')
    pixel(47, 25, '#000000')
    
    // 眼睛高光
    pixel(33, 22, lightSkin)
    pixel(47, 22, lightSkin)
    
    // 细长眉毛
    for (let x = 31; x <= 37; x++) {
      pixel(x, 17, darkSkin)
      pixel(x, 18, darkSkin)
    }
    for (let x = 43; x <= 49; x++) {
      pixel(x, 17, darkSkin)
      pixel(x, 18, darkSkin)
    }
    
    // 秀气鼻子
    pixel(40, 27, darkSkin)
    pixel(40, 28, darkSkin)
    pixel(40, 29, darkSkin)
    pixel(39, 30, darkSkin)
    pixel(41, 30, darkSkin)
    
    // 小嘴
    for (let x = 38; x <= 42; x++) {
      pixel(x, 32, darkSkin)
    }
    pixel(39, 33, darkSkin)
    pixel(40, 33, darkSkin)
    pixel(41, 33, darkSkin)
    
    // 微笑
    pixel(37, 32, darkSkin)
    pixel(43, 32, darkSkin)
    
    // 脸颊红晕
    pixel(29, 28, adjustBrightness('#ff9999', -20))
    pixel(30, 28, adjustBrightness('#ff9999', -20))
    pixel(31, 28, adjustBrightness('#ff9999', -20))
    pixel(51, 28, adjustBrightness('#ff9999', -20))
    pixel(50, 28, adjustBrightness('#ff9999', -20))
    pixel(49, 28, adjustBrightness('#ff9999', -20))
    
    // 脸部高光
    pixel(32, 20, lightSkin)
    pixel(33, 20, lightSkin)
    pixel(48, 20, lightSkin)
    pixel(47, 20, lightSkin)
  }
}

// 弓修脸部 - 帅气灵活/苗条可爱
export const drawArcherFace = (pixel, adjustBrightness, skinColor, gender) => {
  const darkSkin = adjustBrightness(skinColor, -40)
  const lightSkin = adjustBrightness(skinColor, 15)
  
  if (gender === 'male') {
    // 男性 - 帅气灵活，狭长眼睛
    // 狭长眼睛
    for (let x = 31; x <= 36; x++) {
      pixel(x, 21, '#ffffff')
      pixel(x, 22, '#ffffff')
    }
    for (let x = 44; x <= 49; x++) {
      pixel(x, 21, '#ffffff')
      pixel(x, 22, '#ffffff')
    }
    
    // 瞳孔 - 有神
    pixel(33, 22, '#000000')
    pixel(34, 22, '#000000')
    pixel(35, 22, '#000000')
    pixel(34, 23, '#000000')
    
    pixel(46, 22, '#000000')
    pixel(47, 22, '#000000')
    pixel(48, 22, '#000000')
    pixel(47, 23, '#000000')
    
    // 眼睛高光
    pixel(33, 21, lightSkin)
    pixel(47, 21, lightSkin)
    
    // 剑眉
    for (let x = 31; x <= 37; x++) {
      pixel(x, 17, darkSkin)
      pixel(x, 18, darkSkin)
    }
    pixel(32, 16, darkSkin)
    
    for (let x = 43; x <= 49; x++) {
      pixel(x, 17, darkSkin)
      pixel(x, 18, darkSkin)
    }
    pixel(48, 16, darkSkin)
    
    // 高挺鼻梁
    pixel(40, 25, darkSkin)
    pixel(40, 26, darkSkin)
    pixel(40, 27, darkSkin)
    pixel(40, 28, darkSkin)
    pixel(39, 29, darkSkin)
    pixel(41, 29, darkSkin)
    
    // 帅气嘴型
    for (let x = 38; x <= 42; x++) {
      pixel(x, 31, darkSkin)
    }
    pixel(39, 32, darkSkin)
    pixel(40, 32, darkSkin)
    pixel(41, 32, darkSkin)
    
    // 微笑
    pixel(37, 31, darkSkin)
    pixel(43, 31, darkSkin)
    
    // 脸部轮廓
    for (let y = 20; y <= 28; y++) {
      pixel(30, y, darkSkin)
      pixel(50, y, darkSkin)
    }
    
  } else {
    // 女性 - 苗条可爱，大眼睛
    // 大眼睛 - 可爱
    for (let x = 31; x <= 36; x++) {
      pixel(x, 20, '#ffffff')
      pixel(x, 21, '#ffffff')
      pixel(x, 22, '#ffffff')
      pixel(x, 23, '#ffffff')
    }
    for (let x = 44; x <= 49; x++) {
      pixel(x, 20, '#ffffff')
      pixel(x, 21, '#ffffff')
      pixel(x, 22, '#ffffff')
      pixel(x, 23, '#ffffff')
    }
    
    // 瞳孔 - 水汪汪
    pixel(33, 22, '#000000')
    pixel(34, 22, '#000000')
    pixel(35, 22, '#000000')
    pixel(33, 23, '#000000')
    pixel(34, 23, '#000000')
    pixel(35, 23, '#000000')
    pixel(34, 24, '#000000')
    
    pixel(46, 22, '#000000')
    pixel(47, 22, '#000000')
    pixel(48, 22, '#000000')
    pixel(46, 23, '#000000')
    pixel(47, 23, '#000000')
    pixel(48, 23, '#000000')
    pixel(47, 24, '#000000')
    
    // 眼睛高光 - 闪亮
    pixel(33, 21, lightSkin)
    pixel(34, 21, lightSkin)
    pixel(47, 21, lightSkin)
    pixel(48, 21, lightSkin)
    
    // 细眉毛
    for (let x = 31; x <= 37; x++) {
      pixel(x, 16, darkSkin)
      pixel(x, 17, darkSkin)
    }
    for (let x = 43; x <= 49; x++) {
      pixel(x, 16, darkSkin)
      pixel(x, 17, darkSkin)
    }
    
    // 小巧鼻子
    pixel(40, 26, darkSkin)
    pixel(40, 27, darkSkin)
    pixel(39, 28, darkSkin)
    pixel(41, 28, darkSkin)
    
    // 小嘴 - 可爱
    for (let x = 39; x <= 41; x++) {
      pixel(x, 30, darkSkin)
    }
    pixel(40, 31, darkSkin)
    
    // 微笑
    pixel(38, 30, darkSkin)
    pixel(42, 30, darkSkin)
    
    // 脸颊红晕 - 可爱
    pixel(30, 26, adjustBrightness('#ff9999', -15))
    pixel(31, 26, adjustBrightness('#ff9999', -15))
    pixel(32, 26, adjustBrightness('#ff9999', -15))
    pixel(30, 27, adjustBrightness('#ff9999', -15))
    pixel(31, 27, adjustBrightness('#ff9999', -15))
    
    pixel(50, 26, adjustBrightness('#ff9999', -15))
    pixel(49, 26, adjustBrightness('#ff9999', -15))
    pixel(48, 26, adjustBrightness('#ff9999', -15))
    pixel(50, 27, adjustBrightness('#ff9999', -15))
    pixel(49, 27, adjustBrightness('#ff9999', -15))
  }
}

// 术士脸部 - 沉稳知识渊博/高贵御姐
export const drawMageFace = (pixel, adjustBrightness, skinColor, gender) => {
  const darkSkin = adjustBrightness(skinColor, -40)
  const lightSkin = adjustBrightness(skinColor, 15)
  
  if (gender === 'male') {
    // 男性 - 沉稳知识渊博，深邃眼神，方正脸型
    // 深邃眼睛 - 较小
    for (let x = 33; x <= 36; x++) {
      pixel(x, 21, '#ffffff')
      pixel(x, 22, '#ffffff')
    }
    for (let x = 44; x <= 47; x++) {
      pixel(x, 21, '#ffffff')
      pixel(x, 22, '#ffffff')
    }
    
    // 瞳孔 - 深邃有神
    pixel(34, 22, '#000000')
    pixel(35, 22, '#000000')
    pixel(34, 23, '#000000')
    pixel(35, 23, '#000000')
    pixel(34, 24, '#000000')
    
    pixel(45, 22, '#000000')
    pixel(46, 22, '#000000')
    pixel(45, 23, '#000000')
    pixel(46, 23, '#000000')
    pixel(46, 24, '#000000')
    
    // 浓密智慧眉毛 - 略微上扬
    for (let x = 31; x <= 37; x++) {
      pixel(x, 17, darkSkin)
      pixel(x, 18, darkSkin)
      pixel(x, 19, darkSkin)
    }
    pixel(36, 16, darkSkin)
    pixel(37, 16, darkSkin)
    
    for (let x = 43; x <= 49; x++) {
      pixel(x, 17, darkSkin)
      pixel(x, 18, darkSkin)
      pixel(x, 19, darkSkin)
    }
    pixel(43, 16, darkSkin)
    pixel(44, 16, darkSkin)
    
    // 高挺鼻梁
    pixel(40, 26, darkSkin)
    pixel(40, 27, darkSkin)
    pixel(40, 28, darkSkin)
    pixel(40, 29, darkSkin)
    pixel(40, 30, darkSkin)
    pixel(39, 31, darkSkin)
    pixel(41, 31, darkSkin)
    
    // 沉稳的嘴 - 紧闭
    for (let x = 38; x <= 42; x++) {
      pixel(x, 33, darkSkin)
    }
    pixel(39, 34, darkSkin)
    pixel(40, 34, darkSkin)
    pixel(41, 34, darkSkin)
    
    // 山羊胡
    pixel(39, 36, darkSkin)
    pixel(40, 36, darkSkin)
    pixel(41, 36, darkSkin)
    pixel(40, 37, darkSkin)
    pixel(40, 38, darkSkin)
    
    // 络腮胡轮廓
    pixel(36, 35, darkSkin)
    pixel(37, 36, darkSkin)
    pixel(38, 36, darkSkin)
    pixel(42, 36, darkSkin)
    pixel(43, 36, darkSkin)
    pixel(44, 35, darkSkin)
    
    // 智慧纹路
    pixel(31, 19, darkSkin)
    pixel(32, 20, darkSkin)
    pixel(49, 19, darkSkin)
    pixel(48, 20, darkSkin)
    
    // 眼角纹路
    pixel(37, 24, darkSkin)
    pixel(43, 24, darkSkin)
    
  } else {
    // 女性 - 高贵美丽御姐，凤眼，鹅蛋脸
    // 凤眼 - 高贵修长
    for (let x = 30; x <= 38; x++) {
      pixel(x, 20, '#ffffff')
      pixel(x, 21, '#ffffff')
      pixel(x, 22, '#ffffff')
      pixel(x, 23, '#ffffff')
    }
    for (let x = 42; x <= 50; x++) {
      pixel(x, 20, '#ffffff')
      pixel(x, 21, '#ffffff')
      pixel(x, 22, '#ffffff')
      pixel(x, 23, '#ffffff')
    }
    
    // 瞳孔 - 深邃迷人，带眼线效果
    pixel(32, 22, '#000000')
    pixel(33, 22, '#000000')
    pixel(34, 22, '#000000')
    pixel(35, 22, '#000000')
    pixel(36, 22, '#000000')
    pixel(33, 23, '#000000')
    pixel(34, 23, '#000000')
    pixel(35, 23, '#000000')
    pixel(36, 23, '#000000')
    pixel(34, 24, '#000000')
    pixel(35, 24, '#000000')
    
    pixel(44, 22, '#000000')
    pixel(45, 22, '#000000')
    pixel(46, 22, '#000000')
    pixel(47, 22, '#000000')
    pixel(48, 22, '#000000')
    pixel(44, 23, '#000000')
    pixel(45, 23, '#000000')
    pixel(46, 23, '#000000')
    pixel(47, 23, '#000000')
    pixel(45, 24, '#000000')
    pixel(46, 24, '#000000')
    
    // 眼线
    pixel(30, 24, darkSkin)
    pixel(31, 24, darkSkin)
    pixel(37, 24, darkSkin)
    pixel(38, 24, darkSkin)
    pixel(42, 24, darkSkin)
    pixel(43, 24, darkSkin)
    pixel(49, 24, darkSkin)
    pixel(50, 24, darkSkin)
    
    // 眼睛高光 - 明亮
    pixel(33, 21, lightSkin)
    pixel(34, 21, lightSkin)
    pixel(46, 21, lightSkin)
    pixel(47, 21, lightSkin)
    
    // 柳叶眉 - 优雅细长
    for (let x = 29; x <= 39; x++) {
      pixel(x, 15, darkSkin)
      pixel(x, 16, darkSkin)
    }
    pixel(38, 14, darkSkin)
    pixel(39, 14, darkSkin)
    
    for (let x = 41; x <= 51; x++) {
      pixel(x, 15, darkSkin)
      pixel(x, 16, darkSkin)
    }
    pixel(41, 14, darkSkin)
    pixel(42, 14, darkSkin)
    
    // 高挺精致鼻梁
    pixel(40, 26, darkSkin)
    pixel(40, 27, darkSkin)
    pixel(40, 28, darkSkin)
    pixel(40, 29, darkSkin)
    pixel(40, 30, darkSkin)
    pixel(39, 31, darkSkin)
    pixel(41, 31, darkSkin)
    
    // 优雅红唇 - 饱满
    for (let x = 37; x <= 43; x++) {
      pixel(x, 32, adjustBrightness('#ff0000', -40))
    }
    pixel(38, 33, adjustBrightness('#ff0000', -40))
    pixel(39, 33, adjustBrightness('#ff0000', -40))
    pixel(40, 33, adjustBrightness('#ff0000', -40))
    pixel(41, 33, adjustBrightness('#ff0000', -40))
    pixel(42, 33, adjustBrightness('#ff0000', -40))
    
    // 唇部高光 - 性感
    pixel(38, 32, adjustBrightness('#ff0000', -20))
    pixel(39, 32, adjustBrightness('#ff0000', -20))
    pixel(40, 32, adjustBrightness('#ff0000', -15))
    pixel(41, 32, adjustBrightness('#ff0000', -20))
    pixel(42, 32, adjustBrightness('#ff0000', -20))
    pixel(41, 32, adjustBrightness('#ff0000', -20))
    
    // 高贵气质 - 脸颊轻微红晕
    pixel(30, 27, adjustBrightness('#ff9999', -25))
    pixel(31, 27, adjustBrightness('#ff9999', -25))
    pixel(50, 27, adjustBrightness('#ff9999', -25))
    pixel(49, 27, adjustBrightness('#ff9999', -25))
    
    // 美人痣（可选）
    pixel(43, 29, darkSkin)
  }
}

// 鞋子绘制函数 - 所有职业共享
export const drawShoes = (pixel, adjustBrightness, color) => {
  const darkShoe = adjustBrightness(color, -40)
  const lightShoe = adjustBrightness(color, 20)
  
  // 左靴
  for (let x = 30; x <= 38; x++) {
    pixel(x, 95, color)
    pixel(x, 96, color)
    pixel(x, 97, color)
  }
  pixel(30, 98, color)
  pixel(31, 98, color)
  pixel(32, 98, color)
  pixel(33, 98, color)
  pixel(34, 98, darkShoe)
  pixel(32, 95, lightShoe)
  pixel(33, 95, lightShoe)
  pixel(34, 95, lightShoe)
  
  // 右靴
  for (let x = 42; x <= 50; x++) {
    pixel(x, 95, color)
    pixel(x, 96, color)
    pixel(x, 97, color)
  }
  pixel(46, 98, darkShoe)
  pixel(47, 98, color)
  pixel(48, 98, color)
  pixel(49, 98, color)
  pixel(50, 98, color)
  pixel(46, 95, lightShoe)
  pixel(47, 95, lightShoe)
  pixel(48, 95, lightShoe)
}

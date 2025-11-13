import { useEffect, useRef, useState } from 'react'
import MapUI from './MapUI'
import MapCharacter from './MapCharacter'
import '../../css/maps/ForestMap.css'

function ForestMap({ character, onExit }) {
  const canvasRef = useRef(null)
  const [mapData, setMapData] = useState(null)
  const [playerPos, setPlayerPos] = useState({ x: 800, y: 800 })
  const keysRef = useRef({}) // 改用 ref 存储键盘状态
  const [isLoading, setIsLoading] = useState(true)
  const [tileImages, setTileImages] = useState({})
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [direction, setDirection] = useState('down') // 角色朝向
  const [isMoving, setIsMoving] = useState(false) // 是否在移动
  const [walkFrame, setWalkFrame] = useState(0) // 行走动画帧
  const [collisionObjects, setCollisionObjects] = useState([]) // 碰撞区域
  const animationFrameRef = useRef(null)
  const walkAnimationRef = useRef(null)
  const playerPosRef = useRef({ x: 800, y: 800 }) // 用 ref 存储实时位置
  const directionRef = useRef('down') // 用 ref 存储实时朝向
  const isMovingRef = useRef(false) // 用 ref 存储实时移动状态

  const TILE_SIZE = 32
  const PLAYER_SIZE = 10  // 非常小的角色
  const MOVE_SPEED = 1.5  // 固定速度（降低移动速度）
  const MAP_SCALE = 2.5  // 放大地图2.5倍

  // 碰撞检测函数 - 检查角色是否与碰撞区域重叠
  const checkCollision = (x, y, width, height) => {
    for (const obj of collisionObjects) {
      // AABB (Axis-Aligned Bounding Box) 碰撞检测
      if (
        x < obj.x + obj.width &&
        x + width > obj.x &&
        y < obj.y + obj.height &&
        y + height > obj.y
      ) {
        return true // 发生碰撞
      }
    }
    return false // 没有碰撞
  }

  // 加载地图数据和所有瓦片图片
  useEffect(() => {
    fetch('/maps/forest.tmj')
      .then(res => res.json())
      .then(data => {
        console.log('Map loaded:', data)
        setMapData(data)
        
        // 提取碰撞对象
        const collisionLayer = data.layers.find(layer => layer.name === 'collision')
        if (collisionLayer && collisionLayer.objects) {
          const collisions = collisionLayer.objects
            .filter(obj => {
              // 检查对象是否有 collision 属性且为 true
              const hasCollision = obj.properties?.some(
                prop => prop.name === 'Value' && prop.value === true
              )
              return hasCollision
            })
            .map(obj => ({
              x: obj.x,
              y: obj.y,
              width: obj.width,
              height: obj.height
            }))
          
          console.log(`Found ${collisions.length} collision objects`)
          setCollisionObjects(collisions)
        } else {
          console.warn('No collision layer found in map')
        }
        
        // 从所有tileset中提取瓦片图片
        const loadedImages = {}
        let totalImages = 0
        let loadedCount = 0
        
        // 计算总图片数
        data.tilesets.forEach(tileset => {
          totalImages += (tileset.tiles || []).length
        })
        
        console.log(`Loading ${totalImages} tile images from ${data.tilesets.length} tilesets...`)
        
        if (totalImages === 0) {
          console.warn('No tiles found in tilesets!')
          setIsLoading(false)
          return
        }
        
        // 遍历所有tileset
        data.tilesets.forEach(tileset => {
          const tiles = tileset.tiles || []
          console.log(`Tileset "${tileset.name}" - firstgid: ${tileset.firstgid}, tiles: ${tiles.length}`)
          
          // 加载每个瓦片图片
          tiles.forEach(tile => {
            const img = new Image()
            // 图片路径是相对于maps文件夹的，需要转换
            const imagePath = tile.image.replace('../tiles/', '/tiles/')
            img.src = imagePath
            
            img.onload = () => {
              // 使用 firstgid + tile.id 作为key
              const gid = tileset.firstgid + tile.id
              loadedImages[gid] = {
                image: img,
                width: tile.imagewidth,
                height: tile.imageheight
              }
              loadedCount++
              setLoadingProgress(Math.floor((loadedCount / totalImages) * 100))
              
              if (loadedCount === totalImages) {
                console.log(`All ${totalImages} tiles loaded!`, Object.keys(loadedImages).length, 'unique GIDs')
                setTileImages(loadedImages)
                setIsLoading(false)
              }
            }
            
            img.onerror = () => {
              console.warn(`Failed to load: ${imagePath}`)
              loadedCount++
              setLoadingProgress(Math.floor((loadedCount / totalImages) * 100))
              
              if (loadedCount === totalImages) {
                console.log(`Loaded ${Object.keys(loadedImages).length} tiles (${totalImages - Object.keys(loadedImages).length} failed)`)
                setTileImages(loadedImages)
                setIsLoading(false)
              }
            }
          })
        })
      })
      .catch(err => {
        console.error('Failed to load map:', err)
        setIsLoading(false)
      })
  }, [])

  // 键盘控制 - 优化版，避免重复触发
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onExit()
        return
      }
      // 防止按键重复触发
      if (e.repeat) return
      keysRef.current[e.key] = true
    }

    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onExit])

  // 移动角色和行走动画（使用RAF确保流畅）
  useEffect(() => {
    if (!mapData) return

    let lastTime = performance.now()
    let moveAnimationId

    const moveLoop = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 16.67 // 标准化到60fps
      lastTime = currentTime

      const keys = keysRef.current
      let moving = false
      let newDirection = directionRef.current

      let newX = playerPosRef.current.x
      let newY = playerPosRef.current.y

      const speed = MOVE_SPEED * deltaTime

      // 尝试移动
      let attemptX = newX
      let attemptY = newY

      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        attemptX -= speed
        newDirection = 'left'
        moving = true
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        attemptX += speed
        newDirection = 'right'
        moving = true
      }
      if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        attemptY -= speed
        newDirection = 'up'
        moving = true
      }
      if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        attemptY += speed
        newDirection = 'down'
        moving = true
      }

      // 边界检查
      const maxX = mapData.width * TILE_SIZE - PLAYER_SIZE
      const maxY = mapData.height * TILE_SIZE - PLAYER_SIZE
      attemptX = Math.max(0, Math.min(attemptX, maxX))
      attemptY = Math.max(0, Math.min(attemptY, maxY))

      // 碰撞检测 - 只有在没有碰撞时才更新位置
      if (!checkCollision(attemptX, attemptY, PLAYER_SIZE, PLAYER_SIZE)) {
        newX = attemptX
        newY = attemptY
      } else {
        // 如果发生碰撞，尝试滑动（只在一个轴上移动）
        // 尝试只在X轴移动
        if (!checkCollision(attemptX, playerPosRef.current.y, PLAYER_SIZE, PLAYER_SIZE)) {
          newX = attemptX
        }
        // 尝试只在Y轴移动
        if (!checkCollision(playerPosRef.current.x, attemptY, PLAYER_SIZE, PLAYER_SIZE)) {
          newY = attemptY
        }
      }

      // 更新 ref 和 state（每帧都更新以保持流畅）
      const posChanged = newX !== playerPosRef.current.x || newY !== playerPosRef.current.y
      const dirChanged = newDirection !== directionRef.current
      const movingChanged = moving !== isMovingRef.current

      playerPosRef.current = { x: newX, y: newY }
      directionRef.current = newDirection
      isMovingRef.current = moving

      // 只在实际变化时更新 state
      if (posChanged) {
        setPlayerPos({ x: newX, y: newY })
      }
      if (dirChanged) {
        setDirection(newDirection)
      }
      if (movingChanged) {
        setIsMoving(moving)
      }

      moveAnimationId = requestAnimationFrame(moveLoop)
    }

    moveAnimationId = requestAnimationFrame(moveLoop)

    return () => {
      if (moveAnimationId) {
        cancelAnimationFrame(moveAnimationId)
      }
    }
  }, [mapData, collisionObjects])

  // 行走动画
  useEffect(() => {
    if (isMoving) {
      walkAnimationRef.current = setInterval(() => {
        setWalkFrame(prev => (prev + 1) % 4) // 4帧动画循环
      }, 150) // 每150ms切换一帧
    } else {
      if (walkAnimationRef.current) {
        clearInterval(walkAnimationRef.current)
      }
      setWalkFrame(0) // 停止时重置为站立帧
    }

    return () => {
      if (walkAnimationRef.current) {
        clearInterval(walkAnimationRef.current)
      }
    }
  }, [isMoving])

  // 渲染地图（智能相机跟随）- 优化版，使用 ref 避免重新创建
  useEffect(() => {
    if (!mapData || !canvasRef.current || isLoading) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // 设置画布大小为屏幕大小
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // 禁用图像平滑以保持像素风格
    ctx.imageSmoothingEnabled = false

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 使用 ref 中的位置，避免依赖 state
      const currentPos = playerPosRef.current

      // 计算地图实际大小（放大后）
      const scaledMapWidth = mapData.width * TILE_SIZE * MAP_SCALE
      const scaledMapHeight = mapData.height * TILE_SIZE * MAP_SCALE
      const scaledPlayerX = currentPos.x * MAP_SCALE
      const scaledPlayerY = currentPos.y * MAP_SCALE

      // 智能相机：尝试让角色居中，但不显示地图外区域
      let cameraX = scaledPlayerX - canvas.width / 2 + (PLAYER_SIZE * MAP_SCALE) / 2
      let cameraY = scaledPlayerY - canvas.height / 2 + (PLAYER_SIZE * MAP_SCALE) / 2

      // 限制相机不超出地图边界
      cameraX = Math.max(0, Math.min(cameraX, scaledMapWidth - canvas.width))
      cameraY = Math.max(0, Math.min(cameraY, scaledMapHeight - canvas.height))

      // 如果地图小于屏幕，居中显示
      if (scaledMapWidth < canvas.width) cameraX = -(canvas.width - scaledMapWidth) / 2
      if (scaledMapHeight < canvas.height) cameraY = -(canvas.height - scaledMapHeight) / 2

      // 渲染地图图层
      mapData.layers.forEach(layer => {
        if (layer.type === 'tilelayer' && layer.visible) {
          renderTileLayer(ctx, layer, cameraX, cameraY)
        }
      })

      animationFrameRef.current = requestAnimationFrame(render)
    }

    render()

    // 监听窗口大小变化
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [mapData, isLoading, tileImages])

  const renderTileLayer = (ctx, layer, cameraX, cameraY) => {
    if (!layer.data) return

    const scaledTileSize = TILE_SIZE * MAP_SCALE

    const startCol = Math.max(0, Math.floor(cameraX / scaledTileSize))
    const endCol = Math.min(mapData.width, Math.ceil((cameraX + ctx.canvas.width) / scaledTileSize) + 1)
    const startRow = Math.max(0, Math.floor(cameraY / scaledTileSize))
    const endRow = Math.min(mapData.height, Math.ceil((cameraY + ctx.canvas.height) / scaledTileSize) + 1)

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tileIndex = row * mapData.width + col
        let gid = layer.data[tileIndex]

        if (gid === 0) continue

        // 处理翻转标志
        const FLIPPED_HORIZONTALLY_FLAG = 0x80000000
        const FLIPPED_VERTICALLY_FLAG = 0x40000000
        const FLIPPED_DIAGONALLY_FLAG = 0x20000000
        
        const flippedH = (gid & FLIPPED_HORIZONTALLY_FLAG) !== 0
        const flippedV = (gid & FLIPPED_VERTICALLY_FLAG) !== 0
        const flippedD = (gid & FLIPPED_DIAGONALLY_FLAG) !== 0
        
        gid = gid & ~(FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG)

        const x = col * scaledTileSize - cameraX
        const y = row * scaledTileSize - cameraY

        // 渲染瓦片
        if (tileImages[gid]) {
          const tileData = tileImages[gid]
          
          ctx.save()
          
          if (flippedH || flippedV || flippedD) {
            ctx.translate(x + scaledTileSize / 2, y + scaledTileSize / 2)
            if (flippedH) ctx.scale(-1, 1)
            if (flippedV) ctx.scale(1, -1)
            if (flippedD) {
              ctx.rotate(Math.PI / 2)
              ctx.scale(1, -1)
            }
            ctx.translate(-scaledTileSize / 2, -scaledTileSize / 2)
            ctx.drawImage(tileData.image, 0, 0, scaledTileSize, scaledTileSize)
          } else {
            ctx.drawImage(tileData.image, x, y, scaledTileSize, scaledTileSize)
          }
          
          ctx.restore()
        } else {
          ctx.fillStyle = getTileColor(gid)
          ctx.fillRect(x, y, scaledTileSize, scaledTileSize)
        }
      }
    }
  }

  const getTileColor = (gid) => {
    // 根据tileset范围返回不同颜色
    // Tileset 1 (road): GID 1-107 - 道路/地面
    if (gid >= 1 && gid <= 107) {
      // 根据具体GID细分颜色
      if (gid <= 40) return '#8B7355'  // 土地色
      if (gid <= 70) return '#A0826D'  // 浅土色
      return '#9B8B7E'  // 灰土色
    }
    
    // Tileset 2 (stone): GID 108-267 - 石头
    if (gid >= 108 && gid <= 267) {
      return '#808080'  // 石头灰色
    }
    
    // Tileset 3 (tree): GID 268-347 - 树木/植被
    if (gid >= 268 && gid <= 347) {
      if (gid === 280) return '#2d5016'  // 深绿草地
      if (gid >= 285 && gid <= 290) return '#1a3d0a'  // 更深的草地
      if (gid >= 301 && gid <= 316) return '#228B22'  // 树木绿
      return '#3d6b3d'  // 默认植被绿
    }
    
    // Tileset 4 (ruin): GID 348-387 - 废墟
    if (gid >= 348 && gid <= 387) {
      return '#8B4513'  // 废墟棕色
    }
    
    return '#4a4a4a'  // 默认灰色
  }

  // renderPlayer函数已移除 - 角色现在通过DOM元素渲染

  if (isLoading) {
    return (
      <div className="forest-map-loading">
        <div className="loading-text">🌲 Loading Forest Map...</div>
        <div style={{ 
          width: '300px', 
          height: '20px', 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${loadingProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <div style={{ fontSize: '1rem', opacity: 0.8 }}>
          {loadingProgress}% - Loading tiles...
        </div>
      </div>
    )
  }

  if (!mapData) {
    return (
      <div className="forest-map-loading">
        <div className="loading-text">❌ Failed to load map</div>
        <button onClick={onExit} className="exit-button">Back to Map Selection</button>
      </div>
    )
  }

  // 计算行走动画的偏移
  const getWalkOffset = () => {
    if (!isMoving) return { x: 0, y: 0 }
    
    // 左右摇摆效果
    const bobAmount = 2
    const xOffset = walkFrame === 1 || walkFrame === 3 ? (walkFrame === 1 ? -bobAmount : bobAmount) : 0
    const yOffset = walkFrame === 1 || walkFrame === 3 ? -1 : 0
    
    return { x: xOffset, y: yOffset }
  }

  const walkOffset = getWalkOffset()

  // 计算角色在屏幕上的位置（优化版）
  const getCharacterScreenPosition = () => {
    if (!canvasRef.current || !mapData) return { x: 0, y: 0 }
    
    const canvas = canvasRef.current
    const scaledMapWidth = mapData.width * TILE_SIZE * MAP_SCALE
    const scaledMapHeight = mapData.height * TILE_SIZE * MAP_SCALE
    const scaledPlayerX = Math.round(playerPos.x * MAP_SCALE)
    const scaledPlayerY = Math.round(playerPos.y * MAP_SCALE)
    const scaledPlayerSize = PLAYER_SIZE * MAP_SCALE

    // 计算理想相机位置（角色居中）
    let cameraX = scaledPlayerX - canvas.width / 2 + scaledPlayerSize / 2
    let cameraY = scaledPlayerY - canvas.height / 2 + scaledPlayerSize / 2

    // 限制相机不超出地图边界
    const maxCameraX = scaledMapWidth - canvas.width
    const maxCameraY = scaledMapHeight - canvas.height

    cameraX = Math.max(0, Math.min(cameraX, maxCameraX))
    cameraY = Math.max(0, Math.min(cameraY, maxCameraY))

    // 如果地图小于屏幕，居中显示
    if (scaledMapWidth < canvas.width) cameraX = -(canvas.width - scaledMapWidth) / 2
    if (scaledMapHeight < canvas.height) cameraY = -(canvas.height - scaledMapHeight) / 2

    // 角色在屏幕上的位置
    return {
      x: Math.round(scaledPlayerX - cameraX),
      y: Math.round(scaledPlayerY - cameraY)
    }
  }

  const characterScreenPos = getCharacterScreenPosition()
  const scaledPlayerSize = PLAYER_SIZE * MAP_SCALE
  const scaledWalkOffset = { 
    x: Math.round(walkOffset.x * MAP_SCALE), 
    y: Math.round(walkOffset.y * MAP_SCALE) 
  }

  return (
    <div className="forest-map-container" style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'relative',
      background: '#000'
    }}>
      <canvas ref={canvasRef} className="forest-map-canvas" style={{
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0,
        imageRendering: 'pixelated',
        imageRendering: '-moz-crisp-edges',
        imageRendering: 'crisp-edges'
      }} />
      
      {/* 角色层 - 叠加在Canvas上 */}
      <MapCharacter 
        character={character}
        screenPosition={characterScreenPos}
        walkOffset={scaledWalkOffset}
        direction={direction}
        playerSize={scaledPlayerSize}
        mapScale={MAP_SCALE}
      />
      
      <MapUI 
        character={character}
        playerPos={playerPos}
        tileSize={TILE_SIZE}
        onExit={onExit}
      />
    </div>
  )
}

export default ForestMap

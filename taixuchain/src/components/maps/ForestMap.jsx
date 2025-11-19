import { useEffect, useRef, useState } from 'react'
import MapUI from './MapUI'
import MapCharacter from './MapCharacter'
import Monster from './Monster'
import Inventory from '../Inventory'
import LootBox from './LootBox'
import WeaponReward from './WeaponReward'
import { checkPlayerWeapon, mintWeaponForPlayer, mintRandomWeaponForPlayer, getAllPlayerWeapons } from '../../utils/suiClient'
import '../../css/maps/ForestMap.css'

function ForestMap({ character, onExit }) {
  const [playerWeapon, setPlayerWeapon] = useState(null)
  const [isCheckingWeapon, setIsCheckingWeapon] = useState(true)
  const [isInventoryOpen, setIsInventoryOpen] = useState(false)
  const canvasRef = useRef(null)
  const [mapData, setMapData] = useState(null)
  const [playerPos, setPlayerPos] = useState(null) // 初始为null，等待地图加载后计算
  const keysRef = useRef({}) // 改用 ref 存储键盘状态
  const [isLoading, setIsLoading] = useState(true)
  const [tileImages, setTileImages] = useState({})
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showTeleportEffect, setShowTeleportEffect] = useState(false) // 传送特效
  const [teleportProgress, setTeleportProgress] = useState(0) // 传送进度 0-1
  const [direction, setDirection] = useState('down') // 角色朝向
  const [isMoving, setIsMoving] = useState(false) // 是否在移动
  const [walkFrame, setWalkFrame] = useState(0) // 行走动画帧
  const [collisionObjects, setCollisionObjects] = useState([]) // 碰撞区域
  const [monsters, setMonsters] = useState([]) // 怪物列表
  const [playerAttackTrigger, setPlayerAttackTrigger] = useState(0) // 玩家攻击触发器
  const [playerCurrentHp, setPlayerCurrentHp] = useState(character.hp) // 玩家当前生命值
  const [lootBoxes, setLootBoxes] = useState([]) // 宝箱列表
  const [showWeaponReward, setShowWeaponReward] = useState(null) // 显示武器奖励弹窗
  const lootBoxIdCounter = useRef(0) // 宝箱ID计数器
  const animationFrameRef = useRef(null)
  const walkAnimationRef = useRef(null)
  const playerPosRef = useRef(null) // 用 ref 存储实时位置，初始为null
  const directionRef = useRef('down') // 用 ref 存储实时朝向
  const isMovingRef = useRef(false) // 用 ref 存储实时移动状态
  const monsterIdCounter = useRef(0) // 怪物ID计数器
  const lastPlayerAttackTime = useRef(0) // 上次玩家攻击时间

  const TILE_SIZE = 32
  const PLAYER_SIZE = 10  // 非常小的角色
  const MOVE_SPEED = 1.5  // 固定速度（降低移动速度）
  const MAP_SCALE = 2.5  // 放大地图2.5倍
  const MONSTER_SIZE = 32 // 怪物大小（像素）- 缩小到32
  const PLAYER_ATTACK_RANGE = 60 // 玩家攻击范围（像素）
  const PLAYER_ATTACK_INTERVAL = 1000 // 玩家攻击间隔（毫秒）

  // 检查并赠送武器
  useEffect(() => {
    const checkAndGiveWeapon = async () => {
      try {
        setIsCheckingWeapon(true)
        
        // 获取玩家钱包地址
        // 优先使用 window.currentWalletAddress（实际的玩家钱包）
        const walletAddress = window.currentWalletAddress || character.owner
        
        console.log('Character object:', character)
        console.log('window.currentWalletAddress:', window.currentWalletAddress)
        console.log('Using wallet address:', walletAddress)
        
        if (!walletAddress) {
          console.warn('No wallet address found')
          setIsCheckingWeapon(false)
          return
        }

        // 职业名称到 ID 的映射
        const classNameToId = {
          'mage': 1,     // CLASS_MAGE = 1 (Staff)
          'warrior': 2,  // CLASS_WARRIOR = 2 (Sword)
          'archer': 3    // CLASS_ARCHER = 3 (Bow)
        }
        
        // 获取职业 ID
        let classId = character.id
        if (typeof classId === 'string') {
          classId = classNameToId[classId.toLowerCase()] || 2
        }
        
        console.log(`🔍 Checking if player has weapon for class ${classId} (${character.id})...`)
        const weapon = await checkPlayerWeapon(walletAddress, classId)
        
        // 职业到武器类型的映射
        const classToWeaponType = {
          'mage': 3,    // Staff
          'warrior': 1, // Sword
          'archer': 2   // Bow
        }
        
        const expectedWeaponType = classToWeaponType[character.id.toLowerCase()]
        
        if (weapon) {
          console.log('✅ Player already has weapon:', weapon.name, `(type: ${weapon.weaponType})`)
          
          // 检查武器类型是否匹配职业
          if (weapon.weaponType === expectedWeaponType) {
            console.log('✅ Weapon type matches character class')
            setPlayerWeapon(weapon)
          } else {
            console.log(`⚠️ Weapon type mismatch! Expected type ${expectedWeaponType} for ${character.id}, but has type ${weapon.weaponType}`)
            console.log('🎁 Minting correct weapon for this class...')
            
            // 继续铸造正确的武器
            await mintCorrectWeapon()
          }
        } else {
          await mintCorrectWeapon()
        }
        
        async function mintCorrectWeapon() {
          console.log(`🎁 Minting weapon for class ${classId} (${character.id})...`)
          
          // 根据职业铸造武器
          await mintWeaponForPlayer(walletAddress, classId)
          
          // 等待区块链确认（2秒）
          console.log('⏳ Waiting for blockchain confirmation...')
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // 重新查询武器（最多重试3次），传递职业 ID 以获取匹配的武器
          let newWeapon = null
          for (let i = 0; i < 3; i++) {
            newWeapon = await checkPlayerWeapon(walletAddress, classId)
            if (newWeapon) {
              console.log('✅ Starter weapon received:', newWeapon.name)
              setPlayerWeapon(newWeapon)
              break
            }
            if (i < 2) {
              console.log(`⏳ Weapon not found yet, retrying... (${i + 1}/3)`)
              await new Promise(resolve => setTimeout(resolve, 1500))
            }
          }
          
          if (!newWeapon) {
            console.warn('⚠️ Weapon minted but not found in query. Please refresh the page.')
          }
        }
      } catch (error) {
        console.error('❌ Error checking/giving weapon:', error)
      } finally {
        setIsCheckingWeapon(false)
      }
    }

    checkAndGiveWeapon()
  }, [character])

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
        
        // 计算地图中心位置并设置角色初始位置
        const centerX = (data.width * TILE_SIZE) / 2
        const centerY = (data.height * TILE_SIZE) / 2
        console.log(`Setting player to map center: (${centerX}, ${centerY})`)
        
        // 立即设置 ref，确保第一帧就有正确位置
        const initialPos = { x: centerX, y: centerY }
        playerPosRef.current = initialPos
        setPlayerPos(initialPos)
        
        // 启动传送特效
        setShowTeleportEffect(true)
        
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

        // 提取怪物刷新点
        const spawnsLayer = data.layers.find(layer => layer.name === 'spawns')
        if (spawnsLayer && spawnsLayer.objects) {
          const spawnPoints = spawnsLayer.objects.filter(obj => obj.name === 'Spawns')
          console.log(`Found ${spawnPoints.length} spawn points`)
          
          // 在每个刷新点生成2个怪物（1个CowMonster1，1个CowMonster2）
          const initialMonsters = []
          spawnPoints.forEach((spawn, spawnIndex) => {
            // 获取刷新点的Count属性（默认为2）
            const countProp = spawn.properties?.find(p => p.name === 'Count')
            const count = countProp ? countProp.value : 2
            
            // 生成指定数量的怪物
            for (let i = 0; i < count; i++) {
              const monsterType = i === 0 ? 'CowMonster1' : 'CowMonster2'
              // 在刷新点周围随机偏移位置，避免重叠（增大偏移范围）
              const offsetX = (Math.random() - 0.2) * 80
              const offsetY = (Math.random() - 1.2) * 80
              
              const initialX = spawn.x + offsetX
              const initialY = spawn.y + offsetY
              
              initialMonsters.push({
                id: monsterIdCounter.current++,
                type: monsterType,
                x: initialX,
                y: initialY,
                initialX: initialX, // 保存初始位置
                initialY: initialY, // 保存初始位置
                spawnPoint: spawnIndex,
                alive: true
              })
            }
          })
          
          console.log(`Spawned ${initialMonsters.length} monsters`)
          setMonsters(initialMonsters)
        } else {
          console.warn('No spawns layer found in map')
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
        // 如果背包打开，先关闭背包
        if (isInventoryOpen) {
          setIsInventoryOpen(false)
          return
        }
        onExit()
        return
      }
      
      // I键打开/关闭背包
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        setIsInventoryOpen(prev => !prev)
        return
      }
      
      // 空格键攻击
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault() // 防止页面滚动
        
        // 检查攻击间隔
        const now = Date.now()
        if (now - lastPlayerAttackTime.current < PLAYER_ATTACK_INTERVAL) {
          return // 攻击冷却中
        }
        
        lastPlayerAttackTime.current = now
        
        // 计算玩家总攻击力（角色攻击力 + 武器攻击力）
        const weaponAttack = playerWeapon ? playerWeapon.attack : 0
        const totalAttack = character.attack + weaponAttack
        
        // 获取职业类型
        const characterClass = character.id.toLowerCase()
        
        // 根据职业类型决定攻击方式
        // 编码格式：攻击力 * 10000 + 职业代码 * 100 + (时间戳 % 100)
        // 这样可以确保攻击力在前面，便于解码
        const timestamp = now % 100 // 只取时间戳的最后两位作为唯一标识
        
        if (characterClass === 'warrior') {
          // 武者：范围攻击（主目标 + 溅射）
          const encoded = totalAttack * 10000 + 1 * 100 + timestamp
          setPlayerAttackTrigger(encoded)
          console.log(`⚔️ Warrior AOE attack! Damage: ${totalAttack} (Main) + ${Math.floor(totalAttack * 0.3)} (Splash)`)
        } else {
          // 弓箭手/术士：单体攻击
          const classCode = characterClass === 'archer' ? 2 : 3
          const encoded = totalAttack * 10000 + classCode * 100 + timestamp
          setPlayerAttackTrigger(encoded)
          console.log(`⚔️ ${characterClass === 'archer' ? 'Archer' : 'Mage'} single target attack! Damage: ${totalAttack}`)
        }
        
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
  }, [onExit, character, playerWeapon, PLAYER_ATTACK_INTERVAL, isInventoryOpen])

  // 移动角色和行走动画（使用RAF确保流畅）
  useEffect(() => {
    if (!mapData || !playerPosRef.current) return // 等待地图和初始位置都加载完成

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

      // 检测按键状态
      const isLeft = keys['ArrowLeft'] || keys['a'] || keys['A']
      const isRight = keys['ArrowRight'] || keys['d'] || keys['D']
      const isUp = keys['ArrowUp'] || keys['w'] || keys['W']
      const isDown = keys['ArrowDown'] || keys['s'] || keys['S']

      // 移动处理
      if (isLeft) {
        attemptX -= speed
        moving = true
      }
      if (isRight) {
        attemptX += speed
        moving = true
      }
      if (isUp) {
        attemptY -= speed
        moving = true
      }
      if (isDown) {
        attemptY += speed
        moving = true
      }

      // 朝向判断 - 对角线移动时优先显示水平方向
      if (isLeft && (isUp || isDown)) {
        newDirection = 'left'  // 左上或左下时，脸朝左
      } else if (isRight && (isUp || isDown)) {
        newDirection = 'right'  // 右上或右下时，脸朝右
      } else if (isLeft) {
        newDirection = 'left'
      } else if (isRight) {
        newDirection = 'right'
      } else if (isUp) {
        newDirection = 'up'
      } else if (isDown) {
        newDirection = 'down'
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

  // 传送特效动画
  useEffect(() => {
    if (!showTeleportEffect) return

    const duration = 1500 // 1.5秒传送动画
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      setTeleportProgress(progress)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // 动画结束，隐藏特效
        setTimeout(() => {
          setShowTeleportEffect(false)
        }, 200)
      }
    }

    requestAnimationFrame(animate)
  }, [showTeleportEffect])

  // 渲染地图（智能相机跟随）- 优化版，使用 ref 避免重新创建
  useEffect(() => {
    if (!mapData || !canvasRef.current || isLoading || !playerPosRef.current) return

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
      if (!currentPos) return // 额外的安全检查

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
    if (!canvasRef.current || !mapData || !playerPosRef.current) return { x: 0, y: 0 }
    
    const canvas = canvasRef.current
    const scaledMapWidth = mapData.width * TILE_SIZE * MAP_SCALE
    const scaledMapHeight = mapData.height * TILE_SIZE * MAP_SCALE
    const scaledPlayerX = Math.round(playerPosRef.current.x * MAP_SCALE)
    const scaledPlayerY = Math.round(playerPosRef.current.y * MAP_SCALE)
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

  // 如果角色位置还未初始化，显示加载中（但不阻止canvas渲染）
  if (!playerPos) {
    // 返回容器但不显示角色，让canvas先渲染
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
      </div>
    )
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
      
      {/* 炫酷传送门特效 */}
      {showTeleportEffect && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 1000,
          width: '300px',
          height: '300px'
        }}>
          {/* 外层旋转能量环 - 顺时针 */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${200 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}px`,
            height: `${200 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}px`,
            transform: `translate(-50%, -50%) rotate(${teleportProgress * 720}deg)`,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: 'rgba(0, 255, 255, 0.8)',
            borderRightColor: 'rgba(100, 200, 255, 0.6)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.6), inset 0 0 30px rgba(0, 255, 255, 0.3)',
            opacity: teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2
          }} />
          
          {/* 中层旋转能量环 - 逆时针 */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${150 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}px`,
            height: `${150 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}px`,
            transform: `translate(-50%, -50%) rotate(${-teleportProgress * 900}deg)`,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderLeftColor: 'rgba(255, 0, 255, 0.8)',
            borderBottomColor: 'rgba(200, 100, 255, 0.6)',
            boxShadow: '0 0 25px rgba(255, 0, 255, 0.5), inset 0 0 25px rgba(255, 0, 255, 0.3)',
            opacity: teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2
          }} />
          
          {/* 内层快速旋转环 */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${100 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}px`,
            height: `${100 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}px`,
            transform: `translate(-50%, -50%) rotate(${teleportProgress * 1440}deg)`,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'rgba(255, 255, 0, 0.9)',
            borderRightColor: 'rgba(255, 200, 0, 0.7)',
            boxShadow: '0 0 20px rgba(255, 255, 0, 0.7)',
            opacity: teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2
          }} />
          
          {/* 能量闪电效果 - 多条 */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 + teleportProgress * 360) % 360
            const length = 60 + Math.sin(teleportProgress * Math.PI * 4 + i) * 20
            return (
              <div key={`lightning-${i}`} style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '2px',
                height: `${length}px`,
                background: `linear-gradient(to bottom, 
                  rgba(100, 200, 255, ${0.9 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}) 0%, 
                  transparent 100%)`,
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-50%)`,
                boxShadow: `0 0 8px rgba(100, 200, 255, 0.8)`,
                opacity: Math.sin(teleportProgress * Math.PI * 2 + i * 0.5) * 0.5 + 0.5
              }} />
            )
          })}
          
          {/* 螺旋粒子流 */}
          {[...Array(20)].map((_, i) => {
            const spiralProgress = (teleportProgress + i * 0.05) % 1
            const radius = 80 * (1 - spiralProgress)
            const angle = spiralProgress * 720 + i * 18
            const x = Math.cos(angle * Math.PI / 180) * radius
            const y = Math.sin(angle * Math.PI / 180) * radius
            return (
              <div key={`particle-${i}`} style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: `rgba(${100 + spiralProgress * 155}, ${200 - spiralProgress * 100}, 255, ${1 - spiralProgress})`,
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                boxShadow: `0 0 10px rgba(100, 200, 255, ${1 - spiralProgress})`,
                opacity: 1 - spiralProgress
              }} />
            )
          })}
          
          {/* 中心传送门核心 */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${80 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}px`,
            height: `${80 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}px`,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, 
              rgba(255, 255, 255, ${0.9 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}) 0%, 
              rgba(150, 220, 255, ${0.6 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}) 30%, 
              rgba(100, 150, 255, ${0.3 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}) 60%, 
              transparent 100%)`,
            boxShadow: `
              0 0 40px rgba(150, 220, 255, ${0.8 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}),
              0 0 80px rgba(100, 200, 255, ${0.6 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)}),
              inset 0 0 40px rgba(255, 255, 255, ${0.4 * (teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2)})
            `
          }} />
          
          {/* 外围能量波纹 */}
          {[...Array(3)].map((_, i) => {
            const waveProgress = (teleportProgress * 2 + i * 0.33) % 1
            return (
              <div key={`wave-${i}`} style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${250 * waveProgress}px`,
                height: `${250 * waveProgress}px`,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                border: `${3 * (1 - waveProgress)}px solid rgba(100, 200, 255, ${(1 - waveProgress) * 0.6})`,
                opacity: 1 - waveProgress
              }} />
            )
          })}
          
          {/* 六芒星魔法阵 */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '180px',
            height: '180px',
            transform: `translate(-50%, -50%) rotate(${teleportProgress * 360}deg)`,
            opacity: teleportProgress < 0.5 ? teleportProgress * 2 : 2 - teleportProgress * 2
          }}>
            {[...Array(6)].map((_, i) => (
              <div key={`star-${i}`} style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '2px',
                height: '90px',
                background: 'linear-gradient(to bottom, rgba(255, 200, 100, 0.6) 0%, transparent 100%)',
                transform: `translate(-50%, -50%) rotate(${i * 60}deg)`,
                boxShadow: '0 0 5px rgba(255, 200, 100, 0.8)'
              }} />
            ))}
          </div>
        </div>
      )}
      
      {/* 宝箱层 - 在怪物之后渲染 */}
      {!showTeleportEffect && lootBoxes.map(lootBox => {
        // 计算宝箱在屏幕上的位置
        const getLootBoxScreenPosition = (boxX, boxY) => {
          if (!canvasRef.current || !mapData) return { x: 0, y: 0 }
          
          const canvas = canvasRef.current
          const scaledMapWidth = mapData.width * TILE_SIZE * MAP_SCALE
          const scaledMapHeight = mapData.height * TILE_SIZE * MAP_SCALE
          const scaledPlayerX = Math.round(playerPosRef.current.x * MAP_SCALE)
          const scaledPlayerY = Math.round(playerPosRef.current.y * MAP_SCALE)
          const scaledPlayerSize = PLAYER_SIZE * MAP_SCALE

          let cameraX = scaledPlayerX - canvas.width / 2 + scaledPlayerSize / 2
          let cameraY = scaledPlayerY - canvas.height / 2 + scaledPlayerSize / 2

          const maxCameraX = scaledMapWidth - canvas.width
          const maxCameraY = scaledMapHeight - canvas.height

          cameraX = Math.max(0, Math.min(cameraX, maxCameraX))
          cameraY = Math.max(0, Math.min(cameraY, maxCameraY))

          if (scaledMapWidth < canvas.width) cameraX = -(canvas.width - scaledMapWidth) / 2
          if (scaledMapHeight < canvas.height) cameraY = -(canvas.height - scaledMapHeight) / 2

          const scaledBoxX = Math.round(boxX * MAP_SCALE)
          const scaledBoxY = Math.round(boxY * MAP_SCALE)
          
          return {
            x: Math.round(scaledBoxX - cameraX),
            y: Math.round(scaledBoxY - cameraY)
          }
        }
        
        const boxScreenPos = getLootBoxScreenPosition(lootBox.x, lootBox.y)
        
        return (
          <LootBox
            key={lootBox.id}
            screenPosition={boxScreenPos}
            boxSize={40 * MAP_SCALE}
            onOpen={async () => {
              console.log(`📦 Opening loot box ${lootBox.id}...`)
              
              try {
                // 获取玩家钱包地址
                const walletAddress = window.currentWalletAddress || character.owner
                
                // 获取开箱前的武器数量
                const weaponsBefore = await getAllPlayerWeapons(walletAddress)
                const countBefore = weaponsBefore.length
                console.log(`📊 Weapons before: ${countBefore}`)
                
                // 调用后端API铸造随机武器
                const { result, weaponInfo } = await mintRandomWeaponForPlayer(walletAddress)
                
                console.log('🎁 Random weapon minted:', weaponInfo)
                console.log('Transaction:', result.digest)
                
                // 从交易结果中提取新武器的 objectId
                let newWeaponId = weaponInfo.objectId
                if (!newWeaponId && result.objectChanges) {
                  const createdWeapon = result.objectChanges.find(
                    change => change.type === 'created' && 
                    change.objectType && 
                    change.objectType.includes('::weapon::Weapon')
                  )
                  if (createdWeapon) {
                    newWeaponId = createdWeapon.objectId
                  }
                }
                
                console.log('🆔 New weapon ID:', newWeaponId)
                
                if (!newWeaponId) {
                  console.error('❌ Could not extract weapon ID from transaction')
                  alert('无法获取武器ID，请查看背包')
                  return
                }
                
                // 等待区块链确认
                await new Promise(resolve => setTimeout(resolve, 2000))
                
                // 直接通过 objectId 查询新武器
                let newWeapon = null
                let retries = 0
                const maxRetries = 5
                
                while (!newWeapon && retries < maxRetries) {
                  try {
                    // 直接查询特定的武器对象
                    const weaponObject = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/weapon-by-id/${newWeaponId}`)
                    
                    if (weaponObject.ok) {
                      const data = await weaponObject.json()
                      if (data.weapon) {
                        newWeapon = data.weapon
                        console.log('✅ New weapon found by ID:', newWeapon)
                        break
                      }
                    }
                  } catch (err) {
                    console.warn('Query by ID failed, trying list query...')
                  }
                  
                  // 备用方案：从列表中查找
                  const weaponsAfter = await getAllPlayerWeapons(walletAddress)
                  console.log(`📊 Weapons after (attempt ${retries + 1}): ${weaponsAfter.length}`)
                  
                  newWeapon = weaponsAfter.find(w => w.objectId === newWeaponId)
                  
                  if (newWeapon) {
                    console.log('✅ New weapon found in list:', newWeapon)
                    break
                  }
                  
                  retries++
                  if (retries < maxRetries) {
                    console.log(`⏳ Weapon not found yet, retrying... (${retries}/${maxRetries})`)
                    await new Promise(resolve => setTimeout(resolve, 1500))
                  }
                }
                
                if (newWeapon) {
                  // 显示武器奖励弹窗
                  setShowWeaponReward(newWeapon)
                } else {
                  // 即使查询不到，也根据交易信息构造武器对象显示
                  console.warn('⚠️ Weapon minted but not found in query, showing from transaction info')
                  
                  // 根据武器类型和品质构造武器信息
                  const weaponNames = {
                    1: { 1: 'Iron Sword', 2: 'Azure Edge Sword', 3: 'Dragon Roar Sword' },
                    2: { 1: 'Hunter Bow', 2: 'Swift Wind Bow', 3: 'Cloud Piercer Bow' },
                    3: { 1: 'Wooden Staff', 2: 'Starlight Staff', 3: 'Primordial Staff' }
                  }
                  
                  const weaponAttacks = {
                    1: { 1: 20, 2: 40, 3: 70 },
                    2: { 1: 18, 2: 38, 3: 65 },
                    3: { 1: 22, 2: 42, 3: 75 }
                  }
                  
                  const constructedWeapon = {
                    objectId: newWeaponId,
                    name: weaponNames[weaponInfo.weaponType]?.[weaponInfo.rarity] || 'Unknown Weapon',
                    weaponType: weaponInfo.weaponType,
                    attack: weaponAttacks[weaponInfo.weaponType]?.[weaponInfo.rarity] || 20,
                    level: 1,
                    rarity: weaponInfo.rarity,
                    owner: walletAddress
                  }
                  
                  setShowWeaponReward(constructedWeapon)
                }
              } catch (error) {
                console.error('❌ Failed to open loot box:', error)
                alert('开箱失败，请稍后重试')
              }
            }}
            onClose={() => {
              // 移除宝箱
              setLootBoxes(prev => prev.filter(box => box.id !== lootBox.id))
              console.log(`📦 Loot box ${lootBox.id} removed`)
            }}
          />
        )
      })}
      
      {/* 怪物层 - 在角色之前渲染 */}
      {!showTeleportEffect && (() => {
        // 计算最近的怪物（主目标）
        let closestMonsterId = null
        let closestDistance = Infinity
        const WARRIOR_SPLASH_RANGE = 50 // 武者溅射范围（像素）- 小范围
        
        if (playerPosRef.current) {
          monsters.forEach(monster => {
            if (!monster.alive) return
            
            const dx = playerPosRef.current.x - monster.x
            const dy = playerPosRef.current.y - monster.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < closestDistance) {
              closestDistance = distance
              closestMonsterId = monster.id
            }
          })
        }
        
        return monsters.map(monster => {
          if (!monster.alive) return null
          
          // 计算怪物在屏幕上的位置
          const getMonsterScreenPosition = (monsterX, monsterY) => {
            if (!canvasRef.current || !mapData) return { x: 0, y: 0 }
            
            const canvas = canvasRef.current
            const scaledMapWidth = mapData.width * TILE_SIZE * MAP_SCALE
            const scaledMapHeight = mapData.height * TILE_SIZE * MAP_SCALE
            const scaledPlayerX = Math.round(playerPosRef.current.x * MAP_SCALE)
            const scaledPlayerY = Math.round(playerPosRef.current.y * MAP_SCALE)
            const scaledPlayerSize = PLAYER_SIZE * MAP_SCALE

            // 计算相机位置（与角色渲染相同的逻辑）
            let cameraX = scaledPlayerX - canvas.width / 2 + scaledPlayerSize / 2
            let cameraY = scaledPlayerY - canvas.height / 2 + scaledPlayerSize / 2

            const maxCameraX = scaledMapWidth - canvas.width
            const maxCameraY = scaledMapHeight - canvas.height

            cameraX = Math.max(0, Math.min(cameraX, maxCameraX))
            cameraY = Math.max(0, Math.min(cameraY, maxCameraY))

            if (scaledMapWidth < canvas.width) cameraX = -(canvas.width - scaledMapWidth) / 2
            if (scaledMapHeight < canvas.height) cameraY = -(canvas.height - scaledMapHeight) / 2

            // 怪物在屏幕上的位置
            const scaledMonsterX = Math.round(monsterX * MAP_SCALE)
            const scaledMonsterY = Math.round(monsterY * MAP_SCALE)
            
            return {
              x: Math.round(scaledMonsterX - cameraX),
              y: Math.round(scaledMonsterY - cameraY)
            }
          }
          
          const monsterScreenPos = getMonsterScreenPosition(monster.x, monster.y)
          
          // 判断是否是主目标
          const isMainTarget = monster.id === closestMonsterId
          
          // 对于武者的溅射攻击，检查是否在溅射范围内
          let isInSplashRange = false
          if (!isMainTarget && closestMonsterId !== null && playerPosRef.current) {
            // 找到主目标怪物
            const mainMonster = monsters.find(m => m.id === closestMonsterId)
            if (mainMonster) {
              // 计算当前怪物与主目标的距离
              const dx = monster.x - mainMonster.x
              const dy = monster.y - mainMonster.y
              const distanceToMain = Math.sqrt(dx * dx + dy * dy)
              isInSplashRange = distanceToMain <= WARRIOR_SPLASH_RANGE
            }
          }
          
          return (
            <Monster
              key={monster.id}
              id={monster.id}
              type={monster.type}
              screenPosition={monsterScreenPos}
              monsterSize={MONSTER_SIZE * MAP_SCALE}
              mapScale={MAP_SCALE}
              playerPos={playerPosRef.current} // 传递玩家位置
              monsterWorldPos={{ x: monster.x, y: monster.y }} // 传递怪物世界位置
              initialPos={{ x: monster.initialX, y: monster.initialY }} // 传递初始位置
              playerAttackTrigger={playerAttackTrigger} // 传递玩家攻击触发器
              isMainTarget={isMainTarget} // 是否是主目标（最近的怪物）
              isInSplashRange={isInSplashRange} // 是否在溅射范围内（仅武者使用）
              onPositionUpdate={(monsterId, newX, newY) => {
                // 更新怪物位置
                setMonsters(prev => prev.map(m => 
                  m.id === monsterId ? { ...m, x: newX, y: newY } : m
                ))
              }}
              onDeath={() => {
                // 处理怪物死亡
                setMonsters(prev => prev.map(m => 
                  m.id === monster.id ? { ...m, alive: false } : m
                ))
                console.log(`💀 Monster ${monster.id} defeated!`)
                
                // 在怪物位置生成宝箱
                const newLootBox = {
                  id: lootBoxIdCounter.current++,
                  x: monster.x,
                  y: monster.y,
                  monsterId: monster.id
                }
                setLootBoxes(prev => [...prev, newLootBox])
                console.log(`📦 Loot box spawned at (${monster.x}, ${monster.y})`)
              }}
              onAttackPlayer={(damage) => {
                // 怪物攻击玩家
                const newHp = Math.max(0, playerCurrentHp - damage)
                setPlayerCurrentHp(newHp)
                console.log(`🩸 Player hit! Damage: ${damage}, HP: ${newHp}/${character.max_hp}`)
                
                if (newHp <= 0) {
                  console.log('💀 Player defeated!')
                  // TODO: 处理玩家死亡
                }
              }}
            />
          )
        })
      })()}
      
      {/* 角色层 - 叠加在Canvas上，传送特效结束后才显示 */}
      {!showTeleportEffect && (
        <MapCharacter 
          character={character}
          screenPosition={characterScreenPos}
          walkOffset={scaledWalkOffset}
          direction={direction}
          playerSize={scaledPlayerSize}
          mapScale={MAP_SCALE}
          weapon={playerWeapon}
        />
      )}
      
      <MapUI 
        character={character}
        playerPos={playerPos}
        tileSize={TILE_SIZE}
        onExit={onExit}
        playerCurrentHp={playerCurrentHp}
        playerWeapon={playerWeapon}
        onOpenInventory={() => setIsInventoryOpen(true)}
      />
      
      {/* 背包系统 */}
      <Inventory 
        character={character}
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        equippedWeapon={playerWeapon}
        onEquipWeapon={(weapon) => {
          setPlayerWeapon(weapon)
          console.log('✅ Equipped weapon:', weapon.name)
        }}
      />
      
      {/* 武器奖励弹窗 */}
      {showWeaponReward && (
        <WeaponReward 
          weapon={showWeaponReward}
          onClose={() => setShowWeaponReward(null)}
        />
      )}
    </div>
  )
}

export default ForestMap

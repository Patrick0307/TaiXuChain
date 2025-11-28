import { useEffect, useRef, useState } from 'react'
import MapUI from './MapUI'
import MapCharacter from './MapCharacter'
import Monster from './Monster'
import AttackEffect from './AttackEffect'
import Inventory from '../Inventory'
import Marketplace from '../Marketplace'
import LootBox from './LootBox'
import WeaponReward from './WeaponReward'
import MintingLoader from './MintingLoader'
import TutorialPopup from './TutorialPopup'
import { alertManager } from '../AlertDialog'
import { checkPlayerWeapon, mintWeaponForPlayer, mintRandomWeaponForPlayer, getAllPlayerWeapons } from '../../utils/suiClient'
import websocketClient from '../../services/websocketClient'
import soundManager from '../../utils/soundManager'
import '../../css/maps/ForestMap.css'

function ForestMap({ character, onExit, roomId = null, initialPlayers = [], isHostProp = false, hostIdProp = null, initialMonstersProp = [] }) {
  const [otherPlayers, setOtherPlayers] = useState(new Map()) // 其他玩家
  const [isHost, setIsHost] = useState(isHostProp) // 是否是主机（从props初始化）
  const [hostId, setHostId] = useState(hostIdProp) // 主机ID（从props初始化）
  const [playerWeapon, setPlayerWeapon] = useState(null)
  const [isCheckingWeapon, setIsCheckingWeapon] = useState(true)
  const [isInventoryOpen, setIsInventoryOpen] = useState(false)
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false)
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
  const monstersRef = useRef([]) // 怪物列表的 ref，用于主机的实时更新
  const lootBoxesRef = useRef([]) // 宝箱列表的 ref
  const [playerAttackTrigger, setPlayerAttackTrigger] = useState(0) // 玩家攻击触发器
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false) // 玩家是否正在攻击（用于武器动画）
  const [playerCurrentHp, setPlayerCurrentHp] = useState(character.hp) // 玩家当前生命值
  const [lootBoxes, setLootBoxes] = useState([]) // 宝箱列表
  const [isDead, setIsDead] = useState(false) // 玩家是否死亡
  const [respawnCountdown, setRespawnCountdown] = useState(10) // 复活倒计时
  const [showWeaponReward, setShowWeaponReward] = useState(null) // 显示武器奖励弹窗
  const [isMintingWeapon, setIsMintingWeapon] = useState(false) // 是否正在mint武器
  const [attackEffect, setAttackEffect] = useState(null) // 攻击特效 { type, startPos, targetPos }
  const [showTutorial, setShowTutorial] = useState(true) // 显示教程弹窗
  const lootBoxIdCounter = useRef(0) // 宝箱ID计数器
  const pickingLootBox = useRef(new Set()) // 正在拾取的宝箱ID（防止重复点击）
  const lastLootBoxOpenTime = useRef(0) // 上次打开宝箱的时间
  const animationFrameRef = useRef(null)
  const walkAnimationRef = useRef(null)
  const playerPosRef = useRef(null) // 用 ref 存储实时位置，初始为null
  const directionRef = useRef('down') // 用 ref 存储实时朝向
  const isMovingRef = useRef(false) // 用 ref 存储实时移动状态
  const monsterIdCounter = useRef(0) // 怪物ID计数器
  const lastPlayerAttackTime = useRef(0) // 上次玩家攻击时间
  const lastSyncTime = useRef(0) // 上次同步时间
  const processedLootBoxes = useRef(new Set()) // 已处理的宝箱ID
  const loadingStartTime = useRef(Date.now()) // 记录加载开始时间
  const monsterRespawnTimers = useRef(new Map()) // 野怪刷新计时器

  const MONSTER_RESPAWN_TIME = 60000 // 野怪刷新时间（1分钟）

  const TILE_SIZE = 32
  const PLAYER_SIZE = 10  // 非常小的角色
  const MOVE_SPEED = 1.5  // 固定速度（降低移动速度）
  const MAP_SCALE = 2.5  // 放大地图2.5倍
  const MONSTER_SIZE = 32 // 怪物大小（像素）- 缩小到32
  const PLAYER_ATTACK_RANGE = 60 // 玩家攻击范围（像素）
  const PLAYER_ATTACK_INTERVAL = 1000 // 玩家攻击间隔（毫秒）

  // 预加载开宝箱音效
  useEffect(() => {
    soundManager.loadSound('openchest', '/sounds/openchest.mp3')
  }, [])

  // 播放背景音乐（进入地图时停止全局音乐，播放地图音乐）
  useEffect(() => {
    // 停止全局背景音乐
    soundManager.stopOverallBGM()
    // 播放地图背景音乐
    soundManager.playBGM(0.1)
    
    // 组件卸载时停止地图音乐，恢复全局音乐
    return () => {
      soundManager.stopBGM()
      soundManager.resumeOverallBGM()
    }
  }, [])

  // 初始化其他玩家、主机状态和怪物（从props）
  useEffect(() => {
    if (!roomId) return

    const currentPlayerId = window.currentWalletAddress || character.owner
    
    // 初始化主机信息
    console.log('🏠 Initializing room info - Am I host?', isHostProp, 'Host ID:', hostIdProp)
    setIsHost(isHostProp)
    setHostId(hostIdProp)
    
    // 初始化其他玩家列表（排除自己）
    if (initialPlayers && initialPlayers.length > 0) {
      console.log('🏠 Initializing players from props:', initialPlayers.length)
      const otherPlayersMap = new Map()
      initialPlayers.forEach(player => {
        if (player.id !== currentPlayerId) {
          console.log('👤 Adding existing player:', player.name, player.id)
          otherPlayersMap.set(player.id, player)
        }
      })
      setOtherPlayers(otherPlayersMap)
      console.log('✅ Initialized other players:', otherPlayersMap.size)
    }
    
    // 如果不是主机且有初始怪物数据，使用它
    if (!isHostProp && initialMonstersProp && initialMonstersProp.length > 0) {
      console.log('📥 Initializing monsters from props:', initialMonstersProp.length)
      setMonsters(initialMonstersProp)
    }
  }, [roomId, initialPlayers, isHostProp, hostIdProp, initialMonstersProp, character])

  // 主机生成怪物（只在单人模式或作为主机时）
  useEffect(() => {
    if (!mapData) return // 等待地图加载
    if (monsters.length > 0) return // 已经有怪物了，不重复生成

    // 判断是否应该生成怪物
    const shouldGenerate = !roomId || isHost // 单人模式或多人模式的主机
    
    if (!shouldGenerate) {
      console.log('⏳ Waiting for game state from host...')
      return
    }

    const spawnPoints = window.spawnPoints
    if (!spawnPoints || spawnPoints.length === 0) {
      console.warn('⚠️ No spawn points found')
      return
    }

    console.log(`👑 ${roomId ? 'Host' : 'Single player'} generating monsters...`)
    
    const initialMonsters = []
    spawnPoints.forEach((spawn, spawnIndex) => {
      const countProp = spawn.properties?.find(p => p.name === 'Count')
      const count = countProp ? countProp.value : 2
      
      for (let i = 0; i < count; i++) {
        const monsterType = i === 0 ? 'CowMonster1' : 'CowMonster2'
        const offsetX = (Math.random() - 0.2) * 80
        const offsetY = (Math.random() - 1.2) * 80
        
        const initialX = spawn.x + offsetX
        const initialY = spawn.y + offsetY
        
        // 获取怪物基础属性
        const monsterStats = {
          'CowMonster1': { maxHp: 100, attack: 10 },
          'CowMonster2': { maxHp: 150, attack: 15 }
        }
        const stats = monsterStats[monsterType] || { maxHp: 100, attack: 10 }
        
        initialMonsters.push({
          id: monsterIdCounter.current++,
          type: monsterType,
          x: initialX,
          y: initialY,
          initialX: initialX,
          initialY: initialY,
          spawnPoint: spawnIndex,
          alive: true,
          hp: stats.maxHp,
          maxHp: stats.maxHp,
          attack: stats.attack
        })
      }
    })
    
    console.log(`✅ Generated ${initialMonsters.length} monsters`)
    console.log('Monster details:', initialMonsters.map(m => ({ id: m.id, type: m.type, x: m.x, y: m.y })))
    setMonsters(initialMonsters)
    monstersRef.current = initialMonsters

    // 如果是多人模式的主机，同步怪物状态
    if (roomId && isHost) {
      console.log('📤 Host syncing initial monsters to server')
      websocketClient.syncGameState({
        monsters: initialMonsters,
        lootBoxes: []
      })
    }
  }, [mapData, roomId, isHost, monsters.length])

  // 调试：监控怪物状态变化
  useEffect(() => {
    console.log('🐮 Monsters state updated:', monsters.length, 'monsters')
    if (monsters.length > 0) {
      console.log('Alive monsters:', monsters.filter(m => m.alive).length)
    }
  }, [monsters])

  // 定期同步怪物位置（仅主机）
  useEffect(() => {
    if (!roomId || !isHost) return // 只有主机同步怪物位置
    
    const syncInterval = setInterval(() => {
      // 同步怪物位置给所有玩家（使用 ref 中的最新数据）
      if (monstersRef.current.length > 0) {
        websocketClient.sendMonsterUpdate(monstersRef.current)
        // 同时更新 state，确保渲染最新位置
        setMonsters([...monstersRef.current])
      }
    }, 100) // 每100ms同步一次
    
    return () => clearInterval(syncInterval)
  }, [roomId, isHost])

  // 非主机：插值更新怪物位置，实现平滑移动
  useEffect(() => {
    if (!roomId || isHost) return // 只有非主机需要插值
    
    let animationFrameId
    
    const interpolateMonsters = () => {
      const now = Date.now()
      const interpolationTime = 100 // 插值时间（毫秒），与同步间隔一致
      
      // 检查是否有需要插值的怪物
      let hasInterpolation = false
      
      setMonsters(prev => {
        const updated = prev.map(monster => {
          // 如果怪物有插值目标
          if (monster._targetX !== undefined && monster._targetY !== undefined && monster._updateTime) {
            hasInterpolation = true
            const elapsed = now - monster._updateTime
            const progress = Math.min(elapsed / interpolationTime, 1)
            
            // 使用缓动函数（easeOutQuad）使移动更自然
            const easeProgress = 1 - (1 - progress) * (1 - progress)
            
            const startX = monster._oldX !== undefined ? monster._oldX : monster.x
            const startY = monster._oldY !== undefined ? monster._oldY : monster.y
            
            const newX = startX + (monster._targetX - startX) * easeProgress
            const newY = startY + (monster._targetY - startY) * easeProgress
            
            // 如果插值完成，清除插值数据
            if (progress >= 1) {
              return {
                ...monster,
                x: monster._targetX,
                y: monster._targetY,
                _oldX: undefined,
                _oldY: undefined,
                _targetX: undefined,
                _targetY: undefined,
                _updateTime: undefined
              }
            }
            
            // 返回插值后的位置
            return {
              ...monster,
              x: newX,
              y: newY
            }
          }
          
          return monster
        })
        
        // 只有在有变化时才返回新数组
        return hasInterpolation ? updated : prev
      })
      
      // 继续下一帧
      animationFrameId = requestAnimationFrame(interpolateMonsters)
    }
    
    animationFrameId = requestAnimationFrame(interpolateMonsters)
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [roomId, isHost])

  // WebSocket 多人游戏同步
  useEffect(() => {
    if (!roomId) return // 单人模式不需要同步

    const currentPlayerId = window.currentWalletAddress || character.owner

    // 监听房间加入成功（获取主机信息）
    websocketClient.on('room_joined', (data) => {
      const { isHost: amIHost, hostId: roomHostId, monsters: serverMonsters, lootBoxes: serverLootBoxes } = data
      console.log('🏠 Room info - Am I host?', amIHost, 'Host ID:', roomHostId)
      setIsHost(amIHost)
      setHostId(roomHostId)

      // 如果不是主机，接收服务器的游戏状态
      if (!amIHost && serverMonsters && serverMonsters.length > 0) {
        console.log('📥 Receiving game state from server:', serverMonsters.length, 'monsters')
        setMonsters(serverMonsters)
        monstersRef.current = serverMonsters
      }
      if (!amIHost && serverLootBoxes && serverLootBoxes.length > 0) {
        console.log('📥 Receiving loot boxes from server:', serverLootBoxes.length, 'boxes')
        setLootBoxes(serverLootBoxes)
        lootBoxesRef.current = serverLootBoxes
      }
    })

    // 监听游戏状态同步（主机广播）
    websocketClient.on('game_state_synced', (data) => {
      const { gameState } = data
      console.log('📥 Game state synced from host')
      console.log('  Monsters:', gameState.monsters?.length || 0)
      console.log('  Loot boxes:', gameState.lootBoxes?.length || 0)
      
      if (gameState.monsters) {
        console.log('  Updating monsters...')
        setMonsters(gameState.monsters)
        monstersRef.current = gameState.monsters
      }
      if (gameState.lootBoxes) {
        console.log('  Updating loot boxes...')
        console.log('  Loot box details:', gameState.lootBoxes)
        setLootBoxes(gameState.lootBoxes)
        lootBoxesRef.current = gameState.lootBoxes
      }
    })

    // 监听怪物状态更新（仅位置更新，不覆盖 alive/hp）
    websocketClient.on('monsters_updated', (data) => {
      const { monsters: updatedMonsters } = data
      console.log('📥 Monsters updated:', updatedMonsters.length)
      
      // 非主机：只更新位置，保留本地的 alive 和 hp 状态
      if (!isHost) {
        setMonsters(prev => {
          return prev.map(oldMonster => {
            const newMonster = updatedMonsters.find(m => m.id === oldMonster.id)
            if (!newMonster) return oldMonster
            
            // 如果怪物已经死亡（本地状态），不更新
            if (!oldMonster.alive) {
              return oldMonster
            }
            
            // 只更新位置，保留 alive 和 hp
            if (oldMonster.alive && newMonster.alive) {
              return {
                ...oldMonster, // 保留本地状态
                x: newMonster.x, // 更新位置
                y: newMonster.y,
                _oldX: oldMonster.x,
                _oldY: oldMonster.y,
                _targetX: newMonster.x,
                _targetY: newMonster.y,
                _updateTime: Date.now()
              }
            }
            
            return oldMonster
          })
        })
      } else {
        // 主机直接更新
        setMonsters(updatedMonsters)
        monstersRef.current = updatedMonsters
      }
    })

    // 监听宝箱拾取失败
    websocketClient.on('lootbox_pickup_failed', (data) => {
      const { lootBoxId, message } = data
      console.log('❌ Loot box pickup failed:', message)
      
      // 清除拾取标记
      if (lootBoxId) {
        pickingLootBox.current.delete(lootBoxId)
      }
      
      // 注意：不需要恢复宝箱UI，因为服务器会通过 game_state_synced 重新同步
      // 或者玩家刷新页面后会重新获取
      
      alertManager.error(`Pickup failed: ${message}`)
    })

    // 监听宝箱被拾取
    const handleLootBoxPicked = (data) => {
      const { lootBoxId, playerId } = data
      console.log('📦 [lootbox_picked] Received event:', { lootBoxId, playerId })
      console.log('📦 Current loot boxes:', lootBoxes.length, lootBoxesRef.current.length)
      
      // 移除宝箱（如果还在的话）
      // 注意：发起者已经在 onOpen 中移除了，这里主要是为了同步其他玩家
      setLootBoxes(prev => {
        const exists = prev.some(box => box.id === lootBoxId)
        if (exists) {
          console.log('📦 [lootbox_picked] Removing loot box from UI')
          const updated = prev.filter(box => box.id !== lootBoxId)
          lootBoxesRef.current = updated
          console.log(`📦 Removed loot box ${lootBoxId}, remaining: ${updated.length}`)
          return updated
        } else {
          console.log('📦 [lootbox_picked] Loot box already removed')
          return prev
        }
      })
      
      // 清除拾取标记
      console.log('📦 Clearing picking flag for:', lootBoxId)
      pickingLootBox.current.delete(lootBoxId)
      
      // 如果是自己拾取的，在后台铸造武器（不阻塞主线程）
      if (playerId === (window.currentWalletAddress || character.owner)) {
        // 检查是否已处理过这个宝箱（只检查自己的）
        if (processedLootBoxes.current.has(lootBoxId)) {
          console.log('⚠️ Loot box already processed, skipping weapon mint...')
          return
        }
        
        // 标记为已处理
        processedLootBoxes.current.add(lootBoxId)
        
        console.log('🎁 I picked the loot box, minting weapon in background...')
        
        // 显示loading
        setIsMintingWeapon(true)
        
        // 在后台异步执行，不阻塞主线程
        ;(async () => {
          try {
            // 添加延迟，避免区块链并发问题
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            const walletAddress = window.currentWalletAddress || character.owner
            console.log('🔄 Starting weapon minting for:', walletAddress)
            
            const { result, weaponInfo } = await mintRandomWeaponForPlayer(walletAddress)
            
            console.log('✅ Weapon minted successfully!')
            console.log('🎁 Weapon info:', weaponInfo)
            console.log('📝 Transaction digest:', result.digest)
            
            // 直接显示武器奖励（使用交易返回的信息）
            if (weaponInfo && weaponInfo.weaponType && weaponInfo.rarity) {
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
                objectId: weaponInfo.objectId,
                name: weaponNames[weaponInfo.weaponType]?.[weaponInfo.rarity] || 'Unknown Weapon',
                weaponType: weaponInfo.weaponType,
                attack: weaponAttacks[weaponInfo.weaponType]?.[weaponInfo.rarity] || 20,
                level: 1,
                rarity: weaponInfo.rarity,
                owner: walletAddress
              }
              
              console.log('🎉 Showing weapon reward:', constructedWeapon)
              setShowWeaponReward(constructedWeapon)
            } else {
              console.warn('⚠️ Weapon info incomplete, showing generic reward')
              alertManager.success('Weapon minted! Please check your inventory')
            }
          } catch (error) {
            console.error('❌ Failed to mint weapon:', error)
            console.error('Error details:', error.message)
            alertManager.error('Failed to mint weapon: ' + error.message + '\nPlease check your inventory or try again later')
          } finally {
            // 隐藏loading
            setIsMintingWeapon(false)
          }
        })() // 立即执行异步函数，但不等待结果
      }
    }
    
    // 注册宝箱拾取监听器
    websocketClient.on('lootbox_picked', handleLootBoxPicked)

    // 监听怪物受伤
    websocketClient.on('monster_damaged', (data) => {
      const { monsterId, damage, attackerId } = data
      console.log('💥 Monster damaged:', monsterId, 'damage:', damage, 'by:', attackerId)
      // 更新怪物HP（如果是主机，已经在本地处理了）
      if (!isHost) {
        setMonsters(prev => prev.map(m => 
          m.id === monsterId ? { ...m, hp: Math.max(0, (m.hp || m.maxHp) - damage) } : m
        ))
      }
    })

    // 监听野怪状态更新（攻击动作、血条变化等）
    websocketClient.on('monster_state_updated', (data) => {
      const { monsterId, state } = data
      console.log('🐮 Monster state updated:', monsterId, state)
      
      // 非主机：更新野怪状态
      if (!isHost) {
        setMonsters(prev => prev.map(m => {
          if (m.id === monsterId) {
            return {
              ...m,
              ...state,
              _stateUpdate: { ...state, timestamp: Date.now() } // 添加时间戳触发更新
            }
          }
          return m
        }))
      }
    })

    // 监听怪物死亡（主机接收非主机玩家的击杀通知）
    websocketClient.on('monster_died', (data) => {
      const { monsterId, killerId, killerName, position } = data
      console.log(`💀 Received monster death notification: ${monsterId} killed by ${killerName}`)
      
      // 只有主机处理宝箱生成
      if (!isHost) {
        console.log('⚠️ Non-host received monster_died, ignoring')
        return
      }
      
      console.log('👑 Host generating loot box for killer:', killerName)
      
      // 检查是否已经有这个野怪的宝箱（防止重复生成）
      const existingBox = lootBoxesRef.current.find(box => box.monsterId === monsterId)
      if (existingBox) {
        console.log(`⚠️ Loot box for monster ${monsterId} already exists, skipping...`)
        return
      }
      
      // 获取被击杀的怪物信息（用于刷新）
      const killedMonster = monstersRef.current.find(m => m.id === monsterId)
      
      // 更新怪物状态（使用 ref 获取最新状态）
      const updatedMonsters = monstersRef.current.map(m => 
        m.id === monsterId ? { ...m, alive: false, hp: 0 } : m
      )
      setMonsters(updatedMonsters)
      monstersRef.current = updatedMonsters
      
      // 生成宝箱（归属于击杀者）
      // 添加随机偏移，避免宝箱重叠
      const offsetX = (Math.random() - 0.5) * 30 // -15 到 +15 像素
      const offsetY = (Math.random() - 0.5) * 30
      
      const newLootBox = {
        id: lootBoxIdCounter.current++,
        x: position.x + offsetX,
        y: position.y + offsetY,
        monsterId: monsterId,
        ownerId: killerId,
        ownerName: killerName,
        pickedBy: null
      }
      const updatedLootBoxes = [...lootBoxesRef.current, newLootBox]
      setLootBoxes(updatedLootBoxes)
      lootBoxesRef.current = updatedLootBoxes
      console.log(`📦 Host spawned loot box at (${position.x + offsetX}, ${position.y + offsetY}) for ${killerName}`)
      console.log(`� Tostal loot boxes: ${updatedLootBoxes.length}`)
      
      // 同步游戏状态给所有玩家
      console.log('📤 Host syncing game state after non-host kill')
      websocketClient.syncGameState({
        monsters: updatedMonsters,
        lootBoxes: updatedLootBoxes
      })
      
      // 设置野怪刷新计时器（1分钟后在初始点刷新）
      if (killedMonster) {
        // 清除之前的计时器（如果有）
        if (monsterRespawnTimers.current.has(monsterId)) {
          clearTimeout(monsterRespawnTimers.current.get(monsterId))
        }
        
        console.log(`⏰ Monster ${monsterId} will respawn in ${MONSTER_RESPAWN_TIME / 1000} seconds at initial position (${killedMonster.initialX}, ${killedMonster.initialY})`)
        
        const respawnTimer = setTimeout(() => {
          console.log(`🔄 Respawning monster ${monsterId} at initial position...`)
          
          // 获取怪物基础属性
          const monsterStats = {
            'CowMonster1': { maxHp: 100, attack: 10 },
            'CowMonster2': { maxHp: 150, attack: 15 }
          }
          const stats = monsterStats[killedMonster.type] || { maxHp: 100, attack: 10 }
          
          // 刷新怪物（在初始位置，满血复活）
          setMonsters(prev => {
            const respawnedMonsters = prev.map(m => 
              m.id === monsterId 
                ? { 
                    ...m, 
                    alive: true, 
                    hp: stats.maxHp,
                    x: m.initialX,
                    y: m.initialY
                  } 
                : m
            )
            monstersRef.current = respawnedMonsters
            
            // 同步游戏状态给所有玩家
            console.log('📤 Host syncing game state after monster respawn')
            websocketClient.syncGameState({
              monsters: respawnedMonsters,
              lootBoxes: lootBoxesRef.current
            })
            
            return respawnedMonsters
          })
          
          console.log(`✅ Monster ${monsterId} (${killedMonster.type}) respawned!`)
          
          // 清除计时器引用
          monsterRespawnTimers.current.delete(monsterId)
        }, MONSTER_RESPAWN_TIME)
        
        monsterRespawnTimers.current.set(monsterId, respawnTimer)
      }
    })

    // 监听其他玩家加入
    websocketClient.on('player_joined', (data) => {
      const { player } = data
      if (player.id !== currentPlayerId) {
        console.log('👤 Player joined:', player.name, 'customization:', player.customization)
        setOtherPlayers(prev => new Map(prev).set(player.id, player))
        
        // Immediately send our current position to the new player
        // This ensures they can see us right away without waiting for us to move
        if (playerPosRef.current) {
          console.log('📤 Sending my position to new player:', playerPosRef.current)
          websocketClient.sendPlayerMove(
            playerPosRef.current,
            directionRef.current,
            isMovingRef.current
          )
        }
        
        // 如果是主机，同步当前游戏状态给新玩家
        if (isHost) {
          console.log('📤 Host syncing game state to new player')
          // 使用 ref 获取最新的游戏状态
          websocketClient.syncGameState({
            monsters: monstersRef.current,
            lootBoxes: lootBoxesRef.current
          })
        }
      }
    })

    // 监听其他玩家离开
    websocketClient.on('player_left', (data) => {
      const { playerId } = data
      console.log('👋 Player left:', playerId)
      setOtherPlayers(prev => {
        const newMap = new Map(prev)
        newMap.delete(playerId)
        return newMap
      })
    })

    // 监听其他玩家移动
    websocketClient.on('player_moved', (data) => {
      const { playerId, position, direction, isMoving } = data
      setOtherPlayers(prev => {
        const newMap = new Map(prev)
        const player = newMap.get(playerId)
        if (player) {
          // Update existing player's position
          newMap.set(playerId, { ...player, position, direction, isMoving })
        } else {
          // Player not in our list yet (race condition), add them with position
          // This can happen if player_moved arrives before player_joined
          console.log('⚠️ Received move from unknown player, adding:', playerId)
          newMap.set(playerId, { id: playerId, position, direction, isMoving })
        }
        return newMap
      })
    })

    // 监听其他玩家攻击
    websocketClient.on('player_attacked', (data) => {
      console.log('⚔️ Player attacked:', data)
      // 可以在这里添加攻击特效
    })

    // 监听其他玩家HP更新
    websocketClient.on('player_hp_updated', (data) => {
      const { playerId, hp } = data
      setOtherPlayers(prev => {
        const newMap = new Map(prev)
        const player = newMap.get(playerId)
        if (player) {
          newMap.set(playerId, { ...player, hp })
        }
        return newMap
      })
    })

    return () => {
      // 清理监听器
      console.log('🧹 Cleaning up WebSocket listeners')
      websocketClient.off('room_joined')
      websocketClient.off('game_state_synced')
      websocketClient.off('monsters_updated')
      websocketClient.off('lootbox_picked', handleLootBoxPicked)
      websocketClient.off('lootbox_pickup_failed')
      websocketClient.off('monster_damaged')
      websocketClient.off('monster_state_updated')
      websocketClient.off('monster_died')
      websocketClient.off('player_joined')
      websocketClient.off('player_left')
      websocketClient.off('player_moved')
      websocketClient.off('player_attacked')
      websocketClient.off('player_hp_updated')
      
      // 清理野怪刷新计时器
      console.log('🧹 Cleaning up monster respawn timers')
      monsterRespawnTimers.current.forEach((timer, monsterId) => {
        clearTimeout(timer)
        console.log(`  Cleared respawn timer for monster ${monsterId}`)
      })
      monsterRespawnTimers.current.clear()
    }
  }, [roomId, character, isHost]) // 移除 monsters 和 lootBoxes 依赖

  // 检查并赠送武器
  useEffect(() => {
    const checkAndGiveWeapon = async () => {
      try {
        setIsCheckingWeapon(true)
        
        // 立即设置一个默认武器，确保玩家可以攻击
        // 这个默认武器会在真实武器加载后被替换
        const defaultWeapon = {
          name: 'Loading...',
          attack: 0,
          level: 1,
          rarity: 1
        }
        setPlayerWeapon(defaultWeapon)
        
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
        
        // 立即设置 ref 和 state
        const initialPos = { x: centerX, y: centerY }
        playerPosRef.current = initialPos
        setPlayerPos(initialPos)
        
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

        // 提取怪物刷新点（保存到ref，稍后由主机生成）
        const spawnsLayer = data.layers.find(layer => layer.name === 'spawns')
        if (spawnsLayer && spawnsLayer.objects) {
          const spawnPoints = spawnsLayer.objects.filter(obj => obj.name === 'Spawns')
          console.log(`Found ${spawnPoints.length} spawn points`)
          
          // 保存刷新点信息，等待确认主机身份后再生成怪物
          window.spawnPoints = spawnPoints
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
          
          // 即使没有瓦片，也要等待 5 秒
          const elapsedTime = Date.now() - loadingStartTime.current
          const remainingTime = Math.max(0, 3000 - elapsedTime)
          
          setTimeout(() => {
            setIsLoading(false)
          }, remainingTime)
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
                
                // 确保至少显示 5 秒的 loading
                const elapsedTime = Date.now() - loadingStartTime.current
                const remainingTime = Math.max(0, 5000 - elapsedTime)
                
                if (remainingTime > 0) {
                  console.log(`⏳ Waiting ${remainingTime}ms to ensure minimum loading time...`)
                  setTimeout(() => {
                    setIsLoading(false)
                  }, remainingTime)
                } else {
                  setIsLoading(false)
                }
              }
            }
            
            img.onerror = () => {
              console.warn(`Failed to load: ${imagePath}`)
              loadedCount++
              setLoadingProgress(Math.floor((loadedCount / totalImages) * 100))
              
              if (loadedCount === totalImages) {
                console.log(`Loaded ${Object.keys(loadedImages).length} tiles (${totalImages - Object.keys(loadedImages).length} failed)`)
                setTileImages(loadedImages)
                
                // 确保至少显示 5 秒的 loading
                const elapsedTime = Date.now() - loadingStartTime.current
                const remainingTime = Math.max(0, 5000 - elapsedTime)
                
                if (remainingTime > 0) {
                  console.log(`⏳ Waiting ${remainingTime}ms to ensure minimum loading time...`)
                  setTimeout(() => {
                    setIsLoading(false)
                  }, remainingTime)
                } else {
                  setIsLoading(false)
                }
              }
            }
          })
        })
      })
      .catch(err => {
        console.error('Failed to load map:', err)
        
        // 即使加载失败，也要等待 5 秒
        const elapsedTime = Date.now() - loadingStartTime.current
        const remainingTime = Math.max(0, 5000 - elapsedTime)
        
        setTimeout(() => {
          setIsLoading(false)
        }, remainingTime)
      })
  }, [])

  // 键盘控制 - 优化版，避免重复触发
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // 如果市场打开，先关闭市场
        if (isMarketplaceOpen) {
          setIsMarketplaceOpen(false)
          return
        }
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
      
      // M键打开/关闭市场
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        setIsMarketplaceOpen(prev => !prev)
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
        
        // 播放武器攻击音效
        soundManager.playWeaponAttack(characterClass)
        
        // 触发武器攻击动画
        setIsPlayerAttacking(true)
        setTimeout(() => setIsPlayerAttacking(false), 200) // 200ms后恢复
        
        // 计算玩家屏幕位置（用于攻击特效）
        const getPlayerScreenPos = () => {
          if (!canvasRef.current || !mapData || !playerPosRef.current) return null
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
          return {
            x: Math.round(scaledPlayerX - cameraX) + scaledPlayerSize * 0.5,
            y: Math.round(scaledPlayerY - cameraY) + scaledPlayerSize * 1.5
          }
        }
        
        // 找到最近的活着的怪物（用于射手/法师的粒子特效目标）
        const findNearestMonsterScreenPos = () => {
          if (!playerPosRef.current || !canvasRef.current || !mapData) return null
          let closestMonster = null
          let closestDistance = Infinity
          monstersRef.current.forEach(monster => {
            if (!monster.alive) return
            const dx = playerPosRef.current.x - monster.x
            const dy = playerPosRef.current.y - monster.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < closestDistance && distance <= PLAYER_ATTACK_RANGE) {
              closestDistance = distance
              closestMonster = monster
            }
          })
          if (!closestMonster) return null
          // 计算怪物屏幕位置
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
          return {
            x: Math.round(closestMonster.x * MAP_SCALE - cameraX),
            y: Math.round(closestMonster.y * MAP_SCALE - cameraY)
          }
        }
        
        // 触发攻击特效
        const playerScreenPos = getPlayerScreenPos()
        const targetPos = findNearestMonsterScreenPos()
        if (playerScreenPos) {
          if (characterClass === 'warrior') {
            // 武者：刀光特效（传递目标位置用于确定方向）
            setAttackEffect({ type: 'warrior', startPos: playerScreenPos, targetPos: targetPos })
          } else {
            // 射手/法师：粒子飞向目标
            if (targetPos) {
              // 有目标时飞向目标
              setAttackEffect({ type: characterClass, startPos: playerScreenPos, targetPos })
            } else {
              // 没有目标时也显示特效，向前方发射
              const forwardOffset = 100 // 向前方100像素
              setAttackEffect({
                type: characterClass,
                startPos: playerScreenPos,
                targetPos: { x: playerScreenPos.x, y: playerScreenPos.y - forwardOffset }
              })
            }
          }
        }
        
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
  }, [onExit, character, playerWeapon, PLAYER_ATTACK_INTERVAL, isInventoryOpen, isMarketplaceOpen])

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
        
        // 多人模式：同步位置到服务器（节流：每100ms最多发送一次）
        if (roomId && (!lastSyncTime.current || Date.now() - lastSyncTime.current > 100)) {
          websocketClient.sendPlayerMove({ x: newX, y: newY }, newDirection, moving)
          lastSyncTime.current = Date.now()
        }
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

  // 传送特效动画 - 简化版
  useEffect(() => {
    // 只在地图数据和玩家位置都准备好后才开始传送特效
    if (!mapData || !playerPos || !showTeleportEffect) return

    console.log('🎬 Starting teleport animation, player at:', playerPos)

    const duration = 1500 // 1.5秒传送动画
    const startTime = Date.now()
    let animationId

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      setTeleportProgress(progress)

      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      } else {
        // 动画结束，隐藏特效
        console.log('✨ Teleport animation complete, showing character')
        setShowTeleportEffect(false)
      }
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [mapData, playerPos, showTeleportEffect])

  // Auto-nudge after loading to force character render + sync position in multiplayer
  useEffect(() => {
    if (isLoading || !mapData || !playerPosRef.current) return
    
    // loading刚结束，延迟一帧后自动微移
    const timer = setTimeout(() => {
      const currentPos = playerPosRef.current
      if (currentPos) {
        const nudgedPos = { x: currentPos.x - 1, y: currentPos.y }
        playerPosRef.current = nudgedPos
        setPlayerPos(nudgedPos)
        console.log('🎮 Auto-nudge to force character render')
        
        // Multiplayer: immediately sync our position so other players can see us
        if (roomId) {
          console.log('📤 Syncing initial position to other players:', nudgedPos)
          websocketClient.sendPlayerMove(nudgedPos, directionRef.current, false)
        }
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [isLoading, mapData])

  // 玩家死亡复活倒计时
  useEffect(() => {
    if (!isDead) return

    if (respawnCountdown > 0) {
      const timer = setTimeout(() => {
        setRespawnCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      // 倒计时结束，复活玩家
      console.log('✨ Respawning player...')
      
      // 重置HP
      setPlayerCurrentHp(character.max_hp)
      
      // 传送回地图中心（初始点）
      const centerX = (mapData.width * TILE_SIZE) / 2
      const centerY = (mapData.height * TILE_SIZE) / 2
      playerPosRef.current = { x: centerX, y: centerY }
      setPlayerPos({ x: centerX, y: centerY })
      
      // 显示传送特效
      setShowTeleportEffect(true)
      
      // 重置死亡状态
      setIsDead(false)
      setRespawnCountdown(10)
      
      console.log('✅ Player respawned at center:', centerX, centerY)
    }
  }, [isDead, respawnCountdown, character.max_hp, mapData])

  // 渲染地图（智能相机跟随）- 优化版，使用 ref 避免重新创建
  useEffect(() => {
    if (!mapData || !canvasRef.current || isLoading || !playerPosRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // 设置画布大小为屏幕大小
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    console.log('🎨 Canvas initialized:', canvas.width, 'x', canvas.height)
    console.log('🎨 Player position:', playerPosRef.current)

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
        {/* 马赛克背景层 */}
        <div className="mosaic-bg"></div>
        <div className="mosaic-overlay"></div>
        
        {/* 魔法圆环 */}
        <div className="magic-circle"></div>
        
        {/* 粒子特效容器 */}
        <div className="particles-container">
          {/* 星空 */}
          {[...Array(50)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
          
          {/* 金色粒子 */}
          {[...Array(20)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${8 + Math.random() * 4}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
          
          {/* 能量球 */}
          {[...Array(15)].map((_, i) => {
            const angle = (Math.random() * 360) * Math.PI / 180;
            const distance = 200 + Math.random() * 300;
            return (
              <div
                key={`orb-${i}`}
                className="energy-orb"
                style={{
                  left: '50%',
                  top: '50%',
                  '--orbit-x': `${Math.cos(angle) * distance}px`,
                  '--orbit-y': `${Math.sin(angle) * distance}px`,
                  animationDuration: `${3 + Math.random() * 3}s`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              />
            );
          })}
          
          {/* 流星 */}
          {[...Array(5)].map((_, i) => (
            <div
              key={`meteor-${i}`}
              className="meteor"
              style={{
                left: `${Math.random() * 50}%`,
                top: `${Math.random() * 50}%`,
                animationDuration: `${1 + Math.random()}s`,
                animationDelay: `${Math.random() * 10}s`
              }}
            />
          ))}
          
          {/* 光束 */}
          {[...Array(3)].map((_, i) => (
            <div
              key={`beam-${i}`}
              className="light-beam"
              style={{
                left: `${20 + i * 30}%`,
                animationDelay: `${i * 1}s`
              }}
            />
          ))}
        </div>
        
        {/* Loading 内容卡片 */}
        <div className="loading-card">
          {/* 马赛克装饰角 */}
          <div className="card-corner tl"></div>
          <div className="card-corner tr"></div>
          <div className="card-corner bl"></div>
          <div className="card-corner br"></div>
          
          {/* 地图图标 */}
          <div className="loading-icon">🌲</div>
          
          {/* 标题 */}
          <h2 className="loading-title">
            <span className="title-line"></span>
            <span className="title-text">LOADING FOREST</span>
            <span className="title-line"></span>
          </h2>
          
          {/* 进度条容器 */}
          <div className="progress-container">
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill"
                style={{ width: `${loadingProgress}%` }}
              >
                <div className="progress-shine"></div>
              </div>
            </div>
            <div className="progress-text">{loadingProgress}%</div>
          </div>
          
          {/* 加载提示 */}
          <div className="loading-hint">
            <span className="hint-dot"></span>
            <span className="hint-dot"></span>
            <span className="hint-dot"></span>
            <span className="hint-text">Loading tiles and assets</span>
          </div>
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

  // 移除提前返回，让组件正常渲染

  // 只在有位置数据时计算屏幕位置
  const characterScreenPos = playerPos ? getCharacterScreenPosition() : { x: 0, y: 0 }
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
      {(() => {
        console.log('🎨 Rendering loot boxes:', lootBoxes.length, lootBoxes.map(b => ({ id: b.id, owner: b.ownerName })))
        return lootBoxes.map(lootBox => {
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
        
        const currentPlayerId = window.currentWalletAddress || character.owner
        const isOwner = !lootBox.ownerId || lootBox.ownerId === currentPlayerId
        const canOpen = Date.now() - lastLootBoxOpenTime.current >= 4000
        
        return (
          <LootBox
            key={lootBox.id}
            screenPosition={boxScreenPos}
            boxSize={25 * MAP_SCALE}
            ownerName={lootBox.ownerName}
            isOwner={isOwner}
            canOpen={canOpen}
            onOpen={async () => {
              const currentPlayerId = window.currentWalletAddress || character.owner
              const now = Date.now()
              
              console.log(`📦 [onOpen] Clicked loot box ${lootBox.id}`)
              console.log(`📦 [onOpen] Current loot boxes in state:`, lootBoxes.length)
              console.log(`📦 [onOpen] Current loot boxes in ref:`, lootBoxesRef.current.length)
              console.log(`📦 [onOpen] All loot box IDs:`, lootBoxes.map(b => b.id))
              
              // 检查4秒冷却
              if (now - lastLootBoxOpenTime.current < 4000) {
                console.log('⚠️ Loot box cooldown active, please wait...')
                return
              }
              
              // 防止重复点击
              if (pickingLootBox.current.has(lootBox.id)) {
                console.log('⚠️ Already picking this loot box, please wait...')
                return
              }
              
              // Check loot box ownership
              if (lootBox.ownerId && lootBox.ownerId !== currentPlayerId) {
                console.log(`⚠️ This loot box belongs to ${lootBox.ownerName}`)
                alertManager.warning(`This loot box belongs to ${lootBox.ownerName}, only they can pick it up!`)
                return
              }
              
              // 播放开宝箱音效
              soundManager.play('openchest', 0.5)
              
              // 记录打开时间
              lastLootBoxOpenTime.current = now
              
              console.log(`📦 [onOpen] Opening loot box ${lootBox.id}...`)
              console.log(`📦 [onOpen] Current picking set:`, Array.from(pickingLootBox.current))
              
              // 标记为正在拾取（防止重复点击）
              pickingLootBox.current.add(lootBox.id)
              console.log(`📦 [onOpen] Added to picking set:`, Array.from(pickingLootBox.current))
              
              // 立即从UI中移除宝箱（防止重复点击）
              console.log(`📦 [onOpen] Immediately removing loot box ${lootBox.id} from UI`)
              setLootBoxes(prev => {
                const updated = prev.filter(box => box.id !== lootBox.id)
                lootBoxesRef.current = updated
                console.log(`📦 [onOpen] Removed from UI, remaining: ${updated.length}`)
                return updated
              })
              
              // 多人模式：发送请求到服务器
              if (roomId) {
                console.log(`📦 [onOpen] Sending pickup request to server for box ${lootBox.id}`)
                websocketClient.pickupLootBox(lootBox.id)
                // UI已经移除，等待服务器响应来铸造武器
                return
              }
              
              // 单人模式：检查是否已处理
              if (processedLootBoxes.current.has(lootBox.id)) {
                console.log('⚠️ Loot box already processed, skipping...')
                return
              }
              
              // 标记为已处理
              processedLootBoxes.current.add(lootBox.id)
              
              // 单人模式：直接处理
              try {
                // 显示loading
                setIsMintingWeapon(true)
                
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
                  alertManager.error('Unable to get weapon ID, please check your inventory')
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
                alertManager.error('Failed to open loot box, please try again later')
              } finally {
                // 隐藏loading
                setIsMintingWeapon(false)
              }
            }}
            onClose={() => {
              // onClose 不再需要移除宝箱，因为服务器会通过 lootbox_picked 事件统一移除
              // 这样可以避免重复移除导致的问题
              console.log(`📦 Loot box ${lootBox.id} animation finished`)
            }}
          />
        )
        })
      })()}
      
      {/* 怪物层 - 在角色之前渲染 */}
      {(() => {
        console.log('🎨 Rendering monsters:', monsters.length, 'total,', monsters.filter(m => m.alive).length, 'alive')
        
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
          
          // 准备所有玩家位置（用于主机AI计算）
          const allPlayersPositions = Array.from(otherPlayers.values()).map(p => ({
            id: p.id,
            position: p.position
          }))
          
          return (
            <Monster
              key={monster.id}
              id={monster.id}
              type={monster.type}
              screenPosition={monsterScreenPos}
              monsterSize={MONSTER_SIZE * MAP_SCALE}
              mapScale={MAP_SCALE}
              playerPos={playerPosRef.current} // 传递玩家位置
              monsterWorldPos={{ 
                x: monster.x, 
                y: monster.y,
                hp: monster.hp, // 传递HP
                maxHp: monster.maxHp // 传递最大HP
              }} // 传递怪物世界位置
              initialPos={{ x: monster.initialX, y: monster.initialY }} // 传递初始位置
              playerAttackTrigger={playerAttackTrigger} // 传递玩家攻击触发器
              isMainTarget={isMainTarget} // 是否是主目标（最近的怪物）
              isInSplashRange={isInSplashRange} // 是否在溅射范围内（仅武者使用）
              isHost={!roomId || isHost} // 单人模式或主机执行AI
              allPlayers={allPlayersPositions} // 所有玩家位置（主机用）
              monsterStateUpdate={monster._stateUpdate} // 传递状态更新（非主机用）
              onStateChange={(monsterId, state) => {
                // 主机：广播野怪状态变化
                if (roomId && isHost) {
                  websocketClient.sendMonsterStateUpdate(monsterId, state)
                }
              }}
              onPositionUpdate={(monsterId, newX, newY, newHp) => {
                // 主机：直接更新 ref，不触发重新渲染（由同步机制统一处理）
                if (isHost) {
                  const monster = monstersRef.current.find(m => m.id === monsterId)
                  if (monster) {
                    monster.x = newX
                    monster.y = newY
                    if (newHp !== undefined) {
                      monster.hp = newHp
                    }
                  }
                } else {
                  // 非主机：正常更新 state（不应该发生，因为非主机不执行AI）
                  setMonsters(prev => prev.map(m => 
                    m.id === monsterId ? { ...m, x: newX, y: newY, hp: newHp !== undefined ? newHp : m.hp } : m
                  ))
                }
              }}
              onDeath={() => {
                console.log(`💀 Monster ${monster.id} defeated!`)
                
                // 所有玩家都更新本地怪物状态
                const updatedMonsters = monsters.map(m => 
                  m.id === monster.id ? { ...m, alive: false, hp: 0 } : m
                )
                setMonsters(updatedMonsters)
                monstersRef.current = updatedMonsters
                
                // 如果是多人模式的非主机，通知主机怪物死亡
                if (roomId && !isHost) {
                  console.log('⚠️ Non-host: notifying host about monster death')
                  const killerId = window.currentWalletAddress || character.owner
                  websocketClient.reportMonsterDeath(
                    monster.id,
                    killerId,
                    character.name,
                    { x: monster.x, y: monster.y }
                  )
                  return
                }
                
                // 主机或单人模式：生成宝箱
                const killerId = window.currentWalletAddress || character.owner
                
                // 检查是否已经有这个野怪的宝箱（防止重复生成）
                const existingBox = lootBoxesRef.current.find(box => box.monsterId === monster.id)
                if (existingBox) {
                  console.log(`⚠️ Loot box for monster ${monster.id} already exists, skipping...`)
                  return
                }
                
                // 添加随机偏移，避免宝箱重叠
                const offsetX = (Math.random() - 0.5) * 30 // -15 到 +15 像素
                const offsetY = (Math.random() - 0.5) * 30
                
                const newLootBox = {
                  id: lootBoxIdCounter.current++,
                  x: monster.x + offsetX,
                  y: monster.y + offsetY,
                  monsterId: monster.id,
                  ownerId: killerId, // 归属于击杀者
                  ownerName: character.name,
                  pickedBy: null
                }
                const updatedLootBoxes = [...lootBoxesRef.current, newLootBox]
                setLootBoxes(updatedLootBoxes)
                lootBoxesRef.current = updatedLootBoxes
                console.log(`📦 Loot box spawned at (${monster.x + offsetX}, ${monster.y + offsetY}) for ${character.name}`)
                console.log(`📦 Total loot boxes: ${updatedLootBoxes.length}`)

                // 如果是多人模式的主机，同步游戏状态
                if (roomId && isHost) {
                  console.log('📤 Host syncing game state after monster death')
                  console.log('  Monsters:', updatedMonsters.length, 'alive:', updatedMonsters.filter(m => m.alive).length)
                  console.log('  Loot boxes:', updatedLootBoxes.length)
                  console.log('  New loot box:', newLootBox)
                  websocketClient.syncGameState({
                    monsters: updatedMonsters,
                    lootBoxes: updatedLootBoxes
                  })
                }
                
                // 设置野怪刷新计时器（1分钟后在初始点刷新）
                // 清除之前的计时器（如果有）
                if (monsterRespawnTimers.current.has(monster.id)) {
                  clearTimeout(monsterRespawnTimers.current.get(monster.id))
                }
                
                console.log(`⏰ Monster ${monster.id} will respawn in ${MONSTER_RESPAWN_TIME / 1000} seconds at initial position (${monster.initialX}, ${monster.initialY})`)
                
                const respawnTimer = setTimeout(() => {
                  console.log(`🔄 Respawning monster ${monster.id} at initial position...`)
                  
                  // 获取怪物基础属性
                  const monsterStats = {
                    'CowMonster1': { maxHp: 100, attack: 10 },
                    'CowMonster2': { maxHp: 150, attack: 15 }
                  }
                  const stats = monsterStats[monster.type] || { maxHp: 100, attack: 10 }
                  
                  // 刷新怪物（在初始位置，满血复活）
                  setMonsters(prev => {
                    const respawnedMonsters = prev.map(m => 
                      m.id === monster.id 
                        ? { 
                            ...m, 
                            alive: true, 
                            hp: stats.maxHp,
                            x: m.initialX,
                            y: m.initialY
                          } 
                        : m
                    )
                    monstersRef.current = respawnedMonsters
                    
                    // 如果是多人模式的主机，同步游戏状态
                    if (roomId && isHost) {
                      console.log('📤 Host syncing game state after monster respawn')
                      websocketClient.syncGameState({
                        monsters: respawnedMonsters,
                        lootBoxes: lootBoxesRef.current
                      })
                    }
                    
                    return respawnedMonsters
                  })
                  
                  console.log(`✅ Monster ${monster.id} (${monster.type}) respawned!`)
                  
                  // 清除计时器引用
                  monsterRespawnTimers.current.delete(monster.id)
                }, MONSTER_RESPAWN_TIME)
                
                monsterRespawnTimers.current.set(monster.id, respawnTimer)
              }}
              onAttackPlayer={(damage) => {
                // 如果玩家已经死亡，不再受到伤害
                if (isDead) return
                
                // 怪物攻击玩家
                const newHp = Math.max(0, playerCurrentHp - damage)
                setPlayerCurrentHp(newHp)
                console.log(`🩸 Player hit! Damage: ${damage}, HP: ${newHp}/${character.max_hp}`)
                
                if (newHp <= 0) {
                  console.log('💀 Player defeated!')
                  setIsDead(true)
                  setRespawnCountdown(10)
                }
              }}
            />
          )
        })
      })()}
      
      {/* 其他玩家层 */}
      {Array.from(otherPlayers.values()).map(player => {
        // 计算其他玩家在屏幕上的位置
        const getOtherPlayerScreenPosition = (playerX, playerY) => {
          if (!canvasRef.current || !mapData || !playerPosRef.current) return { x: 0, y: 0 }
          
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

          const scaledOtherX = Math.round(playerX * MAP_SCALE)
          const scaledOtherY = Math.round(playerY * MAP_SCALE)
          
          return {
            x: Math.round(scaledOtherX - cameraX),
            y: Math.round(scaledOtherY - cameraY)
          }
        }

        const otherPlayerScreenPos = getOtherPlayerScreenPosition(
          player.position?.x || 0, 
          player.position?.y || 0
        )

        return (
          <div key={player.id}>
            <MapCharacter 
              character={{
                name: player.name || 'Player',
                id: player.classId || character.id,
                customization: player.customization // Use player's own customization for correct appearance
              }}
              screenPosition={otherPlayerScreenPos}
              walkOffset={{ x: 0, y: 0 }}
              direction={player.direction || 'down'}
              playerSize={scaledPlayerSize}
              mapScale={MAP_SCALE}
              weapon={null}
              isOtherPlayer={true}
            />
            {/* 显示其他玩家名字 */}
            <div style={{
              position: 'absolute',
              left: otherPlayerScreenPos.x + scaledPlayerSize / 2,
              top: otherPlayerScreenPos.y - 20,
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap'
            }}>
              {player.name}
            </div>
          </div>
        )
      })}

      {/* 角色层 - 叠加在Canvas上 */}
      {playerPos && (
        <MapCharacter 
          character={character}
          screenPosition={characterScreenPos}
          walkOffset={scaledWalkOffset}
          direction={direction}
          playerSize={scaledPlayerSize}
          mapScale={MAP_SCALE}
          weapon={playerWeapon}
          isAttacking={isPlayerAttacking}
        />
      )}
      
      {/* 攻击特效层 */}
      {attackEffect && (
        <AttackEffect
          type={attackEffect.type}
          startPos={attackEffect.startPos}
          targetPos={attackEffect.targetPos}
          mapScale={MAP_SCALE}
          onComplete={() => setAttackEffect(null)}
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
        onOpenMarketplace={() => setIsMarketplaceOpen(true)}
      />
      
      {/* 死亡灰屏和复活倒计时 - 黑金配色 */}
      {isDead && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.5s ease-out'
        }}>
          {/* 死亡标题 - 黑金配色 */}
          <div style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 40px rgba(255, 215, 0, 0.5))',
            marginBottom: '40px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            💀 YOU DIED 💀
          </div>
          
          {/* 倒计时圆环 - 黑金配色 */}
          <div style={{
            position: 'relative',
            width: '200px',
            height: '200px',
            marginBottom: '30px'
          }}>
            {/* 外圈光晕 - 金色 */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
              animation: 'glow 2s ease-in-out infinite'
            }} />
            
            {/* 倒计时圆环背景 */}
            <svg style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: 'rotate(-90deg)'
            }}>
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="rgba(255, 215, 0, 0.15)"
                strokeWidth="8"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="url(#goldGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - respawnCountdown / 10)}`}
                style={{
                  transition: 'stroke-dashoffset 1s linear',
                  filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.9))'
                }}
              />
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#b8860b" />
                  <stop offset="30%" stopColor="#ffd700" />
                  <stop offset="50%" stopColor="#ffed4e" />
                  <stop offset="70%" stopColor="#ffd700" />
                  <stop offset="100%" stopColor="#daa520" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* 倒计时数字 - 完美居中 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '200px',
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '5rem',
              fontWeight: '900',
              fontFamily: 'Arial, sans-serif',
              color: '#ffd700',
              textShadow: '0 0 30px rgba(255, 215, 0, 1), 0 0 50px rgba(255, 215, 0, 0.7)',
              userSelect: 'none',
              lineHeight: '1'
            }}>
              {respawnCountdown}
            </div>
          </div>
          
          {/* 复活提示 - 黑金配色 */}
          <div style={{
            fontSize: '1.5rem',
            color: '#c9c9c9',
            textAlign: 'center',
            maxWidth: '600px',
            lineHeight: '1.8'
          }}>
            <div style={{ 
              marginBottom: '10px',
              color: '#ffd700',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
            }}>
              ⏳ Respawning...
            </div>
            <div style={{ 
              fontSize: '1.2rem', 
              color: '#ffed4e',
              textShadow: '0 0 8px rgba(255, 237, 78, 0.4)'
            }}>
              You will respawn at the starting point in {respawnCountdown} seconds
            </div>
          </div>
        </div>
      )}
      
      {/* Room Info Display - Bottom Right, Black & Gold Theme */}
      {roomId && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, rgba(15, 12, 41, 0.95) 0%, rgba(30, 25, 50, 0.95) 100%)',
          color: '#ffd700',
          padding: '15px 20px',
          borderRadius: '12px',
          border: '2px solid rgba(255, 215, 0, 0.6)',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 15px rgba(255, 215, 0, 0.1)',
          zIndex: 100,
          minWidth: '180px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            fontSize: '0.85rem', 
            color: 'rgba(255, 215, 0, 0.7)', 
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            🏠 Multiplayer Room
          </div>
          <div style={{ 
            fontSize: '1.3rem', 
            fontWeight: 'bold', 
            letterSpacing: '3px', 
            marginBottom: '10px',
            color: '#ffd700',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
          }}>
            {roomId}
          </div>
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#ffed4e',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.6))' }}>👥</span>
            <span>{otherPlayers.size + 1} Players Online</span>
          </div>
        </div>
      )}
      
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
      
      {/* 市场系统 */}
      <Marketplace 
        character={character}
        isOpen={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
      />
      
      {/* Minting Loading */}
      {isMintingWeapon && <MintingLoader />}
      
      {/* 武器奖励弹窗 */}
      {showWeaponReward && (
        <WeaponReward 
          weapon={showWeaponReward}
          onClose={() => setShowWeaponReward(null)}
        />
      )}
      
      {/* 教程弹窗 */}
      {showTutorial && (
        <TutorialPopup onClose={() => setShowTutorial(false)} />
      )}
    </div>
  )
}

export default ForestMap

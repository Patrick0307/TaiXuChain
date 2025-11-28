import { useState, useEffect, useRef } from 'react'
import soundManager from '../../utils/soundManager'

function Monster({ 
  id,
  type, // 'CowMonster1' or 'CowMonster2'
  screenPosition, 
  monsterSize,
  mapScale,
  playerPos, // 玩家位置
  monsterWorldPos, // 怪物在世界中的位置
  initialPos, // 怪物初始位置（刷新点）
  onPositionUpdate, // 位置更新回调
  onDeath,
  onAttackPlayer, // 攻击玩家回调
  playerAttackTrigger, // 玩家攻击触发器（时间戳）
  isMainTarget, // 是否是主目标（最近的怪物）
  isInSplashRange, // 是否在溅射范围内（仅武者使用）
  isHost = true, // 是否是主机（主机执行AI，非主机只显示）
  allPlayers = [], // 所有玩家位置（主机用于计算最近的玩家）
  monsterStateUpdate = null, // 野怪状态更新（用于非主机同步攻击动作和血条）
  onStateChange = null // 状态变化回调（主机用于广播状态）
}) {
  const [isAttacking, setIsAttacking] = useState(false)
  const [attackFrame, setAttackFrame] = useState(0)
  const [isDead, setIsDead] = useState(false)
  const [deathAnimation, setDeathAnimation] = useState(0) // 死亡动画进度 0-1
  // 使用传入的 HP，如果没有则使用默认值
  const [currentHp, setCurrentHp] = useState(monsterWorldPos?.hp || 150) // 怪物当前生命值
  const [maxHp] = useState(monsterWorldPos?.maxHp || 150) // 怪物最大生命值
  const [showHealthBar, setShowHealthBar] = useState(false) // 是否显示血条
  const [isActivated, setIsActivated] = useState(false) // 野怪是否被激活过
  const [showDamage, setShowDamage] = useState(null) // 显示伤害数字
  const attackIntervalRef = useRef(null)
  const healthBarTimerRef = useRef(null)
  const returnTimerRef = useRef(null) // 回归延迟计时器
  const lastAttackTimeRef = useRef(0) // 上次攻击玩家的时间
  const lastPlayerAttackRef = useRef(0) // 上次被玩家攻击的时间
  
  // 非主机的位置插值


  // 攻击动画帧数（根据实际图片数量）
  const ATTACK_FRAMES = 12 // Minotaur_02_Attacking_000 到 011
  const DETECT_RANGE = 90 // 检测范围（像素）- 与玩家仇恨范围一致
  const ATTACK_RANGE = 60 // 攻击范围（像素）- 与玩家攻击范围一致
  const MAX_CHASE_DISTANCE = 150 // 最大追击距离（像素）- 缩小追击距离
  const MOVE_SPEED = 0.8 // 怪物移动速度（比角色慢一些，让玩家可以逃跑）
  const RETURN_SPEED = 1.2 // 回归速度（比追击快，确保能快速回到原位）
  const RETURN_THRESHOLD = 5 // 回归阈值（距离初始位置小于这个值就停止）
  const RETURN_DELAY = 3000 // 回归延迟（毫秒）- 玩家离开3秒后才开始回归
  const MONSTER_ATTACK = 12 // 怪物攻击力
  const MONSTER_ATTACK_INTERVAL = 1500 // 怪物攻击间隔（毫秒）

  // 开始攻击时播放攻击动画
  useEffect(() => {
    if (isAttacking && !isDead) {
      attackIntervalRef.current = setInterval(() => {
        setAttackFrame(prev => {
          const nextFrame = (prev + 1) % ATTACK_FRAMES
          // 在最后一帧（第11帧）时播放攻击音效
          if (nextFrame === ATTACK_FRAMES - 1) {
            soundManager.playMonsterAttack()
          }
          return nextFrame
        })
      }, 80) // 每80ms切换一帧，快速播放攻击动画
    } else {
      if (attackIntervalRef.current) {
        clearInterval(attackIntervalRef.current)
      }
      setAttackFrame(0) // 不攻击时显示第一帧（站立）
    }

    return () => {
      if (attackIntervalRef.current) {
        clearInterval(attackIntervalRef.current)
      }
    }
  }, [isAttacking, isDead])

  // 使用 ref 存储最新的位置信息，避免频繁重建 interval
  const playerPosRef = useRef(playerPos)
  const monsterWorldPosRef = useRef(monsterWorldPos)
  const initialPosRef = useRef(initialPos)
  const onPositionUpdateRef = useRef(onPositionUpdate)

  // 更新 refs
  useEffect(() => {
    playerPosRef.current = playerPos
    monsterWorldPosRef.current = monsterWorldPos
    initialPosRef.current = initialPos
    onPositionUpdateRef.current = onPositionUpdate
  }, [playerPos, monsterWorldPos, initialPos, onPositionUpdate])

  // 同步传入的 HP（非主机接收主机同步的 HP）
  useEffect(() => {
    if (!isHost && monsterWorldPos?.hp !== undefined) {
      setCurrentHp(monsterWorldPos.hp)
    }
  }, [monsterWorldPos?.hp, isHost])

  // 非主机：接收野怪状态更新（攻击动作、血条变化等）
  useEffect(() => {
    if (!isHost && monsterStateUpdate && monsterStateUpdate.monsterId === id) {
      console.log(`📥 [Monster ${id}] Received state update:`, monsterStateUpdate)
      
      // 更新攻击状态
      if (monsterStateUpdate.isAttacking !== undefined) {
        setIsAttacking(monsterStateUpdate.isAttacking)
        if (monsterStateUpdate.isAttacking) {
          setShowHealthBar(true)
        }
      }
      
      // 更新HP
      if (monsterStateUpdate.hp !== undefined) {
        const oldHp = currentHp
        setCurrentHp(monsterStateUpdate.hp)
        
        // 显示伤害数字
        if (monsterStateUpdate.damage !== undefined && monsterStateUpdate.damage > 0) {
          setShowDamage(monsterStateUpdate.damage)
          setTimeout(() => setShowDamage(null), 800)
        }
        
        // 显示血条
        setShowHealthBar(true)
        
        console.log(`💔 [Monster ${id}] HP updated: ${oldHp} → ${monsterStateUpdate.hp}`)
      }
      
      // 更新激活状态
      if (monsterStateUpdate.isActivated !== undefined) {
        setIsActivated(monsterStateUpdate.isActivated)
      }
    }
  }, [monsterStateUpdate, isHost, id, currentHp])

  // 怪物AI逻辑函数（提取出来以便复用）
  const updateMonsterBehavior = () => {
    if (isDead || !isHost) return // 非主机不执行AI

    const currentPlayerPos = playerPosRef.current
    const currentMonsterPos = monsterWorldPosRef.current
    const currentInitialPos = initialPosRef.current
    const currentOnPositionUpdate = onPositionUpdateRef.current

    if (!currentPlayerPos || !currentMonsterPos || !currentInitialPos || !currentOnPositionUpdate) return

    // 如果是主机且有多个玩家，找到最近的玩家
    let targetPlayerPos = currentPlayerPos
    let minDistance = Infinity
    
    if (isHost && allPlayers && allPlayers.length > 0) {
      // 遍历所有玩家，找到最近的
      allPlayers.forEach(player => {
        if (player.position) {
          const dx = player.position.x - currentMonsterPos.x
          const dy = player.position.y - currentMonsterPos.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < minDistance) {
            minDistance = dist
            targetPlayerPos = player.position
          }
        }
      })
      
      // 也考虑主机自己
      const dxSelf = currentPlayerPos.x - currentMonsterPos.x
      const dySelf = currentPlayerPos.y - currentMonsterPos.y
      const distSelf = Math.sqrt(dxSelf * dxSelf + dySelf * dySelf)
      if (distSelf < minDistance) {
        minDistance = distSelf
        targetPlayerPos = currentPlayerPos
      }
    }

    // 计算目标玩家和怪物之间的距离
    const dx = targetPlayerPos.x - currentMonsterPos.x
    const dy = targetPlayerPos.y - currentMonsterPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 计算怪物与初始位置的距离
    const dxToHome = currentInitialPos.x - currentMonsterPos.x
    const dyToHome = currentInitialPos.y - currentMonsterPos.y
    const distanceToHome = Math.sqrt(dxToHome * dxToHome + dyToHome * dyToHome)

    // 如果怪物离初始位置太远，强制回归（防止怪物被拉太远）
    if (distanceToHome > MAX_CHASE_DISTANCE) {
      // 清除回归计时器
      if (returnTimerRef.current && returnTimerRef.current !== 'returning') {
        clearTimeout(returnTimerRef.current)
      }
      // 立即开始回归
      returnTimerRef.current = 'returning'
      
      // 停止攻击
      if (isAttacking) {
        setIsAttacking(false)
      }
      
      // 快速回归
      const dirXToHome = dxToHome / distanceToHome
      const dirYToHome = dyToHome / distanceToHome
      
      const newX = currentMonsterPos.x + dirXToHome * RETURN_SPEED
      const newY = currentMonsterPos.y + dirYToHome * RETURN_SPEED
      
      currentOnPositionUpdate(id, newX, newY)
      setShowHealthBar(true) // 显示血条表示正在回归
      
      return // 跳过其他逻辑
    }

    // 如果玩家在检测范围内
    if (distance < DETECT_RANGE) {
      // 清除回归计时器（玩家回来了）
      if (returnTimerRef.current) {
        clearTimeout(returnTimerRef.current)
        returnTimerRef.current = null
      }
      
      // 激活野怪
      if (!isActivated) {
        setIsActivated(true)
      }
      
      if (distance > ATTACK_RANGE) {
        // 移动向玩家
        const dirX = dx / distance // 归一化方向
        const dirY = dy / distance
        
        const newX = currentMonsterPos.x + dirX * MOVE_SPEED
        const newY = currentMonsterPos.y + dirY * MOVE_SPEED
        
        // 更新怪物位置
        currentOnPositionUpdate(id, newX, newY)
        
        // 显示血条（表示怪物已激活）
        setShowHealthBar(true)
      } else {
        // 在攻击范围内，开始攻击
        if (!isAttacking) {
          setIsAttacking(true)
          setShowHealthBar(true) // 显示血条
          
          // 主机：广播攻击状态
          if (isHost && onStateChange) {
            onStateChange(id, { isAttacking: true, showHealthBar: true })
          }
          
          // 检查是否可以攻击玩家（攻击间隔）
          const now = Date.now()
          if (now - lastAttackTimeRef.current >= MONSTER_ATTACK_INTERVAL) {
            lastAttackTimeRef.current = now
            // 通知父组件怪物攻击了玩家
            if (onAttackPlayer) {
              onAttackPlayer(MONSTER_ATTACK)
            }
          }
          
          // 攻击持续1秒
          setTimeout(() => {
            setIsAttacking(false)
            // 主机：广播攻击结束状态
            if (isHost && onStateChange) {
              onStateChange(id, { isAttacking: false })
            }
          }, 1000)
        }
      }
    } else {
      // 玩家离开检测范围
      if (isAttacking) {
        setIsAttacking(false)
      }
      
      // 只有被激活过的野怪才会回归
      if (isActivated) {
        // 如果还没有启动回归计时器，启动它
        if (!returnTimerRef.current) {
          returnTimerRef.current = setTimeout(() => {
            // 5秒后开始回归
            returnTimerRef.current = 'returning' // 标记为正在回归
          }, RETURN_DELAY)
        }
        
        // 如果已经过了延迟时间，开始回归
        if (returnTimerRef.current === 'returning') {
          // 如果距离初始位置较远，走回去
          if (distanceToHome > RETURN_THRESHOLD) {
            const dirXToHome = dxToHome / distanceToHome
            const dirYToHome = dyToHome / distanceToHome
            
            const newX = currentMonsterPos.x + dirXToHome * RETURN_SPEED
            const newY = currentMonsterPos.y + dirYToHome * RETURN_SPEED
            
            // 更新怪物位置
            currentOnPositionUpdate(id, newX, newY)
            setShowHealthBar(true) // 显示血条表示正在回归
          } else {
            // 已经回到初始位置，重置激活状态
            setIsActivated(false)
            setShowHealthBar(false) // 隐藏血条
            returnTimerRef.current = null
          }
        }
      }
    }
  }

  // 当玩家位置改变时，立即更新怪物行为（实时响应玩家移动）
  // 只有主机执行AI
  useEffect(() => {
    if (isDead || !isHost) return
    updateMonsterBehavior()
  }, [playerPos, isHost]) // 监听玩家位置变化

  // 定时器循环（作为备用，确保怪物持续更新）
  // 只有主机执行AI
  useEffect(() => {
    if (isDead || !isHost) return

    const moveAndAttackLoop = setInterval(() => {
      updateMonsterBehavior()
    }, 50) // 每50ms更新一次（更流畅的移动）

    return () => {
      clearInterval(moveAndAttackLoop)
      if (returnTimerRef.current && returnTimerRef.current !== 'returning') {
        clearTimeout(returnTimerRef.current)
      }
    }
  }, [isDead, isAttacking, isActivated, isHost])

  // 处理玩家攻击怪物
  useEffect(() => {
    if (!playerAttackTrigger || isDead) return
    
    // 检查是否是新的攻击（避免重复处理）
    if (playerAttackTrigger === lastPlayerAttackRef.current) return
    lastPlayerAttackRef.current = playerAttackTrigger
    
    // 检查玩家是否在攻击范围内
    if (!playerPos || !monsterWorldPos) return
    
    const dx = playerPos.x - monsterWorldPos.x
    const dy = playerPos.y - monsterWorldPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // 解码攻击信息
    // 编码格式：攻击力 * 10000 + 职业代码 * 100 + 时间戳
    const totalAttack = Math.floor(playerAttackTrigger / 10000) // 总攻击力
    const classCode = Math.floor((playerAttackTrigger % 10000) / 100) // 职业代码：1=武者, 2=弓箭手, 3=术士
    
    // 根据职业判断攻击类型
    const isWarrior = classCode === 1
    const attackRange = ATTACK_RANGE // 攻击范围 60px
    
    // 输出详细的调试信息
    console.log(`🔍 [Monster ${id}] Attack Check:`, {
      distance: distance.toFixed(1),
      attackRange,
      isMainTarget,
      isInSplashRange,
      currentHp,
      classCode,
      className: classCode === 1 ? 'Warrior' : classCode === 2 ? 'Archer' : 'Mage'
    })
    
    if (distance <= attackRange) {
      let damage = 0
      
      if (isWarrior) {
        // 武者：范围攻击
        if (isMainTarget) {
          // 主目标受到100%伤害
          damage = totalAttack
          console.log(`⚔️ [Monster ${id}] Warrior MAIN attack: ${damage} damage`)
        } else if (isInSplashRange) {
          // 溅射范围内的怪物受到30%伤害
          damage = Math.floor(totalAttack * 0.3)
          console.log(`💥 [Monster ${id}] Warrior SPLASH attack: ${damage} damage`)
        } else {
          // 不在范围内，不受伤
          return
        }
      } else {
        // 弓箭手/术士：单体攻击
        if (!isMainTarget) {
          // 只有主目标受伤，其他怪物不受伤
          return
        }
        damage = totalAttack
        console.log(`🏹 [Monster ${id}] Single target attack: ${damage} damage`)
      }
      
      // 扣血
      const newHp = Math.max(0, currentHp - damage)
      console.log(`💔 [Monster ${id}] HP: ${currentHp} → ${newHp} (-${damage})`)
      setCurrentHp(newHp)
      
      // 如果是主机，通过回调更新父组件的怪物HP（用于同步）
      if (isHost && onPositionUpdateRef.current && monsterWorldPosRef.current) {
        onPositionUpdateRef.current(id, monsterWorldPosRef.current.x, monsterWorldPosRef.current.y, newHp)
      }
      
      // 显示伤害数字
      setShowDamage(damage)
      setTimeout(() => setShowDamage(null), 800)
      
      // 显示血条
      setShowHealthBar(true)
      
      // 激活怪物
      const wasActivated = isActivated
      if (!isActivated) {
        setIsActivated(true)
      }
      
      // 主机：广播状态变化（HP、伤害、血条、激活状态）
      if (isHost && onStateChange) {
        onStateChange(id, {
          hp: newHp,
          damage: damage,
          showHealthBar: true,
          isActivated: !wasActivated ? true : undefined
        })
      }
      
      // 检查是否死亡
      if (newHp <= 0) {
        console.log(`💀 [Monster ${id}] DIED! (HP reached 0)`)
        
        // 停止攻击动画，定格在当前帧
        setIsAttacking(false)
        
        // 开始死亡动画 - 从内向外消失
        const startTime = Date.now()
        const animationDuration = 1200 // 1.2秒消失动画
        
        const animateDeath = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / animationDuration, 1)
          
          // 使用缓动函数让消失更自然（先慢后快）
          const easeOutCubic = 1 - Math.pow(1 - progress, 3)
          setDeathAnimation(easeOutCubic)
          
          if (progress < 1) {
            requestAnimationFrame(animateDeath)
          } else {
            // 动画结束，标记为死亡
            setIsDead(true)
            if (onDeath) {
              onDeath()
            }
          }
        }
        
        requestAnimationFrame(animateDeath)
      }
    } else if (isMainTarget) {
      // 只为主目标输出超出范围的信息
      console.log(`📏 [Monster ${id}] Out of range: ${distance.toFixed(1)}px > ${attackRange}px`)
    }
  }, [playerAttackTrigger, isDead, playerPos, monsterWorldPos, currentHp, maxHp, isActivated, isMainTarget, isInSplashRange, ATTACK_RANGE, onDeath, id, isHost])

  // 血条显示逻辑：攻击时显示，攻击结束后3秒隐藏
  useEffect(() => {
    if (isAttacking) {
      setShowHealthBar(true)
      
      // 清除之前的定时器
      if (healthBarTimerRef.current) {
        clearTimeout(healthBarTimerRef.current)
      }
    } else if (showHealthBar) {
      // 攻击结束后3秒隐藏血条
      healthBarTimerRef.current = setTimeout(() => {
        setShowHealthBar(false)
      }, 3000)
    }

    return () => {
      if (healthBarTimerRef.current) {
        clearTimeout(healthBarTimerRef.current)
      }
    }
  }, [isAttacking, showHealthBar])

  // 死亡后不再渲染
  if (isDead) {
    return null
  }

  // 根据怪物类型选择图片路径
  const getMonsterImage = () => {
    const frameStr = String(attackFrame).padStart(3, '0')
    return `/maps/Spawns/${type}/Minotaur_${type === 'CowMonster1' ? '02' : '03'}_Attacking_${frameStr}.png`
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        left: `${screenPosition.x}px`,
        top: `${screenPosition.y}px`,
        width: `${monsterSize}px`,
        height: `${monsterSize}px`,
        pointerEvents: 'none',
        zIndex: 50,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* 怪物图片 */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        WebkitMaskImage: deathAnimation > 0 
          ? `radial-gradient(circle at center, 
              black ${(1 - deathAnimation) * 100}%, 
              transparent ${(1 - deathAnimation) * 100}%)` 
          : 'none',
        maskImage: deathAnimation > 0 
          ? `radial-gradient(circle at center, 
              black ${(1 - deathAnimation) * 100}%, 
              transparent ${(1 - deathAnimation) * 100}%)` 
          : 'none',
      }}>
        <img
          src={getMonsterImage()}
          alt={`${type} monster`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
            filter: isAttacking 
              ? 'brightness(1.2) drop-shadow(0 0 10px rgba(255, 0, 0, 0.5))' 
              : 'none',
            transition: 'filter 0.1s ease'
          }}
          onError={(e) => {
            console.warn(`Failed to load monster image: ${getMonsterImage()}`)
            e.target.style.display = 'none'
          }}
        />
      </div>
      
      {/* 怪物血条 - 只在攻击或被攻击时显示 */}
      {showHealthBar && (
        <div style={{
          position: 'absolute',
          bottom: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '4px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '2px',
          overflow: 'hidden',
          transition: 'opacity 0.3s ease',
          opacity: showHealthBar ? 1 : 0
        }}>
          <div style={{
            width: `${(currentHp / maxHp) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #ff0000, #ff6666)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}
      
      {/* 伤害数字 */}
      {showDamage && (
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#ff0000',
          fontSize: '20px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          animation: 'damageFloat 0.8s ease-out',
          pointerEvents: 'none',
          zIndex: 100
        }}>
          -{showDamage}
        </div>
      )}
    </div>
  )
}

export default Monster

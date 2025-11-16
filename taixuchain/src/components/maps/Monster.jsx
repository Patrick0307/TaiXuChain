import { useState, useEffect, useRef } from 'react'

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
  onDeath
}) {
  const [isAttacking, setIsAttacking] = useState(false)
  const [attackFrame, setAttackFrame] = useState(0)
  const [isDead, setIsDead] = useState(false)
  const [showHealthBar, setShowHealthBar] = useState(false) // 是否显示血条
  const [isActivated, setIsActivated] = useState(false) // 野怪是否被激活过
  const attackIntervalRef = useRef(null)
  const healthBarTimerRef = useRef(null)
  const returnTimerRef = useRef(null) // 回归延迟计时器

  // 攻击动画帧数（根据实际图片数量）
  const ATTACK_FRAMES = 12 // Minotaur_02_Attacking_000 到 011
  const DETECT_RANGE = 150 // 检测范围（像素）- 缩小预警范围
  const ATTACK_RANGE = 40 // 攻击范围（像素）- 近距离才攻击
  const MAX_CHASE_DISTANCE = 250 // 最大追击距离（像素）- 超过这个距离强制回归
  const MOVE_SPEED = 0.8 // 怪物移动速度（比角色慢一些，让玩家可以逃跑）
  const RETURN_SPEED = 1.2 // 回归速度（比追击快，确保能快速回到原位）
  const RETURN_THRESHOLD = 5 // 回归阈值（距离初始位置小于这个值就停止）
  const RETURN_DELAY = 3000 // 回归延迟（毫秒）- 玩家离开3秒后才开始回归

  // 开始攻击时播放攻击动画
  useEffect(() => {
    if (isAttacking && !isDead) {
      attackIntervalRef.current = setInterval(() => {
        setAttackFrame(prev => (prev + 1) % ATTACK_FRAMES)
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

  // 检测玩家距离、移动向玩家、攻击或回归初始位置
  useEffect(() => {
    if (isDead) return

    const moveAndAttackLoop = setInterval(() => {
      const currentPlayerPos = playerPosRef.current
      const currentMonsterPos = monsterWorldPosRef.current
      const currentInitialPos = initialPosRef.current
      const currentOnPositionUpdate = onPositionUpdateRef.current

      if (!currentPlayerPos || !currentMonsterPos || !currentInitialPos || !currentOnPositionUpdate) return

      // 计算玩家和怪物之间的距离
      const dx = currentPlayerPos.x - currentMonsterPos.x
      const dy = currentPlayerPos.y - currentMonsterPos.y
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
            
            // 攻击持续1秒
            setTimeout(() => {
              setIsAttacking(false)
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
    }, 50) // 每50ms更新一次（更流畅的移动）

    return () => {
      clearInterval(moveAndAttackLoop)
      if (returnTimerRef.current && returnTimerRef.current !== 'returning') {
        clearTimeout(returnTimerRef.current)
      }
    }
  }, [isDead, isAttacking, isActivated, id, DETECT_RANGE, ATTACK_RANGE, MAX_CHASE_DISTANCE, MOVE_SPEED, RETURN_SPEED, RETURN_THRESHOLD, RETURN_DELAY])

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

  if (isDead) {
    return null // 死亡后不显示
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
        zIndex: 50, // 降低z-index，让怪物显示在UI下面
        transform: 'translate(-50%, -50%)',
      }}
    >
      <img
        src={getMonsterImage()}
        alt={`${type} monster`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          filter: isAttacking ? 'brightness(1.2) drop-shadow(0 0 10px rgba(255, 0, 0, 0.5))' : 'none',
          transition: 'filter 0.1s ease'
        }}
        onError={(e) => {
          console.warn(`Failed to load monster image: ${getMonsterImage()}`)
          e.target.style.display = 'none'
        }}
      />
      
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
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #ff0000, #ff6666)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}
    </div>
  )
}

export default Monster

import { useState, useEffect, useRef } from 'react'

function Monster({ 
  id,
  type, // 'CowMonster1' or 'CowMonster2'
  screenPosition, 
  monsterSize,
  mapScale,
  playerPos, // 玩家位置
  monsterWorldPos, // 怪物在世界中的位置
  onDeath
}) {
  const [isAttacking, setIsAttacking] = useState(false)
  const [attackFrame, setAttackFrame] = useState(0)
  const [isDead, setIsDead] = useState(false)
  const [showHealthBar, setShowHealthBar] = useState(false) // 是否显示血条
  const attackIntervalRef = useRef(null)
  const healthBarTimerRef = useRef(null)

  // 攻击动画帧数（根据实际图片数量）
  const ATTACK_FRAMES = 12 // Minotaur_02_Attacking_000 到 011
  const ATTACK_RANGE = 100 // 攻击范围（像素）

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

  // 检测玩家距离并决定是否攻击
  useEffect(() => {
    if (isDead || !playerPos || !monsterWorldPos) return

    const checkDistance = setInterval(() => {
      // 计算玩家和怪物之间的距离
      const dx = playerPos.x - monsterWorldPos.x
      const dy = playerPos.y - monsterWorldPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // 如果玩家在攻击范围内
      if (distance < ATTACK_RANGE) {
        // 开始攻击
        if (!isAttacking) {
          setIsAttacking(true)
          setShowHealthBar(true) // 显示血条
          
          // 攻击持续1秒
          setTimeout(() => {
            setIsAttacking(false)
          }, 1000)
        }
      } else {
        // 玩家离开范围，停止攻击
        if (isAttacking) {
          setIsAttacking(false)
        }
      }
    }, 500) // 每0.5秒检查一次距离

    return () => clearInterval(checkDistance)
  }, [isDead, playerPos, monsterWorldPos, isAttacking])

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

import { useState, useEffect, useRef } from 'react'

/**
 * 攻击特效组件
 * - 射手：绿色箭矢粒子飞向目标
 * - 法师：蓝色魔法粒子飞向目标
 * - 武者：身边出现刀光特效
 */
function AttackEffect({
  type, // 'archer' | 'mage' | 'warrior'
  startPos, // 玩家屏幕位置 { x, y }
  targetPos, // 目标怪物屏幕位置 { x, y } (射手/法师用)
  mapScale = 1,
  onComplete // 特效结束回调
}) {
  const [progress, setProgress] = useState(0)
  const [particles, setParticles] = useState([])
  const [slashLines, setSlashLines] = useState([])
  const onCompleteRef = useRef(onComplete)
  
  // 保持onComplete引用最新
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // 初始化特效
  useEffect(() => {
    if (type === 'warrior') {
      // 武者：生成多条刀光线
      const lines = []
      for (let i = 0; i < 3; i++) {
        lines.push({
          id: i,
          angle: -30 + i * 30 + (Math.random() - 0.5) * 20, // 扇形分布
          length: 50 + Math.random() * 30,
          delay: i * 40
        })
      }
      setSlashLines(lines)
    } else if (type === 'archer' || type === 'mage') {
      // 射手/法师：生成粒子
      const particleCount = type === 'mage' ? 6 : 1 // 法师多粒子，射手单箭
      const newParticles = []
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          offsetX: type === 'mage' ? (Math.random() - 0.5) * 15 : 0,
          offsetY: type === 'mage' ? (Math.random() - 0.5) * 15 : 0,
          size: type === 'mage' ? 6 + Math.random() * 4 : 3, // 射手箭矢更细
          delay: type === 'mage' ? i * 25 : 0
        })
      }
      setParticles(newParticles)
    }
  }, [type])

  // 动画进度
  useEffect(() => {
    const duration = type === 'warrior' ? 180 : 250 // 武者更快
    const startTime = Date.now()
    let animationId = null
    let completed = false

    const animate = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(elapsed / duration, 1)
      setProgress(newProgress)

      if (newProgress < 1) {
        animationId = requestAnimationFrame(animate)
      } else if (!completed) {
        completed = true
        if (onCompleteRef.current) {
          setTimeout(onCompleteRef.current, 30)
        }
      }
    }

    animationId = requestAnimationFrame(animate)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [type]) // 移除onComplete依赖，避免重复触发

  // 武者刀光特效
  if (type === 'warrior') {
    // 计算目标方向，决定刀光朝向
    let baseAngle = 0 // 默认向右
    if (targetPos && startPos) {
      const dx = targetPos.x - startPos.x
      const dy = targetPos.y - startPos.y
      baseAngle = Math.atan2(dy, dx) * 180 / Math.PI
    }
    
    return (
      <div
        style={{
          position: 'absolute',
          left: `${startPos.x}px`,
          top: `${startPos.y}px`,
          width: `${100 * mapScale}px`,
          height: `${100 * mapScale}px`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 150
        }}
      >
        {/* 多条刀光线 - 根据目标方向调整 */}
        {slashLines.map(line => {
          const lineProgress = Math.max(0, Math.min(1, (progress * 180 - line.delay) / (180 - line.delay)))
          const opacity = lineProgress < 0.6 ? lineProgress * 1.5 : (1 - lineProgress) * 2.5
          const lineLength = line.length * mapScale * lineProgress
          
          if (lineProgress <= 0) return null
          
          // 刀光角度 = 基础方向 + 扇形偏移
          const finalAngle = baseAngle + line.angle
          
          return (
            <div
              key={line.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${lineLength}px`,
                height: `${3 * mapScale}px`,
                transform: `rotate(${finalAngle}deg) translateX(${10 * mapScale}px)`,
                transformOrigin: 'left center',
                background: `linear-gradient(90deg, 
                  rgba(255, 255, 255, ${opacity}) 0%, 
                  rgba(200, 220, 255, ${opacity * 0.8}) 60%, 
                  transparent 100%)`,
                borderRadius: `${2 * mapScale}px`,
                boxShadow: `0 0 ${8 * mapScale}px rgba(200, 220, 255, ${opacity * 0.6})`,
              }}
            />
          )
        })}
        
        {/* 中心闪光 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${30 * mapScale}px`,
            height: `${30 * mapScale}px`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, 
              rgba(255, 255, 255, ${progress < 0.3 ? progress * 2 : (1 - progress) * 1.4}) 0%, 
              rgba(200, 220, 255, ${progress < 0.3 ? progress : (1 - progress) * 0.7}) 40%, 
              transparent 70%)`,
            borderRadius: '50%',
          }}
        />
      </div>
    )
  }

  // 射手/法师 粒子特效
  if (!targetPos || !startPos) return null

  const dx = targetPos.x - startPos.x
  const dy = targetPos.y - startPos.y
  const angle = Math.atan2(dy, dx) * 180 / Math.PI // 计算飞行角度

  // 颜色配置
  const colors = type === 'mage' 
    ? { primary: '#7799ff', secondary: '#aaccff', glow: 'rgba(100, 150, 255, 0.9)', trail: 'rgba(100, 150, 255, 0.4)' }
    : { primary: '#90ee90', secondary: '#c8ffc8', glow: 'rgba(100, 255, 100, 0.9)', trail: 'rgba(100, 255, 100, 0.3)' }

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 150 }}>
      {particles.map(particle => {
        const particleProgress = Math.max(0, Math.min(1, (progress * 250 - particle.delay) / (250 - particle.delay)))
        
        // 使用缓动函数让粒子加速飞行
        const easeProgress = 1 - Math.pow(1 - particleProgress, 2) // easeOutQuad
        
        const currentX = startPos.x + dx * easeProgress + particle.offsetX * (1 - easeProgress)
        const currentY = startPos.y + dy * easeProgress + particle.offsetY * (1 - easeProgress)
        
        // 粒子透明度
        const opacity = particleProgress < 0.85 ? 1 : (1 - particleProgress) * 6.67

        if (particleProgress <= 0) return null

        // 射手：细长箭矢
        if (type === 'archer') {
          const arrowLength = 20 * mapScale // 箭矢长度
          const arrowWidth = 2 * mapScale // 箭矢宽度（细）
          
          return (
            <div key={particle.id}>
              {/* 箭矢主体 - 细长线条 */}
              <div
                style={{
                  position: 'absolute',
                  left: `${currentX}px`,
                  top: `${currentY}px`,
                  width: `${arrowLength}px`,
                  height: `${arrowWidth}px`,
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  background: `linear-gradient(90deg, 
                    transparent 0%, 
                    ${colors.secondary} 20%, 
                    ${colors.primary} 50%, 
                    #ffffff 90%, 
                    #ffffff 100%)`,
                  borderRadius: `${arrowWidth}px`,
                  opacity,
                  boxShadow: `0 0 ${4 * mapScale}px ${colors.glow}`,
                }}
              />
              {/* 箭头尖端 */}
              <div
                style={{
                  position: 'absolute',
                  left: `${currentX + Math.cos(angle * Math.PI / 180) * arrowLength * 0.5}px`,
                  top: `${currentY + Math.sin(angle * Math.PI / 180) * arrowLength * 0.5}px`,
                  width: `${4 * mapScale}px`,
                  height: `${4 * mapScale}px`,
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, #ffffff 0%, ${colors.primary} 60%, transparent 100%)`,
                  borderRadius: '50%',
                  opacity,
                  boxShadow: `0 0 ${6 * mapScale}px ${colors.glow}`,
                }}
              />
              {/* 拖尾光线 */}
              {particleProgress > 0.05 && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${currentX - Math.cos(angle * Math.PI / 180) * arrowLength * 0.3}px`,
                    top: `${currentY - Math.sin(angle * Math.PI / 180) * arrowLength * 0.3}px`,
                    width: `${arrowLength * 0.8}px`,
                    height: `${1 * mapScale}px`,
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                    background: `linear-gradient(90deg, transparent 0%, ${colors.trail} 50%, transparent 100%)`,
                    borderRadius: `${1 * mapScale}px`,
                    opacity: opacity * 0.5,
                  }}
                />
              )}
            </div>
          )
        }
        
        // 法师：圆形魔法粒子
        return (
          <div key={particle.id}>
            {/* 主粒子 */}
            <div
              style={{
                position: 'absolute',
                left: `${currentX}px`,
                top: `${currentY}px`,
                width: `${particle.size * mapScale}px`,
                height: `${particle.size * mapScale}px`,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${colors.primary} 0%, ${colors.secondary} 60%, transparent 100%)`,
                borderRadius: '50%',
                opacity,
                boxShadow: `0 0 ${particle.size * mapScale * 1.5}px ${colors.glow}`,
              }}
            />
            {/* 拖尾 */}
            {particleProgress > 0.1 && (
              <div
                style={{
                  position: 'absolute',
                  left: `${currentX - dx * 0.15 * easeProgress}px`,
                  top: `${currentY - dy * 0.15 * easeProgress}px`,
                  width: `${particle.size * mapScale * 2}px`,
                  height: `${particle.size * mapScale * 0.5}px`,
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  background: `linear-gradient(90deg, transparent 0%, ${colors.trail} 50%, transparent 100%)`,
                  borderRadius: `${particle.size * mapScale}px`,
                  opacity: opacity * 0.6,
                }}
              />
            )}
          </div>
        )
      })}
      
      {/* 法师额外的魔法光环效果 */}
      {type === 'mage' && progress > 0.1 && progress < 0.85 && (
        <div
          style={{
            position: 'absolute',
            left: `${startPos.x + dx * (1 - Math.pow(1 - progress, 2))}px`,
            top: `${startPos.y + dy * (1 - Math.pow(1 - progress, 2))}px`,
            width: `${20 * mapScale}px`,
            height: `${20 * mapScale}px`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, 
              rgba(150, 180, 255, 0.8) 0%, 
              rgba(100, 150, 255, 0.4) 50%, 
              transparent 100%)`,
            borderRadius: '50%',
            boxShadow: `0 0 ${25 * mapScale}px rgba(100, 150, 255, 0.5)`,
          }}
        />
      )}
    </div>
  )
}

export default AttackEffect

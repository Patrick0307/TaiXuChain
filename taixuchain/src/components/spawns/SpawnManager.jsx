import { useState, useEffect } from 'react'
import Monster from './Monster'

// 固定的刷新点配置
const SPAWN_POINTS = [
  // 史莱姆刷新点 (低等级区域 - 左上)
  { id: 1, x: 400, y: 300, type: 'slime', level: 1, respawnTime: 30000 },
  { id: 2, x: 500, y: 350, type: 'slime', level: 2, respawnTime: 30000 },
  { id: 3, x: 600, y: 280, type: 'slime', level: 3, respawnTime: 30000 },
  
  // 哥布林刷新点 (中等级区域 - 中部)
  { id: 4, x: 700, y: 500, type: 'goblin', level: 4, respawnTime: 45000 },
  { id: 5, x: 800, y: 450, type: 'goblin', level: 5, respawnTime: 45000 },
  { id: 6, x: 900, y: 520, type: 'goblin', level: 6, respawnTime: 45000 },
  
  // 兽人刷新点 (高等级区域 - 右下)
  { id: 7, x: 1100, y: 700, type: 'orc', level: 7, respawnTime: 60000 },
  { id: 8, x: 1200, y: 650, type: 'orc', level: 8, respawnTime: 60000 },
  { id: 9, x: 1300, y: 720, type: 'orc', level: 9, respawnTime: 60000 }
]

function SpawnManager({ 
  cameraPosition, 
  mapScale, 
  tileSize 
}) {
  const [monsters, setMonsters] = useState([])
  
  // 初始化所有刷新点
  useEffect(() => {
    const initialMonsters = SPAWN_POINTS.map(spawn => ({
      ...spawn,
      isAlive: true,
      spawnedAt: Date.now()
    }))
    setMonsters(initialMonsters)
  }, [])
  
  // 处理野怪被击败
  const handleDefeat = (monsterId) => {
    setMonsters(prev => prev.map(monster => {
      if (monster.id === monsterId) {
        return { ...monster, isAlive: false, defeatedAt: Date.now() }
      }
      return monster
    }))
  }
  
  // 处理野怪重生
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setMonsters(prev => prev.map(monster => {
        if (!monster.isAlive && monster.defeatedAt) {
          const spawnPoint = SPAWN_POINTS.find(sp => sp.id === monster.id)
          if (spawnPoint && now - monster.defeatedAt >= spawnPoint.respawnTime) {
            return { ...monster, isAlive: true, spawnedAt: now, defeatedAt: null }
          }
        }
        return monster
      }))
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <>
      {monsters.map(monster => {
        if (!monster.isAlive) return null
        
        // 计算屏幕位置
        const screenX = monster.x - cameraPosition.x
        const screenY = monster.y - cameraPosition.y
        
        return (
          <Monster
            key={monster.id}
            type={monster.type}
            level={monster.level}
            position={{ x: monster.x, y: monster.y }}
            screenPosition={{ x: screenX, y: screenY }}
            mapScale={mapScale}
            onDefeat={() => handleDefeat(monster.id)}
          />
        )
      })}
    </>
  )
}

export default SpawnManager

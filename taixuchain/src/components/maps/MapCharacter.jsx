import PixelCharacter from '../PixelCharacter'

// 武器名称到文件名的映射
const WEAPON_IMAGE_MAP = {
  // 剑 (Warrior)
  'Iron Sword': '/weapons/swords/Iron Sword.png',
  'Azure Edge Sword': '/weapons/swords/Azure Edge Sword.png',
  'Dragon Roar Sword': '/weapons/swords/Dragon Roar Sword.png',
  
  // 弓 (Archer)
  'Hunter Bow': '/weapons/bows/Hunter Bow.png',
  'Swift Wind Bow': '/weapons/bows/Swift Wind Bow.png',
  'Cloud Piercer Bow': '/weapons/bows/Cloud Piercer Bow.png',
  
  // 法杖 (Mage)
  'Wooden Staff': '/weapons/staves/Wooden  Stave.png',
  'Starlight Staff': '/weapons/staves/Starlight Stave.png',
  'Primordial Staff': '/weapons/staves/Primordial Stave.png',
}

function MapCharacter({ 
  character, 
  screenPosition, 
  walkOffset, 
  direction, 
  playerSize, 
  mapScale,
  weapon 
}) {
  // 获取武器图片路径
  const weaponImagePath = weapon ? WEAPON_IMAGE_MAP[weapon.name] : null
  
  return (
    <div 
      style={{
        position: 'absolute',
        left: `${screenPosition.x + walkOffset.x}px`,
        top: `${screenPosition.y + walkOffset.y}px`,
        width: `${playerSize}px`,
        height: `${playerSize}px`,
        pointerEvents: 'none',
        zIndex: 100,
        imageRendering: 'pixelated',
        willChange: 'transform'
      }}
    >
      <PixelCharacter 
        classId={character.id}
        gender={character.customization?.gender}
        customization={character.customization}
        scale={mapScale * 0.3125}
      />
      
      {/* 武器显示 */}
      {weaponImagePath && (
        <img 
          src={weaponImagePath}
          alt={weapon.name}
          style={{
            position: 'absolute',
            width: `${playerSize * 1.2}px`,
            height: `${playerSize * 1.2}px`,
            right: '15%',
            top: '185%',
            transform: 'translate(0, -50%) rotateY(180deg)',
            imageRendering: 'pixelated',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
      
      {/* 角色名字和等级 - 马赛克风格 */}
      <div style={{
        position: 'absolute',
        top: `${-18 * mapScale}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: `${4 * mapScale}px`,
        whiteSpace: 'nowrap',
        imageRendering: 'pixelated'
      }}>
        {/* 等级马赛克徽章 */}
        <div style={{
          position: 'relative',
          width: `${14 * mapScale}px`,
          height: `${14 * mapScale}px`,
          flexShrink: 0
        }}>
          {/* 外层像素边框 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            clipPath: 'polygon(0 2px, 2px 2px, 2px 0, calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px))',
            imageRendering: 'pixelated'
          }} />
          {/* 金色背景 */}
          <div style={{
            position: 'absolute',
            inset: `${2 * mapScale}px`,
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            imageRendering: 'pixelated'
          }} />
          {/* 高光效果 */}
          <div style={{
            position: 'absolute',
            top: `${3 * mapScale}px`,
            left: `${3 * mapScale}px`,
            width: `${4 * mapScale}px`,
            height: `${4 * mapScale}px`,
            background: 'rgba(255, 255, 255, 0.5)',
            imageRendering: 'pixelated'
          }} />
          {/* 等级数字 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${8 * mapScale}px`,
            fontWeight: 'bold',
            color: '#000',
            textShadow: '1px 1px 0 rgba(255,255,255,0.3)',
            fontFamily: 'monospace',
            imageRendering: 'pixelated'
          }}>
            {character.level || 1}
          </div>
        </div>
        
        {/* 名字马赛克框 */}
        <div style={{
          position: 'relative',
          imageRendering: 'pixelated'
        }}>
          {/* 外层黑色像素边框 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            clipPath: 'polygon(0 2px, 2px 2px, 2px 0, calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px))'
          }} />
          {/* 深色背景 */}
          <div style={{
            position: 'absolute',
            inset: `${2 * mapScale}px`,
            background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%)',
            imageRendering: 'pixelated'
          }} />
          {/* 金色内边框 */}
          <div style={{
            position: 'absolute',
            inset: `${2 * mapScale}px`,
            border: `${1 * mapScale}px solid #FFD700`,
            boxShadow: `inset 0 0 ${2 * mapScale}px rgba(255, 215, 0, 0.3)`,
            imageRendering: 'pixelated'
          }} />
          {/* 名字文本 */}
          <div style={{
            position: 'relative',
            color: '#FFD700',
            padding: `${3 * mapScale}px ${6 * mapScale}px`,
            fontSize: `${8 * mapScale}px`,
            fontWeight: 'bold',
            textShadow: `${1 * mapScale}px ${1 * mapScale}px 0 #000, ${-1 * mapScale}px ${-1 * mapScale}px 0 rgba(255,215,0,0.3)`,
            fontFamily: 'monospace',
            letterSpacing: `${1 * mapScale}px`,
            imageRendering: 'pixelated'
          }}>
            {character.name}
          </div>
        </div>
      </div>
      
      {/* 阴影 */}
      <div style={{
        position: 'absolute',
        bottom: `${-22 * mapScale}px`,
        left: '125%',
        transform: 'translateX(-50%)',
        width: `${playerSize * 2}px`,
        height: `${playerSize * 0.2}px`,
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
    </div>
  )
}

export default MapCharacter

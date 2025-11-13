import PixelCharacter from '../PixelCharacter'

function MapCharacter({ 
  character, 
  screenPosition, 
  walkOffset, 
  direction, 
  playerSize, 
  mapScale 
}) {
  return (
    <div 
      style={{
        position: 'absolute',
        left: `${screenPosition.x + walkOffset.x}px`,
        top: `${screenPosition.y + walkOffset.y}px`,
        width: `${playerSize}px`,
        height: `${playerSize}px`,
        transform: direction === 'left' ? 'scaleX(-1)' : 'none',
        transformOrigin: 'center',
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
      
      {/* 角色名字和等级 */}
      <div style={{
        position: 'absolute',
        top: `${-15 * mapScale}px`,
        left: '50%',
        transform: `translateX(-50%) ${direction === 'left' ? 'scaleX(-1)' : ''}`,
        display: 'flex',
        alignItems: 'center',
        gap: `${2 * mapScale}px`,
        whiteSpace: 'nowrap'
      }}>
        {/* 等级圆形徽章 */}
        <div style={{
          width: `${12 * mapScale}px`,
          height: `${12 * mapScale}px`,
          background: '#FFD700',
          border: `${1 * mapScale}px solid #000`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${7 * mapScale}px`,
          fontWeight: 'bold',
          color: '#000',
          boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
          flexShrink: 0
        }}>
          {character.level || 1}
        </div>
        
        {/* 名字 */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#FFD700',
          padding: `${2 * mapScale}px ${4 * mapScale}px`,
          borderRadius: `${2 * mapScale}px`,
          fontSize: `${8 * mapScale}px`,
          fontWeight: 'bold',
          textShadow: '1px 1px 1px #000',
          border: '1px solid rgba(255, 215, 0, 0.3)'
        }}>
          {character.name}
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

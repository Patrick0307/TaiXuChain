import '../../css/maps/MintingLoader.css'

function MintingLoader() {
  return (
    <div className="minting-loader-overlay">
      {/* 马赛克背景 */}
      <div className="minting-bg-mosaic"></div>
      
      <div className="minting-loader-container">
        {/* 宝箱图标 */}
        <div className="minting-treasure-icon">
          <img src="/maps/treasure.png" alt="treasure" />
        </div>
        
        {/* 旋转光环 */}
        <div className="minting-ring"></div>
        <div className="minting-ring-2"></div>
        
        {/* 加载文字 */}
        <div className="minting-text">
          <div className="minting-title">MINTING WEAPON</div>
          <div className="minting-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        </div>
        
        {/* 粒子效果 */}
        {[...Array(20)].map((_, i) => (
          <div 
            key={`particle-${i}`}
            className="minting-particle"
            style={{
              '--angle': `${i * 18}deg`,
              '--delay': `${i * 0.1}s`
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default MintingLoader

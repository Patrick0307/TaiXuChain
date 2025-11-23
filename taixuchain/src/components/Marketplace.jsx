import { useState, useEffect } from 'react'
import InventorySlot from './InventorySlot'
import { getAllMarketplaceListings, buyWeaponFromMarket, getLingStoneBalance } from '../utils/suiClient'
import '../css/marketplace.css'

function Marketplace({ character, isOpen, onClose }) {
  const [listings, setListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState(null)
  const [lingStoneBalance, setLingStoneBalance] = useState(0)
  const [isBuying, setIsBuying] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadListings()
      loadLingStoneBalance()
    }
  }, [isOpen, character])

  const loadListings = async () => {
    try {
      setIsLoading(true)
      console.log('🏪 Loading marketplace listings...')
      
      const allListings = await getAllMarketplaceListings()
      
      console.log(`✅ Loaded ${allListings.length} listing(s)`)
      
      if (allListings.length === 0) {
        console.log('ℹ️ No listings found. This may be due to indexer limitations.')
      }
      
      setListings(allListings)
    } catch (error) {
      console.error('Error loading marketplace listings:', error)
      alert('⚠️ 无法加载市场数据\n\n由于链上查询限制，暂时无法显示市场挂单。\n\n解决方案：\n1. 等待链下索引服务\n2. 使用合约事件查询\n3. 直接通过武器 ID 购买')
      setListings([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadLingStoneBalance = async () => {
    try {
      const walletAddress = window.currentWalletAddress || character.owner
      
      if (!walletAddress) {
        console.warn('No wallet address found')
        return
      }

      console.log('💎 Loading LingStone balance...')
      const balance = await getLingStoneBalance(walletAddress)
      setLingStoneBalance(balance)
      console.log(`✅ LingStone balance: ${balance}`)
    } catch (error) {
      console.error('Error loading LingStone balance:', error)
      setLingStoneBalance(0)
    }
  }

  const handleListingClick = (listing) => {
    if (listing) {
      setSelectedListing(selectedListing?.weaponId === listing.weaponId ? null : listing)
    }
  }

  const handleBuyWeapon = async (listing) => {
    // 使用卖家设定的价格（从最小单位转换为 LING）
    const price = listing.price / 1_000_000_000
    
    console.log('💰 Buying weapon with seller price:', price, 'LING')
    
    // 检查余额是否足够
    if (price > lingStoneBalance) {
      alert(`❌ LingStone 不足\n\n需要: ${price} LING\n余额: ${lingStoneBalance} LING`)
      return
    }
    
    // 确认对话框
    const confirmed = window.confirm(
      `💰 确定要购买这把武器吗？\n\n` +
      `武器: ${listing.weapon.name} (Lv.${listing.weapon.level})\n` +
      `攻击力: +${listing.weapon.attack}\n` +
      `品质: ${getRarityName(listing.weapon.rarity)}\n\n` +
      `💎 价格: ${price} LingStone\n` +
      `💰 你的余额: ${lingStoneBalance.toLocaleString()} LingStone\n\n` +
      `你需要签名支付 ${price} LING 和 gas 费用\n\n` +
      `此操作不可撤销！`
    )
    
    if (!confirmed) {
      return
    }

    try {
      setIsBuying(true)
      const walletAddress = window.currentWalletAddress || character.owner
      
      console.log('💰 Buying weapon:', listing.weapon.name)
      
      const result = await buyWeaponFromMarket(
        listing.escrowedObjectId,
        price,
        walletAddress
      )
      
      console.log('✅ Transaction successful:', result.digest)
      console.log('⏳ 等待区块链索引更新（4秒）...')
      
      // 等待更长时间确保区块链索引器更新（4秒）
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // 重新加载挂单列表和余额
      console.log('🔄 刷新市场列表和余额...')
      await loadListings()
      await loadLingStoneBalance()
      
      // 清除选中状态
      setSelectedListing(null)
      
      console.log('✅ 购买完成！武器已转移到你的背包')
      alert(`✅ 购买成功！\n\n获得: ${listing.weapon.name}\n\n💡 提示：打开背包查看你的新武器`)
    } catch (error) {
      console.error('Error buying weapon:', error)
      if (error.message.includes('User rejected') || error.message.includes('rejected')) {
        alert(`❌ 你取消了交易`)
      } else if (error.message.includes('Insufficient') || error.message.includes('insufficient')) {
        alert(`❌ 余额不足\n\n请确保你有足够的 LingStone 和 OCT 代币支付 gas 费用。`)
      } else {
        alert(`❌ 购买失败: ${error.message}`)
      }
    } finally {
      setIsBuying(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="marketplace-overlay" onClick={onClose}>
      <div className="marketplace-container" onClick={(e) => e.stopPropagation()}>
        <div className="marketplace-header">
          <h2>🏪 武器市场</h2>
          <div className="lingstone-display">
            <span className="lingstone-label">💎 LingStone:</span>
            <span className="lingstone-amount">{lingStoneBalance.toLocaleString()}</span>
            <button 
              className="lingstone-request-btn" 
              onClick={() => { loadListings(); loadLingStoneBalance(); }}
              disabled={isLoading}
              title="刷新市场"
              style={{ marginLeft: '10px', padding: '5px 10px' }}
            >
              {isLoading ? '⏳' : '🔄 刷新'}
            </button>
          </div>
          <button className="marketplace-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="marketplace-content">
          {/* 左侧：市场挂单列表 */}
          <div className="marketplace-grid-section">
            {isLoading ? (
              <div className="marketplace-loading">加载中...</div>
            ) : listings.length === 0 ? (
              <div className="marketplace-empty">
                <div className="empty-icon">🏪</div>
                <p>市场暂无商品</p>
                <p className="empty-hint">在背包中选择武器并上架到市场</p>
              </div>
            ) : (
              <>
                <div className="marketplace-grid">
                  {listings.map((listing) => (
                    <InventorySlot
                      key={listing.weaponId}
                      weapon={listing.weapon}
                      isSelected={selectedListing?.weaponId === listing.weaponId}
                      onClick={() => handleListingClick(listing)}
                      isEquipped={false}
                      canEquip={true}
                    />
                  ))}
                </div>
                <div className="marketplace-stats">
                  <span>商品数量: {listings.length}</span>
                </div>
              </>
            )}
          </div>

          {/* 右侧：武器详情 */}
          <div className="marketplace-details-section">
            {isLoading ? (
              <div className="marketplace-loading">加载中...</div>
            ) : selectedListing ? (
              <div className="weapon-details">
                <h3>{selectedListing.weapon.name}</h3>
                <div className="weapon-icon-large">
                  <img 
                    src={getWeaponImage(selectedListing.weapon.name, selectedListing.weapon.weaponType)} 
                    alt={selectedListing.weapon.name}
                    className="weapon-detail-img"
                  />
                </div>
                <div className="weapon-stats">
                  <div className="stat-row">
                    <span className="stat-label">类型:</span>
                    <span className="stat-value">{getWeaponTypeName(selectedListing.weapon.weaponType)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">品质:</span>
                    <span className="stat-value rarity">{getRarityName(selectedListing.weapon.rarity)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">攻击力:</span>
                    <span className="stat-value attack">+{selectedListing.weapon.attack}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">等级:</span>
                    <span className="stat-value">Lv.{selectedListing.weapon.level}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">价格:</span>
                    <span className="stat-value price">💎 {(selectedListing.price / 1_000_000_000).toLocaleString()} LING</span>
                  </div>
                </div>
                <div className="weapon-description">
                  {getWeaponDescription(selectedListing.weapon.weaponType)}
                </div>
                <div className="weapon-actions">
                  <button 
                    className="btn-buy"
                    onClick={() => handleBuyWeapon(selectedListing)}
                    disabled={isBuying}
                  >
                    {isBuying ? '⏳ 购买中...' : '💰 购买'}
                  </button>
                </div>
                <div className="marketplace-notice">
                  ℹ️ 价格由卖家设定，点击购买按钮即可按此价格购买武器。
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <div className="empty-icon">🏪</div>
                <p>选择一个武器查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 获取武器图片路径
function getWeaponImage(weaponName, weaponType) {
  const typeFolder = {
    1: 'swords',
    2: 'bows',
    3: 'staves'
  }
  
  const folder = typeFolder[weaponType] || 'swords'
  return `/weapons/${folder}/${weaponName}.png`
}

// 获取武器类型名称
function getWeaponTypeName(weaponType) {
  const names = {
    1: '剑',
    2: '弓',
    3: '法杖'
  }
  return names[weaponType] || '未知'
}

// 获取武器描述
function getWeaponDescription(weaponType) {
  const descriptions = {
    1: '锋利的剑刃，适合近战战斗。武者的首选武器。',
    2: '精准的远程武器，可以从安全距离攻击敌人。',
    3: '蕴含魔法力量的法杖，能够释放强大的魔法攻击。'
  }
  return descriptions[weaponType] || '神秘的武器'
}

// 获取品质名称
function getRarityName(rarity) {
  const names = {
    1: '普通',
    2: '稀有',
    3: '史诗'
  }
  return names[rarity] || '未知'
}

export default Marketplace

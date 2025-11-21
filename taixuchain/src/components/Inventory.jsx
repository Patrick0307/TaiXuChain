import { useState, useEffect } from 'react'
import InventorySlot from './InventorySlot'
import { getAllPlayerWeapons, getLingStoneBalance, requestLingStone } from '../utils/suiClient'
import '../css/inventory.css'

function Inventory({ character, isOpen, onClose, equippedWeapon, onEquipWeapon }) {
  const [weapons, setWeapons] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWeapon, setSelectedWeapon] = useState(null)
  const [lingStoneBalance, setLingStoneBalance] = useState(0)
  const [isRequestingLingStone, setIsRequestingLingStone] = useState(false)

  // 背包格子数量（动态扩展，无上限）
  // 根据武器数量动态计算，至少显示20个格子
  const INVENTORY_SIZE = Math.max(20, weapons.length + 5)

  useEffect(() => {
    if (isOpen) {
      loadWeapons()
      loadLingStoneBalance()
    }
  }, [isOpen, character])

  const loadWeapons = async () => {
    try {
      setIsLoading(true)
      const walletAddress = window.currentWalletAddress || character.owner
      
      if (!walletAddress) {
        console.warn('No wallet address found')
        setWeapons([])
        return
      }

      console.log('🎒 Loading all weapons from inventory...')
      
      // 获取玩家所有武器（已按时间排序）
      const allWeapons = await getAllPlayerWeapons(walletAddress)
      
      console.log(`✅ Loaded ${allWeapons.length} weapon(s)`)
      setWeapons(allWeapons)
    } catch (error) {
      console.error('Error loading weapons:', error)
      setWeapons([])
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

  const handleRequestLingStone = async () => {
    try {
      setIsRequestingLingStone(true)
      const walletAddress = window.currentWalletAddress || character.owner
      
      if (!walletAddress) {
        alert('❌ 无法获取钱包地址')
        return
      }

      console.log('💎 Requesting LingStone...')
      await requestLingStone(walletAddress)
      
      // 等待交易确认（2秒）
      console.log('⏳ 等待交易确认...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 重新加载余额
      await loadLingStoneBalance()
      
      alert('✅ 成功获得 10000 LingStone!')
    } catch (error) {
      console.error('Error requesting LingStone:', error)
      alert(`❌ 请求失败: ${error.message}`)
    } finally {
      setIsRequestingLingStone(false)
    }
  }

  const handleSlotClick = (weapon) => {
    if (weapon) {
      setSelectedWeapon(selectedWeapon?.objectId === weapon.objectId ? null : weapon)
    }
  }

  // 检查武器是否可以装备（职业匹配）
  const canEquipWeapon = (weapon) => {
    if (!weapon || !character) return false
    
    // 职业到武器类型的映射
    const classToWeaponType = {
      1: 3, // Mage -> Staff
      2: 1, // Warrior -> Sword
      3: 2, // Archer -> Bow
    }
    
    // 获取角色职业 ID
    let classId = character.class || character.id
    if (typeof classId === 'string') {
      const classNameToId = {
        'mage': 1,
        'warrior': 2,
        'archer': 3
      }
      classId = classNameToId[classId.toLowerCase()] || 2
    }
    
    const expectedWeaponType = classToWeaponType[classId]
    return weapon.weaponType === expectedWeaponType
  }

  // 装备武器
  const handleEquipWeapon = (weapon) => {
    if (!canEquipWeapon(weapon)) {
      alert('⚠️ 此武器不适合你的职业！')
      return
    }
    
    // 如果已经装备了这个武器，不做任何操作
    if (equippedWeapon?.objectId === weapon.objectId) {
      console.log('ℹ️ 武器已装备:', weapon.name)
      return
    }
    
    if (onEquipWeapon) {
      onEquipWeapon(weapon)
      console.log('✅ 装备武器:', weapon.name)
      // 显示成功提示
      alert(`✅ 已装备: ${weapon.name}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="inventory-overlay" onClick={onClose}>
      <div className="inventory-container" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-header">
          <h2>🎒 背包</h2>
          <div className="lingstone-display">
            <span className="lingstone-label">💎 LingStone:</span>
            <span className="lingstone-amount">{lingStoneBalance.toLocaleString()}</span>
            <button 
              className="lingstone-request-btn" 
              onClick={handleRequestLingStone}
              disabled={isRequestingLingStone}
              title="请求 10000 LingStone"
            >
              {isRequestingLingStone ? '⏳' : '+'}
            </button>
          </div>
          <button className="inventory-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="inventory-content">
          {/* 左侧：背包格子 */}
          <div className="inventory-grid-section">
            {/* 装备栏 */}
            <div className="equipped-section">
              <h3>🗡️ 已装备</h3>
              <div className="equipped-slot">
                {equippedWeapon ? (
                  <InventorySlot
                    weapon={equippedWeapon}
                    isSelected={selectedWeapon?.objectId === equippedWeapon.objectId}
                    onClick={() => handleSlotClick(equippedWeapon)}
                    isEquipped={true}
                    canEquip={true}
                  />
                ) : (
                  <div className="empty-equipped-slot">
                    <span>未装备武器</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 背包格子 */}
            <div className="inventory-grid">
              {Array.from({ length: INVENTORY_SIZE }).map((_, index) => {
                const weapon = weapons[index] || null
                const isEquipped = equippedWeapon?.objectId === weapon?.objectId
                const canEquipThis = weapon ? canEquipWeapon(weapon) : undefined
                return (
                  <InventorySlot
                    key={weapon?.objectId || `empty-${index}`}
                    weapon={weapon}
                    isSelected={selectedWeapon?.objectId === weapon?.objectId}
                    onClick={() => handleSlotClick(weapon)}
                    isEquipped={isEquipped}
                    canEquip={canEquipThis}
                  />
                )
              })}
            </div>
            <div className="inventory-stats">
              <span>武器数量: {weapons.length}</span>
              {equippedWeapon && <span className="equipped-indicator">✓ 已装备: {equippedWeapon.name}</span>}
            </div>
          </div>

          {/* 右侧：武器详情 */}
          <div className="inventory-details-section">
            {isLoading ? (
              <div className="inventory-loading">加载中...</div>
            ) : selectedWeapon ? (
              <div className="weapon-details">
                <h3>{selectedWeapon.name}</h3>
                <div className="weapon-icon-large">
                  <img 
                    src={getWeaponImage(selectedWeapon.name, selectedWeapon.weaponType)} 
                    alt={selectedWeapon.name}
                    className="weapon-detail-img"
                  />
                </div>
                <div className="weapon-stats">
                  <div className="stat-row">
                    <span className="stat-label">类型:</span>
                    <span className="stat-value">{getWeaponTypeName(selectedWeapon.weaponType)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">品质:</span>
                    <span className="stat-value rarity">{getRarityName(selectedWeapon.rarity)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">攻击力:</span>
                    <span className="stat-value attack">+{selectedWeapon.attack}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">等级:</span>
                    <span className="stat-value">Lv.{selectedWeapon.level}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">版本:</span>
                    <span className="stat-value">#{selectedWeapon.version}</span>
                  </div>
                </div>
                <div className="weapon-description">
                  {getWeaponDescription(selectedWeapon.weaponType)}
                </div>
                <div className="weapon-actions">
                  <button 
                    className={`btn-equip ${equippedWeapon?.objectId === selectedWeapon.objectId ? 'equipped' : ''}`}
                    onClick={() => handleEquipWeapon(selectedWeapon)}
                    disabled={!canEquipWeapon(selectedWeapon) || equippedWeapon?.objectId === selectedWeapon.objectId}
                  >
                    {equippedWeapon?.objectId === selectedWeapon.objectId ? '✓ 已装备' : '装备'}
                  </button>
                  <button className="btn-upgrade" disabled>升级</button>
                </div>
                {!canEquipWeapon(selectedWeapon) && (
                  <div className="weapon-warning">
                    ⚠️ 此武器不适合你的职业
                    <div style={{ fontSize: '0.8rem', marginTop: '5px', opacity: 0.8 }}>
                      {getClassRequirement(selectedWeapon.weaponType)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-selection">
                <div className="empty-icon">🎒</div>
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

// 获取职业要求说明
function getClassRequirement(weaponType) {
  const requirements = {
    1: '需要职业: 武者 ⚔️',
    2: '需要职业: 弓箭手 🏹',
    3: '需要职业: 术士 🪄'
  }
  return requirements[weaponType] || '未知职业要求'
}

export default Inventory

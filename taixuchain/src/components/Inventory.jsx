import { useState, useEffect } from 'react'
import InventorySlot from './InventorySlot'
import { checkPlayerWeapon } from '../utils/suiClient'
import '../css/inventory.css'

function Inventory({ character, isOpen, onClose }) {
  const [weapons, setWeapons] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWeapon, setSelectedWeapon] = useState(null)

  // 背包格子数量（可扩展）
  const INVENTORY_SIZE = 20

  useEffect(() => {
    if (isOpen) {
      loadWeapons()
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

      // 获取玩家武器
      const weapon = await checkPlayerWeapon(walletAddress)
      
      if (weapon) {
        setWeapons([weapon])
      } else {
        setWeapons([])
      }
    } catch (error) {
      console.error('Error loading weapons:', error)
      setWeapons([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSlotClick = (weapon) => {
    if (weapon) {
      setSelectedWeapon(selectedWeapon?.id === weapon.id ? null : weapon)
    }
  }

  if (!isOpen) return null

  return (
    <div className="inventory-overlay" onClick={onClose}>
      <div className="inventory-container" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-header">
          <h2>🎒 背包</h2>
          <button className="inventory-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="inventory-content">
          {/* 左侧：背包格子 */}
          <div className="inventory-grid-section">
            <div className="inventory-grid">
              {Array.from({ length: INVENTORY_SIZE }).map((_, index) => {
                const weapon = weapons[index] || null
                return (
                  <InventorySlot
                    key={index}
                    weapon={weapon}
                    isSelected={selectedWeapon?.id === weapon?.id}
                    onClick={() => handleSlotClick(weapon)}
                  />
                )
              })}
            </div>
            <div className="inventory-stats">
              <span>武器数量: {weapons.length}/{INVENTORY_SIZE}</span>
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
                  {getWeaponIcon(selectedWeapon.weaponType)}
                </div>
                <div className="weapon-stats">
                  <div className="stat-row">
                    <span className="stat-label">类型:</span>
                    <span className="stat-value">{getWeaponTypeName(selectedWeapon.weaponType)}</span>
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
                    <span className="stat-label">经验:</span>
                    <span className="stat-value">{selectedWeapon.experience}</span>
                  </div>
                </div>
                <div className="weapon-description">
                  {getWeaponDescription(selectedWeapon.weaponType)}
                </div>
                <div className="weapon-actions">
                  <button className="btn-equip">装备</button>
                  <button className="btn-upgrade" disabled>升级</button>
                </div>
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

// 获取武器图标
function getWeaponIcon(weaponType) {
  const icons = {
    1: '⚔️', // Sword
    2: '🏹', // Bow
    3: '🪄'  // Staff
  }
  return icons[weaponType] || '❓'
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

export default Inventory

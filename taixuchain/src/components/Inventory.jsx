import { useState, useEffect } from 'react'
import InventorySlot from './InventorySlot'
import { getAllPlayerWeapons, getLingStoneBalance, requestLingStone, burnWeapon, mergeWeapons, listWeaponOnMarket } from '../utils/suiClient'
import '../css/inventory.css'

function Inventory({ character, isOpen, onClose, equippedWeapon, onEquipWeapon }) {
  const [weapons, setWeapons] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWeapon, setSelectedWeapon] = useState(null)
  const [lingStoneBalance, setLingStoneBalance] = useState(0)
  const [isRequestingLingStone, setIsRequestingLingStone] = useState(false)
  const [isBurningWeapon, setIsBurningWeapon] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [selectedForMerge, setSelectedForMerge] = useState([]) // 选中用于合成的武器
  const [isListingWeapon, setIsListingWeapon] = useState(false)

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
      // 如果在合成模式，处理选择逻辑
      if (isMerging) {
        handleMergeSelection(weapon)
      } else {
        setSelectedWeapon(selectedWeapon?.objectId === weapon.objectId ? null : weapon)
      }
    }
  }

  // 处理合成模式下的武器选择
  const handleMergeSelection = (weapon) => {
    const isSelected = selectedForMerge.some(w => w.objectId === weapon.objectId)
    
    if (isSelected) {
      // 取消选择
      setSelectedForMerge(selectedForMerge.filter(w => w.objectId !== weapon.objectId))
    } else {
      // 检查是否已选择2把
      if (selectedForMerge.length >= 2) {
        alert('⚠️ 最多只能选择2把武器进行合成')
        return
      }
      
      // 检查是否与已选择的武器匹配
      if (selectedForMerge.length > 0) {
        const first = selectedForMerge[0]
        if (first.weaponType !== weapon.weaponType) {
          alert('⚠️ 只能合成相同类型的武器')
          return
        }
        if (first.rarity !== weapon.rarity) {
          alert('⚠️ 只能合成相同稀有度的武器')
          return
        }
        if (first.level !== weapon.level) {
          alert('⚠️ 只能合成相同等级的武器')
          return
        }
      }
      
      // 添加到选择列表
      setSelectedForMerge([...selectedForMerge, weapon])
    }
  }

  // 切换合成模式
  const toggleMergeMode = () => {
    setIsMerging(!isMerging)
    setSelectedForMerge([])
    setSelectedWeapon(null)
  }

  // 执行合成
  const handleMergeWeapons = async () => {
    if (selectedForMerge.length !== 2) {
      alert('⚠️ 请选择2把武器进行合成')
      return
    }

    const weapon1 = selectedForMerge[0]
    const weapon2 = selectedForMerge[1]
    
    // 计算合成费用
    const mergeCost = 100 + (weapon1.level * 50)
    
    // 确认对话框
    const confirmed = window.confirm(
      `⚔️ 确定要合成这两把武器吗？\n\n` +
      `武器1: ${weapon1.name} (Lv.${weapon1.level})\n` +
      `武器2: ${weapon2.name} (Lv.${weapon2.level})\n\n` +
      `合成后将获得:\n` +
      `${weapon1.name} (Lv.${weapon1.level + 1})\n\n` +
      `💎 合成费用: ${mergeCost} LingStone\n` +
      `💰 当前余额: ${lingStoneBalance.toLocaleString()} LingStone\n\n` +
      `步骤1: 你需要签名支付 ${mergeCost} LingStone 和销毁 2把武器（你付gas）\n` +
      `步骤2: Sponsor会铸造新武器给你（sponsor付gas）\n\n` +
      `此操作不可撤销！`
    )
    
    if (!confirmed) {
      return
    }

    try {
      setIsBurningWeapon(true)
      const walletAddress = window.currentWalletAddress || character.owner
      
      console.log('⚔️ Merging weapons:', weapon1.name, weapon2.name)
      
      await mergeWeapons(
        weapon1.objectId,
        weapon2.objectId,
        weapon1.weaponType,
        weapon1.rarity,
        weapon1.level + 1,
        walletAddress,
        weapon1.level
      )
      
      // 如果合成的武器中有已装备的，取消装备
      if (equippedWeapon && 
          (equippedWeapon.objectId === weapon1.objectId || 
           equippedWeapon.objectId === weapon2.objectId) && 
          onEquipWeapon) {
        onEquipWeapon(null)
      }
      
      // 等待交易确认（3秒，因为有两个交易）
      console.log('⏳ 等待交易确认...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // 重新加载武器列表
      await loadWeapons()
      
      // 清除选中状态
      setSelectedForMerge([])
      setIsMerging(false)
      
      alert(`✅ 合成成功！获得 ${weapon1.name} (Lv.${weapon1.level + 1})`)
    } catch (error) {
      console.error('Error merging weapons:', error)
      if (error.message.includes('User rejected') || error.message.includes('rejected')) {
        alert(`❌ 你取消了交易`)
      } else if (error.message.includes('Insufficient') || error.message.includes('insufficient')) {
        alert(`❌ Gas 不足\n\n请确保你的钱包有足够的 OCT 代币支付 gas 费用。`)
      } else {
        alert(`❌ 合成失败: ${error.message}`)
      }
    } finally {
      setIsBurningWeapon(false)
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

  // 上架到市场
  const handleListWeapon = async (weapon) => {
    // 输入价格
    const priceInput = prompt(
      `📦 上架武器到市场\n\n` +
      `武器: ${weapon.name} (Lv.${weapon.level})\n` +
      `攻击力: +${weapon.attack}\n` +
      `品质: ${getRarityName(weapon.rarity)}\n\n` +
      `请输入价格（LingStone）：`
    )
    
    if (!priceInput) {
      return
    }
    
    const price = parseFloat(priceInput)
    
    if (isNaN(price) || price <= 0) {
      alert('❌ 无效的价格')
      return
    }
    
    // 确认对话框
    const confirmed = window.confirm(
      `📦 确定要上架这把武器吗？\n\n` +
      `武器: ${weapon.name} (Lv.${weapon.level})\n` +
      `攻击力: +${weapon.attack}\n` +
      `品质: ${getRarityName(weapon.rarity)}\n\n` +
      `💎 价格: ${price} LingStone\n\n` +
      `你需要签名确认此操作（需要少量 gas 费用）\n` +
      `武器将被托管到市场，直到售出或取消挂单\n\n` +
      `💡 提示：如果钱包显示错误，请确保你有足够的 OCT 代币支付 gas`
    )
    
    if (!confirmed) {
      return
    }

    try {
      setIsListingWeapon(true)
      console.log('📦 Listing weapon:', weapon.name)
      console.log('  Object ID:', weapon.objectId)
      console.log('  Price:', price, 'LING')
      
      const result = await listWeaponOnMarket(weapon.objectId, price)
      
      console.log('✅ Transaction successful:', result.digest)
      
      // 如果上架的是已装备的武器，取消装备
      if (equippedWeapon?.objectId === weapon.objectId && onEquipWeapon) {
        onEquipWeapon(null)
      }
      
      // 等待更长时间确保区块链索引器更新（4秒）
      console.log('⏳ 等待区块链索引更新（4秒）...')
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // 重新加载武器列表
      console.log('🔄 刷新背包...')
      await loadWeapons()
      
      // 清除选中状态
      setSelectedWeapon(null)
      
      console.log('✅ 上架完成！武器已托管到市场')
      alert(`✅ 已上架: ${weapon.name}\n价格: ${price} LING\n\n💡 提示：武器已从背包移除并托管到市场`)
    } catch (error) {
      console.error('Error listing weapon:', error)
      // 更友好的错误提示
      if (error.message.includes('User rejected') || error.message.includes('rejected')) {
        alert(`❌ 你取消了交易`)
      } else if (error.message.includes('Insufficient') || error.message.includes('insufficient')) {
        alert(`❌ Gas 不足\n\n请确保你的钱包有足够的 OCT 代币支付 gas 费用。`)
      } else {
        alert(`❌ 上架失败: ${error.message}`)
      }
    } finally {
      setIsListingWeapon(false)
    }
  }

  // 丢弃武器
  const handleBurnWeapon = async (weapon) => {
    // 确认对话框
    const confirmed = window.confirm(
      `⚠️ 确定要丢弃 ${weapon.name} 吗？\n\n` +
      `等级: Lv.${weapon.level}\n` +
      `攻击力: +${weapon.attack}\n\n` +
      `此操作不可撤销！\n` +
      `你需要签名确认此操作（需要少量 gas 费用）\n\n` +
      `💡 提示：如果钱包显示错误，请确保你有足够的 OCT 代币支付 gas`
    )
    
    if (!confirmed) {
      return
    }

    try {
      setIsBurningWeapon(true)
      console.log('🔥 Burning weapon:', weapon.name, weapon.objectId)
      
      await burnWeapon(weapon.objectId)
      
      // 如果丢弃的是已装备的武器，取消装备
      if (equippedWeapon?.objectId === weapon.objectId && onEquipWeapon) {
        onEquipWeapon(null)
      }
      
      // 等待交易确认（2秒）
      console.log('⏳ 等待交易确认...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 重新加载武器列表
      await loadWeapons()
      
      // 清除选中状态
      setSelectedWeapon(null)
      
      alert(`✅ 已丢弃: ${weapon.name}`)
    } catch (error) {
      console.error('Error burning weapon:', error)
      // 更友好的错误提示
      if (error.message.includes('User rejected') || error.message.includes('rejected')) {
        alert(`❌ 你取消了交易`)
      } else if (error.message.includes('Insufficient') || error.message.includes('insufficient')) {
        alert(`❌ Gas 不足\n\n请确保你的钱包有足够的 OCT 代币支付 gas 费用。\n你可以从水龙头获取测试代币：\nhttps://faucet-testnet.onelabs.cc/`)
      } else if (error.message.includes('dry run') || error.message.includes('dryrun')) {
        alert(`❌ 交易模拟失败\n\n可能原因：\n1. Gas 不足（需要 OCT 代币）\n2. 这是旧版本合约的武器，无法删除\n3. 武器对象状态异常\n\n请检查你的钱包余额或尝试删除其他武器`)
      } else {
        alert(`❌ 丢弃失败: ${error.message}\n\n如果这是旧版本的武器，可能无法删除`)
      }
    } finally {
      setIsBurningWeapon(false)
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
            <button 
              className="lingstone-request-btn" 
              onClick={() => { loadWeapons(); loadLingStoneBalance(); }}
              disabled={isLoading}
              title="刷新背包"
              style={{ marginLeft: '5px' }}
            >
              {isLoading ? '⏳' : '🔄'}
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
            
            {/* 合成模式提示 */}
            {isMerging && (
              <div className="merge-mode-banner">
                <span>⚔️ 合成模式：选择2把相同类型、稀有度、等级的武器</span>
                <span className="merge-count">已选择: {selectedForMerge.length}/2</span>
                {selectedForMerge.length === 2 && (
                  <button className="btn-confirm-merge" onClick={handleMergeWeapons}>
                    确认合成
                  </button>
                )}
              </div>
            )}
            
            {/* 背包格子 */}
            <div className="inventory-grid">
              {Array.from({ length: INVENTORY_SIZE }).map((_, index) => {
                const weapon = weapons[index] || null
                const isEquipped = equippedWeapon?.objectId === weapon?.objectId
                const canEquipThis = weapon ? canEquipWeapon(weapon) : undefined
                const isSelectedForMerge = weapon && selectedForMerge.some(w => w.objectId === weapon.objectId)
                return (
                  <InventorySlot
                    key={weapon?.objectId || `empty-${index}`}
                    weapon={weapon}
                    isSelected={isMerging ? isSelectedForMerge : selectedWeapon?.objectId === weapon?.objectId}
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
                  <button 
                    className={`btn-merge ${isMerging ? 'active' : ''}`}
                    onClick={toggleMergeMode}
                  >
                    {isMerging ? '取消合成' : '⚔️ 合成'}
                  </button>
                </div>
                <div className="weapon-actions">
                  <button 
                    className="btn-list-market"
                    onClick={() => handleListWeapon(selectedWeapon)}
                    disabled={isListingWeapon || isMerging}
                  >
                    {isListingWeapon ? '⏳ 上架中...' : '📦 上架市场'}
                  </button>
                  <button 
                    className="btn-burn"
                    onClick={() => handleBurnWeapon(selectedWeapon)}
                    disabled={isBurningWeapon || isMerging}
                  >
                    {isBurningWeapon ? '⏳ 丢弃中...' : '🔥 丢弃'}
                  </button>
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

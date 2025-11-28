import { useState, useEffect } from 'react'
import InventorySlot from './InventorySlot'
import ConfirmDialog from './ConfirmDialog'
import InputDialog from './InputDialog'
import { alertManager } from './AlertDialog'
import { getAllPlayerWeapons, getLingStoneBalance, requestLingStone, burnWeapon, mergeWeapons, listWeaponOnMarket } from '../utils/suiClient'
import soundManager from '../utils/soundManager'
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
  
  // 确认弹窗状态
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    details: [],
    warning: '',
    tip: '',
    type: 'warning',
    onConfirm: null
  })
  
  // 输入弹窗状态
  const [inputDialog, setInputDialog] = useState({
    isOpen: false,
    title: '',
    details: [],
    placeholder: '',
    onConfirm: null
  })

  // 背包格子数量（动态扩展，无上限）
  // 根据武器数量动态计算，至少显示20个格子
  const INVENTORY_SIZE = Math.max(20, weapons.length + 5)

  // 添加点击音效监听
  useEffect(() => {
    if (!isOpen) return

    const handleClick = () => {
      soundManager.play('click', 0.3)
    }

    const container = document.querySelector('.inventory-container')
    if (container) {
      container.addEventListener('click', handleClick)
      return () => {
        container.removeEventListener('click', handleClick)
      }
    }
  }, [isOpen])

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
        alertManager.error('Unable to get wallet address')
        return
      }

      console.log('💎 Requesting LingStone...')
      await requestLingStone(walletAddress)
      
      // Wait for transaction confirmation (2 seconds)
      console.log('⏳ Waiting for transaction confirmation...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reload balance
      await loadLingStoneBalance()
      
      alertManager.success('Successfully received 10000 LingStone!')
    } catch (error) {
      console.error('Error requesting LingStone:', error)
      alertManager.error(`Request failed: ${error.message}`)
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

  // Handle weapon selection in merge mode
  const handleMergeSelection = (weapon) => {
    // Check if weapon is equipped
    if (equippedWeapon?.objectId === weapon.objectId) {
      alertManager.warning('Cannot merge equipped weapon! Please unequip first.')
      return
    }
    
    const isSelected = selectedForMerge.some(w => w.objectId === weapon.objectId)
    
    if (isSelected) {
      // Deselect
      setSelectedForMerge(selectedForMerge.filter(w => w.objectId !== weapon.objectId))
    } else {
      // Check if already selected 2 weapons
      if (selectedForMerge.length >= 2) {
        alertManager.warning('You can only select 2 weapons for merging')
        return
      }
      
      // Check if matches already selected weapon
      if (selectedForMerge.length > 0) {
        const first = selectedForMerge[0]
        if (first.weaponType !== weapon.weaponType) {
          alertManager.warning('Can only merge weapons of the same type')
          return
        }
        if (first.rarity !== weapon.rarity) {
          alertManager.warning('Can only merge weapons of the same rarity')
          return
        }
        if (first.level !== weapon.level) {
          alertManager.warning('Can only merge weapons of the same level')
          return
        }
      }
      
      // Add to selection list
      setSelectedForMerge([...selectedForMerge, weapon])
    }
  }

  // 切换合成模式
  const toggleMergeMode = () => {
    setIsMerging(!isMerging)
    setSelectedForMerge([])
    setSelectedWeapon(null)
  }

  // 显示确认弹窗
  const showConfirmDialog = (config) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        ...config,
        isOpen: true,
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        }
      })
    })
  }

  // 关闭确认弹窗
  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
  }

  // Execute merge
  const handleMergeWeapons = async () => {
    if (selectedForMerge.length !== 2) {
      alertManager.warning('Please select 2 weapons to merge')
      return
    }

    const weapon1 = selectedForMerge[0]
    const weapon2 = selectedForMerge[1]
    
    // 计算合成费用
    const mergeCost = 100 + (weapon1.level * 50)
    
    // 显示确认弹窗
    const confirmed = await showConfirmDialog({
      title: 'Merge these two weapons?',
      message: '',
      details: [
        { label: 'Weapon 1', value: `${weapon1.name} (Lv.${weapon1.level})` },
        { label: 'Weapon 2', value: `${weapon2.name} (Lv.${weapon2.level})` },
        { label: 'Result', value: `${weapon1.name} (Lv.${weapon1.level + 1})`, highlight: true },
        { label: 'Cost', value: `${mergeCost} LingStone`, highlight: true },
        { label: 'Balance', value: `${lingStoneBalance.toLocaleString()} LingStone` }
      ],
      warning: 'This action cannot be undone! You need to sign this transaction (requires gas fee)',
      tip: 'If wallet shows error, make sure you have enough OCT tokens for gas',
      type: 'warning',
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    })
    
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
      
      // Wait for transaction confirmation (3 seconds, because there are two transactions)
      console.log('⏳ Waiting for transaction confirmation...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Reload weapon list
      await loadWeapons()
      
      // Clear selection state
      setSelectedForMerge([])
      setIsMerging(false)
      
      alertManager.success(`Merge successful! Received ${weapon1.name} (Lv.${weapon1.level + 1})`)
    } catch (error) {
      console.error('Error merging weapons:', error)
      if (error.message.includes('User rejected') || error.message.includes('rejected')) {
        alertManager.error('You cancelled the transaction')
      } else if (error.message.includes('Insufficient') || error.message.includes('insufficient')) {
        alertManager.error('Insufficient gas\n\nPlease make sure your wallet has enough OCT tokens for gas fees.')
      } else {
        alertManager.error(`Merge failed: ${error.message}`)
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

  // Equip weapon
  const handleEquipWeapon = (weapon) => {
    if (!canEquipWeapon(weapon)) {
      alertManager.warning('This weapon is not suitable for your class!')
      return
    }
    
    // If already equipped, do nothing
    if (equippedWeapon?.objectId === weapon.objectId) {
      console.log('ℹ️ Weapon already equipped:', weapon.name)
      return
    }
    
    if (onEquipWeapon) {
      onEquipWeapon(weapon)
      console.log('✅ Equipped weapon:', weapon.name)
      // Show success message
      alertManager.success(`Equipped: ${weapon.name}`)
    }
  }

  // 显示输入弹窗
  const showInputDialog = (config) => {
    return new Promise((resolve) => {
      setInputDialog({
        ...config,
        isOpen: true,
        onConfirm: (value) => {
          setInputDialog(prev => ({ ...prev, isOpen: false }))
          resolve(value)
        }
      })
    })
  }

  // 关闭输入弹窗
  const closeInputDialog = () => {
    setInputDialog(prev => ({ ...prev, isOpen: false }))
  }

  // 上架到市场
  const handleListWeapon = async (weapon) => {
    // 显示输入价格弹窗
    const priceInput = await showInputDialog({
      title: 'List Weapon on Market',
      details: [
        { label: 'Weapon', value: `${weapon.name} (Lv.${weapon.level})` },
        { label: 'Attack', value: `+${weapon.attack}` },
        { label: 'Rarity', value: getRarityName(weapon.rarity) }
      ],
      placeholder: 'Enter price (LingStone):',
      confirmText: 'List',
      cancelText: 'Cancel'
    })
    
    if (!priceInput) {
      return
    }
    
    const price = parseFloat(priceInput)
    
    if (isNaN(price) || price <= 0) {
      alertManager.error('Invalid price')
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
      
      // Wait longer to ensure blockchain indexer updates (4 seconds)
      console.log('⏳ Waiting for blockchain indexer update (4 seconds)...')
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // Reload weapon list
      console.log('🔄 Refreshing inventory...')
      await loadWeapons()
      
      // Clear selection state
      setSelectedWeapon(null)
      
      console.log('✅ Listing complete! Weapon has been escrowed to market')
      alertManager.success(`Listed: ${weapon.name}\nPrice: ${price} LING\n\nTip: Weapon has been removed from inventory and escrowed to market`)
    } catch (error) {
      console.error('Error listing weapon:', error)
      // Friendly error messages
      if (error.message.includes('User rejected') || error.message.includes('rejected')) {
        alertManager.error('You cancelled the transaction')
      } else if (error.message.includes('Insufficient') || error.message.includes('insufficient')) {
        alertManager.error('Insufficient gas\n\nPlease make sure your wallet has enough OCT tokens for gas fees.')
      } else {
        alertManager.error(`Listing failed: ${error.message}`)
      }
    } finally {
      setIsListingWeapon(false)
    }
  }

  // 丢弃武器
  const handleBurnWeapon = async (weapon) => {
    // 显示确认弹窗
    const confirmed = await showConfirmDialog({
      title: `Discard ${weapon.name}?`,
      message: '',
      details: [
        { label: 'Level', value: `Lv.${weapon.level}` },
        { label: 'Attack', value: `+${weapon.attack}` }
      ],
      warning: 'This action cannot be undone! You need to sign this transaction (requires gas fee)',
      tip: 'If wallet shows error, make sure you have enough OCT tokens for gas',
      type: 'danger',
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    })
    
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
      
      // Wait for transaction confirmation (2 seconds)
      console.log('⏳ Waiting for transaction confirmation...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reload weapon list
      await loadWeapons()
      
      // Clear selection state
      setSelectedWeapon(null)
      
      alertManager.success(`Discarded: ${weapon.name}`)
    } catch (error) {
      console.error('Error burning weapon:', error)
      // Friendly error messages
      if (error.message.includes('User rejected') || error.message.includes('rejected')) {
        alertManager.error('You cancelled the transaction')
      } else if (error.message.includes('Insufficient') || error.message.includes('insufficient')) {
        alertManager.error('Insufficient gas\n\nPlease make sure your wallet has enough OCT tokens for gas fees.\nYou can get test tokens from faucet:\nhttps://faucet-testnet.onelabs.cc/')
      } else if (error.message.includes('dry run') || error.message.includes('dryrun')) {
        alertManager.error('Transaction simulation failed\n\nPossible reasons:\n1. Insufficient gas (need OCT tokens)\n2. This is an old version weapon that cannot be deleted\n3. Weapon object state is abnormal\n\nPlease check your wallet balance or try deleting another weapon')
      } else {
        alertManager.error(`Discard failed: ${error.message}\n\nIf this is an old version weapon, it may not be deletable`)
      }
    } finally {
      setIsBurningWeapon(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="inventory-overlay" onClick={onClose}>
      <div className="inventory-container" onClick={(e) => e.stopPropagation()}>
        
        {/* 确认弹窗 */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          details={confirmDialog.details}
          warning={confirmDialog.warning}
          tip={confirmDialog.tip}
          type={confirmDialog.type}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirmDialog}
        />
        
        {/* 输入弹窗 */}
        <InputDialog
          isOpen={inputDialog.isOpen}
          title={inputDialog.title}
          details={inputDialog.details}
          placeholder={inputDialog.placeholder}
          confirmText={inputDialog.confirmText}
          cancelText={inputDialog.cancelText}
          onConfirm={inputDialog.onConfirm}
          onCancel={closeInputDialog}
        />
        <div className="inventory-header">
          <h2>🎒 INVENTORY</h2>
          <div className="lingstone-display">
            <span className="lingstone-label">LINGSTONE</span>
            <span className="lingstone-amount">{lingStoneBalance.toLocaleString()}</span>
            <button 
              className="lingstone-request-btn" 
              onClick={handleRequestLingStone}
              disabled={isRequestingLingStone}
              title="Request 10000 LingStone"
            >
              {isRequestingLingStone ? '⏳' : '+'}
            </button>
            <button 
              className="lingstone-request-btn" 
              onClick={() => { loadWeapons(); loadLingStoneBalance(); }}
              disabled={isLoading}
              title="Refresh Inventory"
              style={{ marginLeft: '5px' }}
            >
              {isLoading ? '⏳' : '↻'}
            </button>
          </div>
          <button className="inventory-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="inventory-content">
          {/* 左侧：背包格子 */}
          <div className="inventory-grid-section">
            {/* 装备栏 */}
            <div className="equipped-section">
              <h3>🗡️ EQUIPPED</h3>
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
                    <span>No Weapon</span>
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
              <span>Weapons: {weapons.length}</span>
              {equippedWeapon && <span className="equipped-indicator">✓ Equipped: {equippedWeapon.name}</span>}
            </div>
          </div>

          {/* 右侧：武器详情 */}
          <div className="inventory-details-section">
            {isLoading ? (
              <div className="inventory-loading">Loading...</div>
            ) : isMerging ? (
              <div className="weapon-details">
                <h3>⚔️ MERGE MODE</h3>
                <div className="merge-info-panel">
                  <p style={{ color: '#fff', fontSize: '0.75rem', textAlign: 'center', marginBottom: '15px' }}>
                    Select 2 weapons with same type, rarity, and level
                  </p>
                  
                  {selectedForMerge.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ color: '#ffd700', fontSize: '0.7rem', marginBottom: '8px', textAlign: 'center' }}>
                        Selected: {selectedForMerge.length}/2
                      </div>
                      {selectedForMerge.map((weapon, index) => (
                        <div key={weapon.objectId} style={{ 
                          background: 'rgba(0, 0, 0, 0.3)', 
                          padding: '8px', 
                          borderRadius: '6px', 
                          marginBottom: '6px',
                          border: '1px solid rgba(255, 215, 0, 0.3)'
                        }}>
                          <div style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            {index + 1}. {weapon.name}
                          </div>
                          <div style={{ color: '#aaa', fontSize: '0.6rem' }}>
                            Lv.{weapon.level} | +{weapon.attack} ATK | {getRarityName(weapon.rarity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {selectedForMerge.length === 2 && (
                    <div style={{ 
                      background: 'rgba(76, 175, 80, 0.2)', 
                      padding: '10px', 
                      borderRadius: '6px', 
                      marginBottom: '15px',
                      border: '1px solid rgba(76, 175, 80, 0.5)'
                    }}>
                      <div style={{ color: '#4CAF50', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '5px' }}>
                        ✓ Result:
                      </div>
                      <div style={{ color: '#fff', fontSize: '0.65rem' }}>
                        {selectedForMerge[0].name} (Lv.{selectedForMerge[0].level + 1})
                      </div>
                      <div style={{ color: '#ffd700', fontSize: '0.6rem', marginTop: '5px' }}>
                        💎 Cost: {100 + (selectedForMerge[0].level * 50)} LING
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="weapon-actions">
                  <button 
                    className="btn-equip"
                    onClick={toggleMergeMode}
                  >
                    ← BACK
                  </button>
                  <button 
                    className="btn-merge active"
                    onClick={handleMergeWeapons}
                    disabled={selectedForMerge.length !== 2 || isBurningWeapon}
                  >
                    {isBurningWeapon ? '⏳ MERGING...' : 'CONFIRM'}
                  </button>
                </div>
              </div>
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
                    <span className="inventory-stat-label">Type:</span>
                    <span className="inventory-stat-value">{getWeaponTypeName(selectedWeapon.weaponType)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="inventory-stat-label">Rarity:</span>
                    <span className="inventory-stat-value rarity">{getRarityName(selectedWeapon.rarity)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="inventory-stat-label">Attack:</span>
                    <span className="inventory-stat-value attack">+{selectedWeapon.attack}</span>
                  </div>
                  <div className="stat-row">
                    <span className="inventory-stat-label">Level:</span>
                    <span className="inventory-stat-value">Lv.{selectedWeapon.level}</span>
                  </div>
                  <div className="stat-row">
                    <span className="inventory-stat-label">Version:</span>
                    <span className="inventory-stat-value">#{selectedWeapon.version}</span>
                  </div>
                </div>
                <div className="weapon-actions">
                  <button 
                    className={`btn-equip ${equippedWeapon?.objectId === selectedWeapon.objectId ? 'equipped' : ''}`}
                    onClick={() => handleEquipWeapon(selectedWeapon)}
                    disabled={!canEquipWeapon(selectedWeapon) || equippedWeapon?.objectId === selectedWeapon.objectId}
                  >
                    {equippedWeapon?.objectId === selectedWeapon.objectId ? '✓ EQUIPPED' : 'EQUIP'}
                  </button>
                  <button 
                    className={`btn-merge ${isMerging ? 'active' : ''}`}
                    onClick={toggleMergeMode}
                  >
                    {isMerging ? 'CANCEL' : '⚔️ MERGE'}
                  </button>
                </div>
                <div className="weapon-actions">
                  <button 
                    className="btn-list-market"
                    onClick={() => handleListWeapon(selectedWeapon)}
                    disabled={isListingWeapon || isMerging}
                  >
                    {isListingWeapon ? '⏳ SELLING...' : '🏪 SHOP'}
                  </button>
                  <button 
                    className="btn-burn"
                    onClick={() => handleBurnWeapon(selectedWeapon)}
                    disabled={isBurningWeapon || isMerging}
                  >
                    {isBurningWeapon ? '⏳ BURNING...' : '🔥 BURN'}
                  </button>
                </div>
                {!canEquipWeapon(selectedWeapon) && (
                  <div className="weapon-warning">
                    ⚠️ Wrong class for this weapon
                    <div style={{ fontSize: '0.8rem', marginTop: '5px', opacity: 0.8 }}>
                      {getClassRequirement(selectedWeapon.weaponType)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-selection">
                <div className="empty-icon">🎒</div>
                <p>Select a weapon to view details</p>
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
    1: 'Sword',
    2: 'Bow',
    3: 'Staff'
  }
  return names[weaponType] || 'Unknown'
}

// 获取武器描述
function getWeaponDescription(weaponType) {
  const descriptions = {
    1: 'Sharp blade for close combat. The warrior\'s weapon of choice.',
    2: 'Precise ranged weapon. Attack enemies from a safe distance.',
    3: 'Magical staff imbued with arcane power. Unleash devastating spells.'
  }
  return descriptions[weaponType] || 'Mysterious weapon'
}

// 获取品质名称
function getRarityName(rarity) {
  const names = {
    1: 'Common',
    2: 'Rare',
    3: 'Epic'
  }
  return names[rarity] || 'Unknown'
}

// 获取职业要求说明
function getClassRequirement(weaponType) {
  const requirements = {
    1: 'Required: Warrior ⚔️',
    2: 'Required: Archer 🏹',
    3: 'Required: Mage 🪄'
  }
  return requirements[weaponType] || 'Unknown class requirement'
}

export default Inventory

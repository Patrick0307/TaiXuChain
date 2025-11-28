import { useState, useEffect } from 'react'
import InventorySlot from './InventorySlot'
import ConfirmDialog from './ConfirmDialog'
import { alertManager } from './AlertDialog'
import { getAllMarketplaceListings, buyWeaponFromMarket, getLingStoneBalance } from '../utils/suiClient'
import soundManager from '../utils/soundManager'
import '../css/marketplace.css'

function Marketplace({ character, isOpen, onClose }) {
  const [listings, setListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState(null)
  const [lingStoneBalance, setLingStoneBalance] = useState(0)
  const [isBuying, setIsBuying] = useState(false)
  
  // Confirm dialog state
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

  // 添加点击音效监听
  useEffect(() => {
    if (!isOpen) return

    const handleClick = () => {
      soundManager.play('click', 0.3)
    }

    const container = document.querySelector('.marketplace-container')
    if (container) {
      container.addEventListener('click', handleClick)
      return () => {
        container.removeEventListener('click', handleClick)
      }
    }
  }, [isOpen])

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
      alertManager.warning('Unable to load market data\n\nDue to on-chain query limitations, marketplace listings cannot be displayed temporarily.\n\nSolutions:\n1. Wait for off-chain indexing service\n2. Use contract event queries\n3. Purchase directly via weapon ID')
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

  // Show confirm dialog
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

  // Close confirm dialog
  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }))
  }

  const handleBuyWeapon = async (listing) => {
    // Use seller's price (convert from smallest unit to LING)
    const price = listing.price / 1_000_000_000
    
    console.log('💰 Buying weapon with seller price:', price, 'LING')
    
    // Check if balance is sufficient
    if (price > lingStoneBalance) {
      alertManager.error(`Insufficient LingStone\n\nRequired: ${price} LING\nBalance: ${lingStoneBalance} LING`)
      return
    }
    
    // Show confirm dialog
    const confirmed = await showConfirmDialog({
      title: 'Buy this weapon?',
      message: '',
      details: [
        { label: 'Weapon', value: `${listing.weapon.name} (Lv.${listing.weapon.level})` },
        { label: 'Attack', value: `+${listing.weapon.attack}` },
        { label: 'Rarity', value: getRarityName(listing.weapon.rarity) },
        { label: 'Price', value: `${price} LingStone`, highlight: true },
        { label: 'Your Balance', value: `${lingStoneBalance.toLocaleString()} LingStone` }
      ],
      warning: 'This action cannot be undone!',
      tip: `You need to sign to pay ${price} LING and gas fees`,
      type: 'info',
      confirmText: 'Buy',
      cancelText: 'Cancel'
    })
    
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
      console.log('⏳ Waiting for blockchain indexer update (4 seconds)...')
      
      // Wait longer to ensure blockchain indexer updates (4 seconds)
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // Reload listings and balance
      console.log('🔄 Refreshing marketplace listings and balance...')
      await loadListings()
      await loadLingStoneBalance()
      
      // Clear selection
      setSelectedListing(null)
      
      console.log('✅ Purchase complete! Weapon transferred to your inventory')
      alertManager.success(`Purchase successful!\n\nReceived: ${listing.weapon.name}\n\nTip: Open your inventory to view your new weapon`)
    } catch (error) {
      console.error('Error buying weapon:', error)
      if (error.message.includes('User rejected') || error.message.includes('rejected')) {
        alertManager.error('You cancelled the transaction')
      } else if (error.message.includes('Insufficient') || error.message.includes('insufficient')) {
        alertManager.error('Insufficient balance\n\nPlease ensure you have enough LingStone and OCT tokens to pay gas fees.')
      } else {
        alertManager.error(`Purchase failed: ${error.message}`)
      }
    } finally {
      setIsBuying(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="marketplace-overlay" onClick={onClose}>
      <div className="marketplace-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Confirm Dialog */}
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
        
        <div className="marketplace-header">
          <h2>🏪 Weapon Market</h2>
          <div className="lingstone-display">
            <span className="lingstone-label">💎 LingStone:</span>
            <span className="lingstone-amount">{lingStoneBalance.toLocaleString()}</span>
            <button 
              className="lingstone-request-btn" 
              onClick={() => { loadListings(); loadLingStoneBalance(); }}
              disabled={isLoading}
              title="Refresh Market"
              style={{ marginLeft: '5px' }}
            >
              {isLoading ? '⏳' : '↻'}
            </button>
          </div>
          <button className="marketplace-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="marketplace-content">
          {/* 左侧：市场挂单列表 */}
          <div className="marketplace-grid-section">
            {isLoading ? (
              <div className="marketplace-loading">Loading...</div>
            ) : listings.length === 0 ? (
              <div className="marketplace-empty">
                <div className="empty-icon">🏪</div>
                <p>No items in market</p>
                <p className="empty-hint">Select a weapon in your inventory and list it on the market</p>
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
                  <span>Items: {listings.length}</span>
                </div>
              </>
            )}
          </div>

          {/* 右侧：武器详情 */}
          <div className="marketplace-details-section">
            {isLoading ? (
              <div className="marketplace-loading">Loading...</div>
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
                    <span className="stat-label">Type:</span>
                    <span className="stat-value">{getWeaponTypeName(selectedListing.weapon.weaponType)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Rarity:</span>
                    <span className="stat-value rarity">{getRarityName(selectedListing.weapon.rarity)}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Attack:</span>
                    <span className="stat-value attack">+{selectedListing.weapon.attack}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Level:</span>
                    <span className="stat-value">Lv.{selectedListing.weapon.level}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Price:</span>
                    <span className="stat-value price">💎 {(selectedListing.price / 1_000_000_000).toLocaleString()} LING</span>
                  </div>
                </div>
                <div className="weapon-actions">
                  <button 
                    className="btn-buy"
                    onClick={() => handleBuyWeapon(selectedListing)}
                    disabled={isBuying}
                  >
                    {isBuying ? '⏳ Purchasing...' : '💰 Buy'}
                  </button>
                </div>
                <div className="marketplace-notice">
                  ℹ️ Price is set by the seller. Click the buy button to purchase the weapon at this price.
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <div className="empty-icon">🏪</div>
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

// Get weapon type name
function getWeaponTypeName(weaponType) {
  const names = {
    1: 'Sword',
    2: 'Bow',
    3: 'Staff'
  }
  return names[weaponType] || 'Unknown'
}

// Get weapon description
function getWeaponDescription(weaponType) {
  const descriptions = {
    1: 'A sharp blade, suitable for close combat. The weapon of choice for warriors.',
    2: 'A precise ranged weapon that can attack enemies from a safe distance.',
    3: 'A staff imbued with magical power, capable of unleashing powerful magical attacks.'
  }
  return descriptions[weaponType] || 'A mysterious weapon'
}

// Get rarity name
function getRarityName(rarity) {
  const names = {
    1: 'Common',
    2: 'Rare',
    3: 'Epic'
  }
  return names[rarity] || 'Unknown'
}

export default Marketplace

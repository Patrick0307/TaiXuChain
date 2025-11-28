import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'

// Initialize Sui client - Using OneChain Testnet
export const suiClient = new SuiClient({ url: 'https://rpc-testnet.onelabs.cc:443' })

// Read from environment variables or config file (V8 - 2025-11-20)
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0xd249f6f2ecf256b26025e2d8454482e05565b716d5c3ebb6cf5fd24d01f03c9f'
export const REGISTRY_ID = import.meta.env.VITE_REGISTRY_ID || '0xb385cbebfde05028eb3dd95754ca2d3651d477bd438621741d393fb390776948'
export const MARKETPLACE_ID = import.meta.env.VITE_MARKETPLACE_ID || '0x3b18f7a9fe90b85aad2e425ff42a1a27b73005d4eee08974c340c378c137e463'
export const WEAPON_MINT_CAP = import.meta.env.VITE_WEAPON_MINT_CAP || '0xb7bd7f2b0f7f1a93a71e52a380345f930c2010997a7fccee27b70f59a66e5c95'

// Class mapping (consistent with backend and contract)
// Move contract definition: CLASS_MAGE=1, CLASS_WARRIOR=2, CLASS_ARCHER=3
export const CLASS_MAP = {
  'Mage': 1,
  'Warrior': 2,
  'Archer': 3
}

/**
 * Create player character and register to blockchain (using sponsored transaction, player doesn't need to pay gas)
 * @param {string} name - Character name
 * @param {string} className - Class name (Mage, Warrior, Archer)
 * @param {object} suiWallet - Sui wallet object
 * @param {object} customization - Character customization data
 * @returns {Promise<object>} Transaction result
 */
export async function createPlayerOnChain(name, className, suiWallet, customization) {
  try {
    const classId = CLASS_MAP[className]
    if (!classId) {
      throw new Error(`Invalid class: ${className}`)
    }

    // Get wallet address
    let playerAddress
    if (suiWallet.getAccounts) {
      const accounts = await suiWallet.getAccounts()
      playerAddress = accounts[0]
    } else if (suiWallet.address) {
      playerAddress = suiWallet.address
    } else if (window.currentWalletAddress) {
      playerAddress = window.currentWalletAddress
    } else {
      throw new Error('Cannot get wallet address')
    }

    // Call backend sponsor service
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/sponsor/create-player`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerAddress,
        name,
        classId,
        customization: customization || {},
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create player')
    }

    const data = await response.json()
    
    return data.result
  } catch (error) {
    throw error
  }
}

/**
 * Query player information
 * @param {string} playerObjectId - Player object ID
 * @returns {Promise<object>} Player information
 */
export async function getPlayerInfo(playerObjectId) {
  try {
    const object = await suiClient.getObject({
      id: playerObjectId,
      options: {
        showContent: true,
      },
    })
    return object.data.content.fields
  } catch (error) {
    throw error
  }
}

/**
 * Check if wallet address already has a character
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<object|null>} Player character information or null
 */
export async function checkExistingPlayer(walletAddress) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/player/${walletAddress}`)
    
    if (!response.ok) {
      throw new Error('Failed to check existing player')
    }

    const data = await response.json()
    
    if (data.exists && data.player) {
      return data.player
    }
    
    return null
  } catch (error) {
    throw error
  }
}

/**
 * Query player weapon (optional: filter by class)
 * @param {string} walletAddress - Wallet address
 * @param {number} classId - Class ID (optional, used to filter weapons matching the class)
 * @returns {Promise<object|null>} Weapon information or null
 */
export async function checkPlayerWeapon(walletAddress, classId = null) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    // If classId is provided, add it to query parameters
    const url = classId 
      ? `${BACKEND_URL}/api/weapon/${walletAddress}?classId=${classId}`
      : `${BACKEND_URL}/api/weapon/${walletAddress}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('Failed to check player weapon')
    }

    const data = await response.json()
    
    if (data.exists && data.weapon) {
      return data.weapon
    }
    
    return null
  } catch (error) {
    throw error
  }
}

/**
 * Get all player weapons
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<Array>} Weapon list
 */
export async function getAllPlayerWeapons(walletAddress) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/weapons/${walletAddress}`)
    
    if (!response.ok) {
      throw new Error('Failed to get player weapons')
    }

    const data = await response.json()
    
    return data.weapons || []
  } catch (error) {
    throw error
  }
}

/**
 * Sponsored weapon minting (automatically selects based on class)
 * @param {string} walletAddress - Wallet address
 * @param {number} classId - Class ID
 * @returns {Promise<object>} Transaction result
 */
export async function mintWeaponForPlayer(walletAddress, classId) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/sponsor/mint-weapon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerAddress: walletAddress,
        classId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to mint weapon')
    }

    const data = await response.json()
    
    return data.result
  } catch (error) {
    throw error
  }
}

/**
 * Sponsored random weapon minting (monster drop)
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<object>} Transaction result and weapon information
 */
export async function mintRandomWeaponForPlayer(walletAddress) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/sponsor/mint-random-weapon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerAddress: walletAddress,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to mint random weapon')
    }

    const data = await response.json()
    
    return data
  } catch (error) {
    throw error
  }
}

/**
 * Get LingStone balance
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<number>} LingStone balance
 */
export async function getLingStoneBalance(walletAddress) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/lingstone/balance/${walletAddress}`)
    
    if (!response.ok) {
      throw new Error('Failed to get LingStone balance')
    }

    const data = await response.json()
    return data.balance || 0
  } catch (error) {
    return 0
  }
}

/**
 * Request LingStone (mint 10000)
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<object>} Transaction result
 */
export async function requestLingStone(walletAddress) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/sponsor/mint-lingstone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerAddress: walletAddress,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to mint LingStone')
    }

    const data = await response.json()
    
    return data.result
  } catch (error) {
    throw error
  }
}

/**
 * Burn weapon (discard) - Player signs themselves
 * @param {string} weaponObjectId - Weapon object ID
 * @returns {Promise<object>} Transaction result
 */
export async function burnWeapon(weaponObjectId) {
  try {
    // Get wallet
    const suiWallet = window.suiWallet
    if (!suiWallet) {
      throw new Error('Wallet not connected')
    }

    // Create transaction
    const tx = new Transaction()
    
    // Set gas budget (burning is simple, doesn't need much gas)
    tx.setGasBudget(10000000) // 0.01 SUI/OCT
    
    // Call burn_weapon_by_player function
    tx.moveCall({
      target: `${PACKAGE_ID}::weapon::burn_weapon_by_player`,
      arguments: [
        tx.object(weaponObjectId),
      ],
    })
    
    // Player signs and executes transaction
    const result = await suiWallet.signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    })
    
    return result
  } catch (error) {
    throw error
  }
}

/**
 * Merge weapons - Player burns LingStone and two weapons, sponsor mints upgraded weapon
 * @param {string} weapon1ObjectId - First weapon object ID
 * @param {string} weapon2ObjectId - Second weapon object ID
 * @param {number} weaponType - Weapon type
 * @param {number} rarity - Rarity
 * @param {number} newLevel - New weapon level
 * @param {string} walletAddress - Wallet address
 * @param {number} weaponLevel - Current weapon level (used to calculate cost)
 * @returns {Promise<object>} Transaction result
 */
export async function mergeWeapons(weapon1ObjectId, weapon2ObjectId, weaponType, rarity, newLevel, walletAddress, weaponLevel) {
  try {
    // Calculate merge cost: base cost 100 LING + (level * 50 LING)
    const mergeCost = (100 + (weaponLevel * 50)) * 1_000_000_000
    
    // Get wallet
    const suiWallet = window.suiWallet
    if (!suiWallet) {
      throw new Error('Wallet not connected')
    }

    // Step 1: Player burns LingStone and two weapons (player pays gas)
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    // Get player's LingStone coin objects
    const response = await fetch(`${BACKEND_URL}/api/lingstone/coins/${walletAddress}`)
    if (!response.ok) {
      throw new Error('Failed to get LingStone coins')
    }
    const coinsData = await response.json()
    
    if (!coinsData.coins || coinsData.coins.length === 0) {
      throw new Error('No LingStone coins found')
    }
    
    // Find coin with sufficient balance or merge multiple coins
    let selectedCoin = null
    for (const coin of coinsData.coins) {
      if (coin.balance >= mergeCost) {
        selectedCoin = coin.coinObjectId
        break
      }
    }
    
    if (!selectedCoin) {
      throw new Error(`Insufficient LingStone balance. Need ${(100 + (weaponLevel * 50))} LING`)
    }
    
    const tx = new Transaction()
    tx.setGasBudget(30000000) // 0.03 SUI/OCT (burn coin + two weapon burns)
    
    // Split out the required amount
    const coinToSplit = tx.object(selectedCoin)
    const splitCoin = tx.splitCoins(coinToSplit, [mergeCost])[0]
    
    // Transfer LingStone directly to game treasury (using Sui native transfer)
    const GAME_TREASURY_ADDRESS = import.meta.env.VITE_GAME_TREASURY_ADDRESS
    tx.transferObjects([splitCoin], GAME_TREASURY_ADDRESS)
    
    // Burn first weapon
    tx.moveCall({
      target: `${PACKAGE_ID}::weapon::burn_weapon_by_player`,
      arguments: [
        tx.object(weapon1ObjectId),
      ],
    })
    
    // Burn second weapon
    tx.moveCall({
      target: `${PACKAGE_ID}::weapon::burn_weapon_by_player`,
      arguments: [
        tx.object(weapon2ObjectId),
      ],
    })
    
    // Player signs and executes transaction
    const burnResult = await suiWallet.signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    })
    
    // Step 2: Call backend, sponsor mints new weapon (sponsor pays gas)
    const mintResponse = await fetch(`${BACKEND_URL}/api/sponsor/merge-weapon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerAddress: walletAddress,
        weaponType,
        rarity,
        newLevel,
      }),
    })

    if (!mintResponse.ok) {
      const errorData = await mintResponse.json()
      throw new Error(errorData.error || 'Failed to merge weapons')
    }

    const data = await mintResponse.json()
    
    return {
      burnResult,
      mintResult: data.result
    }
  } catch (error) {
    throw error
  }
}

// ========== Market Related Functions ==========

/**
 * List weapon on market - Player signs themselves
 * @param {string} weaponObjectId - Weapon object ID
 * @param {number} price - Price (LING, will be automatically converted to smallest unit)
 * @returns {Promise<object>} Transaction result
 */
export async function listWeaponOnMarket(weaponObjectId, price) {
  try {
    // Get wallet
    const suiWallet = window.suiWallet
    if (!suiWallet) {
      throw new Error('Wallet not connected')
    }

    // Create transaction
    const tx = new Transaction()
    
    // Set gas budget
    tx.setGasBudget(20000000) // 0.02 SUI/OCT
    
    // Convert price to smallest unit (1 LING = 1_000_000_000 smallest unit)
    const priceInSmallestUnit = price * 1_000_000_000
    
    // Call list_weapon function
    tx.moveCall({
      target: `${PACKAGE_ID}::marketplace::list_weapon`,
      arguments: [
        tx.object(MARKETPLACE_ID),
        tx.object(weaponObjectId),
        tx.pure.u64(priceInSmallestUnit),
      ],
    })
    
    // Player signs and executes transaction
    const result = await suiWallet.signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    })
    
    return result
  } catch (error) {
    throw error
  }
}

/**
 * Buy weapon from market - Buyer signs and pays themselves
 * @param {string} escrowedObjectId - Escrowed weapon object ID
 * @param {number} price - Price (LING)
 * @param {string} buyerAddress - Buyer address
 * @returns {Promise<object>} Transaction result
 */
export async function buyWeaponFromMarket(escrowedObjectId, price, buyerAddress) {
  try {
    // Get wallet
    const suiWallet = window.suiWallet
    if (!suiWallet) {
      throw new Error('Wallet not connected')
    }

    // Get buyer's LingStone coin objects
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/lingstone/coins/${buyerAddress}`)
    if (!response.ok) {
      throw new Error('Failed to get LingStone coins')
    }
    const coinsData = await response.json()
    
    if (!coinsData.coins || coinsData.coins.length === 0) {
      throw new Error('No LingStone coins found')
    }
    
    // Convert price to smallest unit
    const priceInSmallestUnit = price * 1_000_000_000
    
    // Find coin with sufficient balance
    let selectedCoin = null
    let selectedCoinBalance = 0
    
    // Filter out correct version LingStone (matching current PACKAGE_ID)
    const correctVersionCoins = coinsData.coins.filter(coin => {
      // If backend returns coinType, check if it matches current PACKAGE_ID
      if (coin.coinType) {
        return coin.coinType === `${PACKAGE_ID}::lingstone_coin::LINGSTONE_COIN`
      }
      // If no coinType, assume correct version (backward compatibility)
      return true
    })
    
    if (correctVersionCoins.length === 0) {
      throw new Error(`LingStone version mismatch!\n\nYour LingStone tokens are from an old version.\nThe market only accepts current version (${PACKAGE_ID}) LingStone.\n\nPlease click the "Request LingStone" button to get new version tokens.`)
    }
    
    for (const coin of correctVersionCoins) {
      if (coin.balance >= priceInSmallestUnit) {
        selectedCoin = coin.coinObjectId
        selectedCoinBalance = coin.balance
        break
      }
    }
    
    if (!selectedCoin) {
      const totalBalance = correctVersionCoins.reduce((sum, coin) => sum + coin.balance, 0) / 1_000_000_000
      throw new Error(`Insufficient LingStone balance. Need ${price} LING, but total balance is ${totalBalance} LING`)
    }
    
    // Create transaction
    const tx = new Transaction()
    
    // Set gas budget
    tx.setGasBudget(30000000) // 0.03 SUI/OCT
    
    // Pass entire coin to buy_weapon, contract will handle change
    // Note: Must use correct generic type parameter
    tx.moveCall({
      target: `${PACKAGE_ID}::marketplace::buy_weapon`,
      typeArguments: [],
      arguments: [
        tx.object(MARKETPLACE_ID),
        tx.object(escrowedObjectId),
        tx.object(selectedCoin),
      ],
    })
    
    // Buyer signs and executes transaction
    const result = await suiWallet.signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    })
    
    return result
  } catch (error) {
    // Provide more friendly error messages
    if (error.message && error.message.includes('Insufficient')) {
      throw new Error(`Insufficient balance. Please ensure you have enough LingStone (need ${price} LING) and OCT tokens to pay gas fees.`)
    } else if (error.message && error.message.includes('TypeMismatch')) {
      throw new Error(`LingStone version mismatch!\n\nYour LingStone tokens may be from an old version.\nThe market only accepts current version LingStone.\n\nPlease click the "Request LingStone" button to get new version tokens.`)
    } else if (error.message && error.message.includes('dry run')) {
      throw new Error(`Transaction validation failed. Possible reasons:\n1. LingStone version mismatch (need new version)\n2. Insufficient LingStone balance\n3. Weapon already sold\n4. Insufficient gas tokens\n\nOriginal error: ${error.message}`)
    }
    
    throw error
  }
}

/**
 * Cancel market listing - Seller signs themselves
 * @param {string} escrowedObjectId - Escrowed weapon object ID
 * @returns {Promise<object>} Transaction result
 */
export async function cancelMarketListing(escrowedObjectId) {
  try {
    // Get wallet
    const suiWallet = window.suiWallet
    if (!suiWallet) {
      throw new Error('Wallet not connected')
    }

    // Create transaction
    const tx = new Transaction()
    
    // Set gas budget
    tx.setGasBudget(20000000) // 0.02 SUI/OCT
    
    // Call cancel_listing function
    tx.moveCall({
      target: `${PACKAGE_ID}::marketplace::cancel_listing`,
      arguments: [
        tx.object(MARKETPLACE_ID),
        tx.object(escrowedObjectId),
      ],
    })
    
    // Seller signs and executes transaction
    const result = await suiWallet.signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    })
    
    return result
  } catch (error) {
    throw error
  }
}

/**
 * Get all marketplace listings
 * @returns {Promise<Array>} Listing list
 */
export async function getAllMarketplaceListings() {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/marketplace/listings`)
    
    if (!response.ok) {
      throw new Error('Failed to get marketplace listings')
    }

    const data = await response.json()
    
    return data.listings || []
  } catch (error) {
    throw error
  }
}

/**
 * Get single listing details
 * @param {string} weaponId - Weapon ID
 * @returns {Promise<object|null>} Listing details or null
 */
export async function getMarketplaceListing(weaponId) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/marketplace/listing/${weaponId}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to get marketplace listing')
    }

    const data = await response.json()
    
    return data.listing
  } catch (error) {
    throw error
  }
}

import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'

// 初始化 Sui 客户端 - 使用 OneChain Testnet
export const suiClient = new SuiClient({ url: 'https://rpc-testnet.onelabs.cc:443' })

// 从环境变量或配置文件读取 (V6 - 2025-11-16)
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x798d640dfd28bb4af6d42d7148e42cfb7969dcee21cddf80d6b73674e485f10e'
export const REGISTRY_ID = import.meta.env.VITE_REGISTRY_ID || '0x1b9a306bdc38945f7e2ed5f29de2266a7f97e69b524c2749644bb9f14fefb534'
export const MARKETPLACE_ID = import.meta.env.VITE_MARKETPLACE_ID || '0xef1eea3466691ad13f30e41004e02aea30296684919634d18eefd713eda4492c'
export const WEAPON_MINT_CAP = import.meta.env.VITE_WEAPON_MINT_CAP || '0xac3485a7a55fb5685c3e6c10e576d591ad696b66201eabbdc1f0ccb1d873fcbd'

// 职业映射
export const CLASS_MAP = {
  'Mage': 1,
  'Warrior': 2,
  'Archer': 3
}

/**
 * 创建玩家角色并注册到区块链（使用赞助交易，玩家不需要付 gas）
 * @param {string} name - 角色名称
 * @param {string} className - 职业名称 (Mage, Warrior, Archer)
 * @param {object} suiWallet - Sui 钱包对象
 * @param {object} customization - 角色自定义数据
 * @returns {Promise<object>} 交易结果
 */
export async function createPlayerOnChain(name, className, suiWallet, customization) {
  try {
    const classId = CLASS_MAP[className]
    if (!classId) {
      throw new Error(`Invalid class: ${className}`)
    }

    console.log('🎮 Creating player with SPONSORED transaction (no gas needed)...')
    console.log('Wallet object:', suiWallet)

    // 获取钱包地址
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

    console.log('Player address:', playerAddress)
    console.log('💰 Gas will be paid by game sponsor (you don\'t need any tokens!)')

    // 调用后端赞助服务
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
    console.log('✅ Player created successfully with sponsored gas!')
    console.log('Transaction result:', data.result)
    
    return data.result
  } catch (error) {
    console.error('❌ Error creating player on chain:', error)
    throw error
  }
}

/**
 * 查询玩家信息
 * @param {string} playerObjectId - 玩家对象 ID
 * @returns {Promise<object>} 玩家信息
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
    console.error('Error fetching player info:', error)
    throw error
  }
}

/**
 * 查询钱包地址是否已有角色
 * @param {string} walletAddress - 钱包地址
 * @returns {Promise<object|null>} 玩家角色信息或 null
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
      console.log('✅ Existing player found:', data.player)
      return data.player
    }
    
    console.log('ℹ️ No existing player found for this wallet')
    return null
  } catch (error) {
    console.error('❌ Error checking existing player:', error)
    throw error
  }
}

/**
 * 查询玩家武器
 * @param {string} walletAddress - 钱包地址
 * @returns {Promise<object|null>} 武器信息或 null
 */
export async function checkPlayerWeapon(walletAddress) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/weapon/${walletAddress}`)
    
    if (!response.ok) {
      throw new Error('Failed to check player weapon')
    }

    const data = await response.json()
    
    if (data.exists && data.weapon) {
      console.log('✅ Player weapon found:', data.weapon)
      return data.weapon
    }
    
    console.log('ℹ️ No weapon found for this player')
    return null
  } catch (error) {
    console.error('❌ Error checking player weapon:', error)
    throw error
  }
}

/**
 * 赞助铸造武器（根据职业自动选择）
 * @param {string} walletAddress - 钱包地址
 * @param {number} classId - 职业 ID
 * @returns {Promise<object>} 交易结果
 */
export async function mintWeaponForPlayer(walletAddress, classId) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    console.log('🗡️ Minting weapon with SPONSORED transaction...')
    console.log('💰 Gas will be paid by game sponsor!')
    
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
    console.log('✅ Weapon minted successfully!')
    
    return data.result
  } catch (error) {
    console.error('❌ Error minting weapon:', error)
    throw error
  }
}

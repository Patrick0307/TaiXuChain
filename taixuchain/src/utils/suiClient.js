import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'

// 初始化 Sui 客户端 - 使用 OneChain Testnet
export const suiClient = new SuiClient({ url: 'https://rpc-testnet.onelabs.cc:443' })

// 从环境变量或配置文件读取 (V8 - 2025-11-20)
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0xd249f6f2ecf256b26025e2d8454482e05565b716d5c3ebb6cf5fd24d01f03c9f'
export const REGISTRY_ID = import.meta.env.VITE_REGISTRY_ID || '0xb385cbebfde05028eb3dd95754ca2d3651d477bd438621741d393fb390776948'
export const MARKETPLACE_ID = import.meta.env.VITE_MARKETPLACE_ID || '0x3b18f7a9fe90b85aad2e425ff42a1a27b73005d4eee08974c340c378c137e463'
export const WEAPON_MINT_CAP = import.meta.env.VITE_WEAPON_MINT_CAP || '0xb7bd7f2b0f7f1a93a71e52a380345f930c2010997a7fccee27b70f59a66e5c95'

// 职业映射（与后端和合约保持一致）
export const CLASS_MAP = {
  'Warrior': 1,
  'Archer': 2,
  'Mage': 3
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
 * 查询玩家武器（可选：根据职业过滤）
 * @param {string} walletAddress - 钱包地址
 * @param {number} classId - 职业 ID (可选，用于过滤匹配职业的武器)
 * @returns {Promise<object|null>} 武器信息或 null
 */
export async function checkPlayerWeapon(walletAddress, classId = null) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    // 如果提供了 classId，添加到查询参数
    const url = classId 
      ? `${BACKEND_URL}/api/weapon/${walletAddress}?classId=${classId}`
      : `${BACKEND_URL}/api/weapon/${walletAddress}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('Failed to check player weapon')
    }

    const data = await response.json()
    
    if (data.exists && data.weapon) {
      console.log('✅ Player weapon found:', data.weapon)
      return data.weapon
    }
    
    console.log('ℹ️ No weapon found for this player' + (classId ? ` (class ${classId})` : ''))
    return null
  } catch (error) {
    console.error('❌ Error checking player weapon:', error)
    throw error
  }
}

/**
 * 获取玩家所有武器
 * @param {string} walletAddress - 钱包地址
 * @returns {Promise<Array>} 武器列表
 */
export async function getAllPlayerWeapons(walletAddress) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/weapons/${walletAddress}`)
    
    if (!response.ok) {
      throw new Error('Failed to get player weapons')
    }

    const data = await response.json()
    
    console.log(`✅ Found ${data.count} weapon(s)`)
    return data.weapons || []
  } catch (error) {
    console.error('❌ Error getting player weapons:', error)
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

/**
 * 赞助铸造随机武器（怪物掉落）
 * @param {string} walletAddress - 钱包地址
 * @returns {Promise<object>} 交易结果和武器信息
 */
export async function mintRandomWeaponForPlayer(walletAddress) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    console.log('🎲 Minting RANDOM weapon with SPONSORED transaction...')
    console.log('💰 Gas will be paid by game sponsor!')
    
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
    console.log('✅ Random weapon minted successfully!')
    console.log('🎲 Weapon info:', data.weaponInfo)
    
    return data
  } catch (error) {
    console.error('❌ Error minting random weapon:', error)
    throw error
  }
}

/**
 * 获取 LingStone 余额
 * @param {string} walletAddress - 钱包地址
 * @returns {Promise<number>} LingStone 余额
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
    console.error('❌ Error getting LingStone balance:', error)
    return 0
  }
}

/**
 * 请求 LingStone（铸币 10000）
 * @param {string} walletAddress - 钱包地址
 * @returns {Promise<object>} 交易结果
 */
export async function requestLingStone(walletAddress) {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    console.log('💎 Requesting LingStone with SPONSORED transaction...')
    console.log('💰 Gas will be paid by game sponsor!')
    
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
    console.log('✅ LingStone minted successfully!')
    
    return data.result
  } catch (error) {
    console.error('❌ Error requesting LingStone:', error)
    throw error
  }
}

/**
 * 销毁武器（丢弃）- 玩家自己签名
 * @param {string} weaponObjectId - 武器对象 ID
 * @returns {Promise<object>} 交易结果
 */
export async function burnWeapon(weaponObjectId) {
  try {
    console.log('🔥 Burning weapon...')
    console.log('  Weapon ID:', weaponObjectId)
    console.log('  Package ID:', PACKAGE_ID)
    console.log('📝 You will need to sign this transaction')
    
    // 获取钱包
    const suiWallet = window.suiWallet
    if (!suiWallet) {
      throw new Error('Wallet not connected')
    }

    // 创建交易
    const tx = new Transaction()
    
    // 设置 gas budget（销毁操作很简单，不需要太多 gas）
    tx.setGasBudget(10000000) // 0.01 SUI/OCT
    
    // 调用 burn_weapon_by_player 函数
    tx.moveCall({
      target: `${PACKAGE_ID}::weapon::burn_weapon_by_player`,
      arguments: [
        tx.object(weaponObjectId),
      ],
    })
    
    console.log('🔥 Signing and executing burn transaction...')
    console.log('  Target:', `${PACKAGE_ID}::weapon::burn_weapon_by_player`)
    
    // 玩家签名并执行交易
    const result = await suiWallet.signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    })
    
    console.log('✅ Weapon burned successfully!')
    console.log('  Digest:', result.digest)
    
    return result
  } catch (error) {
    console.error('❌ Error burning weapon:', error)
    console.error('  Error details:', error.message)
    throw error
  }
}

/**
 * 合成武器 - 玩家销毁LingStone和两把武器，sponsor铸造升级后的武器
 * @param {string} weapon1ObjectId - 第一把武器对象 ID
 * @param {string} weapon2ObjectId - 第二把武器对象 ID
 * @param {number} weaponType - 武器类型
 * @param {number} rarity - 稀有度
 * @param {number} newLevel - 新武器等级
 * @param {string} walletAddress - 钱包地址
 * @param {number} weaponLevel - 当前武器等级（用于计算费用）
 * @returns {Promise<object>} 交易结果
 */
export async function mergeWeapons(weapon1ObjectId, weapon2ObjectId, weaponType, rarity, newLevel, walletAddress, weaponLevel) {
  try {
    console.log('⚔️ Merging weapons...')
    console.log('  Weapon 1:', weapon1ObjectId)
    console.log('  Weapon 2:', weapon2ObjectId)
    console.log('  New Level:', newLevel)
    
    // 计算合成费用：基础费用 100 LING + (等级 * 50 LING)
    const mergeCost = (100 + (weaponLevel * 50)) * 1_000_000_000
    console.log(`💎 Merge cost: ${(100 + (weaponLevel * 50))} LING`)
    console.log('📝 Step 1: You will sign to pay LingStone and burn 2 weapons (you pay gas)')
    
    // 获取钱包
    const suiWallet = window.suiWallet
    if (!suiWallet) {
      throw new Error('Wallet not connected')
    }

    // 步骤1：玩家销毁LingStone和两把武器（玩家付gas）
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    // 获取玩家的 LingStone coin 对象
    const response = await fetch(`${BACKEND_URL}/api/lingstone/coins/${walletAddress}`)
    if (!response.ok) {
      throw new Error('Failed to get LingStone coins')
    }
    const coinsData = await response.json()
    
    if (!coinsData.coins || coinsData.coins.length === 0) {
      throw new Error('No LingStone coins found')
    }
    
    // 找到足够余额的 coin 或合并多个 coins
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
    tx.setGasBudget(30000000) // 0.03 SUI/OCT (burn coin + 两次销毁武器)
    
    // 分割出需要的金额
    const coinToSplit = tx.object(selectedCoin)
    const splitCoin = tx.splitCoins(coinToSplit, [mergeCost])[0]
    
    // 直接转账 LingStone 给游戏金库（使用 Sui 原生转账）
    const GAME_TREASURY_ADDRESS = import.meta.env.VITE_GAME_TREASURY_ADDRESS
    tx.transferObjects([splitCoin], GAME_TREASURY_ADDRESS)
    
    // 销毁第一把武器
    tx.moveCall({
      target: `${PACKAGE_ID}::weapon::burn_weapon_by_player`,
      arguments: [
        tx.object(weapon1ObjectId),
      ],
    })
    
    // 销毁第二把武器
    tx.moveCall({
      target: `${PACKAGE_ID}::weapon::burn_weapon_by_player`,
      arguments: [
        tx.object(weapon2ObjectId),
      ],
    })
    
    console.log('🔥 Signing and executing burn transactions...')
    
    // 玩家签名并执行交易
    const burnResult = await suiWallet.signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    })
    
    console.log('✅ LingStone paid and weapons burned successfully!')
    console.log('  Digest:', burnResult.digest)
    
    // 步骤2：调用后端，sponsor铸造新武器（sponsor付gas）
    console.log('💰 Step 2: Sponsor will mint upgraded weapon (sponsor pays gas)')
    
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
    console.log('✅ New weapon minted successfully!')
    console.log('  Result:', data.result)
    
    return {
      burnResult,
      mintResult: data.result
    }
  } catch (error) {
    console.error('❌ Error merging weapons:', error)
    throw error
  }
}

// ========== 市场相关函数 ==========

/**
 * 上架武器到市场 - 玩家自己签名
 * @param {string} weaponObjectId - 武器对象 ID
 * @param {number} price - 价格（LING，会自动转换为最小单位）
 * @returns {Promise<object>} 交易结果
 */
export async function listWeaponOnMarket(weaponObjectId, price) {
  try {
    console.log('📦 Listing weapon on marketplace...')
    console.log('  Weapon ID:', weaponObjectId)
    console.log('  Price:', price, 'LING')
    console.log('📝 You will need to sign this transaction')
    
    // 获取钱包
    const suiWallet = window.suiWallet
    if (!suiWallet) {
      throw new Error('Wallet not connected')
    }

    // 创建交易
    const tx = new Transaction()
    
    // 设置 gas budget
    tx.setGasBudget(20000000) // 0.02 SUI/OCT
    
    // 将价格转换为最小单位（1 LING = 1_000_000_000 最小单位）
    const priceInSmallestUnit = price * 1_000_000_000
    
    // 调用 list_weapon 函数
    tx.moveCall({
      target: `${PACKAGE_ID}::marketplace::list_weapon`,
      arguments: [
        tx.object(MARKETPLACE_ID),
        tx.object(weaponObjectId),
        tx.pure.u64(priceInSmallestUnit),
      ],
    })
    
    console.log('📦 Signing and executing list transaction...')
    console.log('  Target:', `${PACKAGE_ID}::marketplace::list_weapon`)
    console.log('  Marketplace ID:', MARKETPLACE_ID)
    
    // 玩家签名并执行交易
    const result = await suiWallet.signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    })
    
    console.log('✅ Weapon listed successfully!')
    console.log('  Digest:', result.digest)
    
    return result
  } catch (error) {
    console.error('❌ Error listing weapon:', error)
    console.error('  Error details:', error.message)
    throw error
  }
}

/**
 * 购买市场上的武器 - 买家自己签名并支付
 * @param {string} escrowedObjectId - 托管武器对象 ID
 * @param {number} price - 价格（LING）
 * @param {string} buyerAddress - 买家地址
 * @returns {Promise<object>} 交易结果
 */
export async function buyWeaponFromMarket(escrowedObjectId, price, buyerAddress) {
  try {
    console.log('💰 Buying weapon from marketplace...')
    console.log('  Escrowed Object ID:', escrowedObjectId)
    console.log('  Price:', price, 'LING')
    console.log('📝 You will need to sign this transaction and pay', price, 'LING')
    
    // 获取钱包
    const suiWallet = window.suiWallet
    if (!suiWallet) {
      throw new Error('Wallet not connected')
    }

    // 获取买家的 LingStone coin 对象
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/lingstone/coins/${buyerAddress}`)
    if (!response.ok) {
      throw new Error('Failed to get LingStone coins')
    }
    const coinsData = await response.json()
    
    if (!coinsData.coins || coinsData.coins.length === 0) {
      throw new Error('No LingStone coins found')
    }
    
    // 将价格转换为最小单位
    const priceInSmallestUnit = price * 1_000_000_000
    
    // 找到足够余额的 coin
    let selectedCoin = null
    let selectedCoinBalance = 0
    
    console.log('💎 Available LingStone coins:')
    coinsData.coins.forEach((coin, index) => {
      const coinBalance = coin.balance / 1_000_000_000
      console.log(`  Coin ${index + 1}: ${coin.coinObjectId}`)
      console.log(`    Balance: ${coinBalance} LING (${coin.balance} raw)`)
      console.log(`    Type: ${coin.coinType || 'unknown'}`)
    })
    
    // 过滤出正确版本的 LingStone（匹配当前 PACKAGE_ID）
    const correctVersionCoins = coinsData.coins.filter(coin => {
      // 如果后端返回了 coinType，检查是否匹配当前 PACKAGE_ID
      if (coin.coinType) {
        return coin.coinType === `${PACKAGE_ID}::lingstone_coin::LINGSTONE_COIN`
      }
      // 如果没有 coinType，假设是正确版本（向后兼容）
      return true
    })
    
    console.log(`💎 Found ${correctVersionCoins.length} coin(s) with correct version (${PACKAGE_ID})`)
    
    if (correctVersionCoins.length === 0) {
      throw new Error(`❌ LingStone 版本不匹配！\n\n你的 LingStone 代币是旧版本的。\n市场只接受当前版本 (${PACKAGE_ID}) 的 LingStone。\n\n请点击"领取 LingStone"按钮获取新版本的代币。`)
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
    
    console.log('💎 Selected coin:', selectedCoin)
    console.log(`  Balance: ${selectedCoinBalance / 1_000_000_000} LING (${selectedCoinBalance} raw)`)
    console.log(`  Required: ${price} LING (${priceInSmallestUnit} raw)`)
    
    // 创建交易
    const tx = new Transaction()
    
    // 设置 gas budget
    tx.setGasBudget(30000000) // 0.03 SUI/OCT
    
    console.log('💎 Using LingStone coin:', selectedCoin)
    console.log('  Balance:', selectedCoinBalance / 1_000_000_000, 'LING')
    console.log('  Required:', price, 'LING')
    console.log('💰 Calling buy_weapon (contract will handle change)...')
    
    // 直接传递整个 coin 给 buy_weapon，合约会处理找零
    // 注意：必须使用正确的泛型类型参数
    tx.moveCall({
      target: `${PACKAGE_ID}::marketplace::buy_weapon`,
      typeArguments: [],
      arguments: [
        tx.object(MARKETPLACE_ID),
        tx.object(escrowedObjectId),
        tx.object(selectedCoin),
      ],
    })
    
    console.log('💰 Signing and executing buy transaction...')
    console.log('  Target:', `${PACKAGE_ID}::marketplace::buy_weapon`)
    
    // 买家签名并执行交易
    const result = await suiWallet.signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    })
    
    console.log('✅ Weapon purchased successfully!')
    console.log('  Digest:', result.digest)
    
    return result
  } catch (error) {
    console.error('❌ Error buying weapon:', error)
    console.error('  Error details:', error.message)
    console.error('  Full error:', error)
    
    // 提供更友好的错误信息
    if (error.message && error.message.includes('Insufficient')) {
      throw new Error(`余额不足。请确保你有足够的 LingStone (需要 ${price} LING) 和 OCT 代币支付 gas 费用。`)
    } else if (error.message && error.message.includes('TypeMismatch')) {
      throw new Error(`LingStone 版本不匹配！\n\n你的 LingStone 代币可能是旧版本的。\n市场只接受当前版本的 LingStone。\n\n请点击"领取 LingStone"按钮获取新版本的代币。`)
    } else if (error.message && error.message.includes('dry run')) {
      throw new Error(`交易验证失败。可能原因：\n1. LingStone 版本不匹配（需要新版本）\n2. LingStone 余额不足\n3. 武器已被售出\n4. Gas 代币不足\n\n原始错误: ${error.message}`)
    }
    
    throw error
  }
}

/**
 * 取消市场挂单 - 卖家自己签名
 * @param {string} escrowedObjectId - 托管武器对象 ID
 * @returns {Promise<object>} 交易结果
 */
export async function cancelMarketListing(escrowedObjectId) {
  try {
    console.log('❌ Canceling marketplace listing...')
    console.log('  Escrowed Object ID:', escrowedObjectId)
    console.log('📝 You will need to sign this transaction')
    
    // 获取钱包
    const suiWallet = window.suiWallet
    if (!suiWallet) {
      throw new Error('Wallet not connected')
    }

    // 创建交易
    const tx = new Transaction()
    
    // 设置 gas budget
    tx.setGasBudget(20000000) // 0.02 SUI/OCT
    
    // 调用 cancel_listing 函数
    tx.moveCall({
      target: `${PACKAGE_ID}::marketplace::cancel_listing`,
      arguments: [
        tx.object(MARKETPLACE_ID),
        tx.object(escrowedObjectId),
      ],
    })
    
    console.log('❌ Signing and executing cancel transaction...')
    console.log('  Target:', `${PACKAGE_ID}::marketplace::cancel_listing`)
    
    // 卖家签名并执行交易
    const result = await suiWallet.signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    })
    
    console.log('✅ Listing canceled successfully!')
    console.log('  Digest:', result.digest)
    
    return result
  } catch (error) {
    console.error('❌ Error canceling listing:', error)
    console.error('  Error details:', error.message)
    throw error
  }
}

/**
 * 获取所有市场挂单
 * @returns {Promise<Array>} 挂单列表
 */
export async function getAllMarketplaceListings() {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    
    const response = await fetch(`${BACKEND_URL}/api/marketplace/listings`)
    
    if (!response.ok) {
      throw new Error('Failed to get marketplace listings')
    }

    const data = await response.json()
    
    console.log(`✅ Found ${data.count} listing(s)`)
    return data.listings || []
  } catch (error) {
    console.error('❌ Error getting marketplace listings:', error)
    throw error
  }
}

/**
 * 获取单个挂单详情
 * @param {string} weaponId - 武器 ID
 * @returns {Promise<object|null>} 挂单详情或 null
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
    
    console.log(`✅ Listing found`)
    return data.listing
  } catch (error) {
    console.error('❌ Error getting marketplace listing:', error)
    throw error
  }
}

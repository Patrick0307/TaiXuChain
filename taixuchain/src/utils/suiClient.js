import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'

// 初始化 Sui 客户端 - 使用 OneChain Testnet
export const suiClient = new SuiClient({ url: 'https://rpc-testnet.onelabs.cc:443' })

// 从环境变量或配置文件读取
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x2065f3f546d076e2a67de7900e471601e4fda71d34749143b3aa7fdf0fbcf9d5'
export const REGISTRY_ID = import.meta.env.VITE_REGISTRY_ID || '0x1586d814c0cd790cf281073d8a2de6f8cf398001866b2c717154f4c5a18572d9'

// 职业映射
export const CLASS_MAP = {
  'Mage': 1,
  'Warrior': 2,
  'Archer': 3
}

/**
 * 创建玩家角色并注册到区块链
 * @param {string} name - 角色名称
 * @param {string} className - 职业名称 (Mage, Warrior, Archer)
 * @param {object} suiWallet - Sui 钱包对象
 * @returns {Promise<object>} 交易结果
 */
export async function createPlayerOnChain(name, className, suiWallet) {
  try {
    const classId = CLASS_MAP[className]
    if (!classId) {
      throw new Error(`Invalid class: ${className}`)
    }

    console.log('Creating transaction...')
    console.log('Wallet object:', suiWallet)
    console.log('Available methods:', Object.keys(suiWallet))

    // 获取钱包地址
    let senderAddress
    if (suiWallet.getAccounts) {
      const accounts = await suiWallet.getAccounts()
      senderAddress = accounts[0]
    } else if (suiWallet.address) {
      senderAddress = suiWallet.address
    } else if (window.currentWalletAddress) {
      senderAddress = window.currentWalletAddress
    } else {
      throw new Error('Cannot get wallet address')
    }

    console.log('Sender address:', senderAddress)

    // 获取 gas coins - OneChain 使用 OCT 作为 gas
    console.log('Fetching gas coins (OCT)...')
    
    // 尝试获取所有 coins
    const allCoins = await suiClient.getAllCoins({
      owner: senderAddress,
    })
    
    console.log('All coins:', allCoins)
    
    // 查找 OCT 或 SUI coins
    let gasCoins = allCoins.data.filter(coin => 
      coin.coinType.includes('::sui::SUI') || 
      coin.coinType.includes('::oct::OCT') ||
      coin.coinType === '0x2::sui::SUI'
    )
    
    console.log('Gas coins found:', gasCoins)
    
    if (!gasCoins || gasCoins.length === 0) {
      // 如果没有找到，尝试直接获取 SUI coins
      const suiCoins = await suiClient.getCoins({
        owner: senderAddress,
        coinType: '0x2::sui::SUI',
      })
      gasCoins = suiCoins.data
      console.log('SUI coins:', gasCoins)
    }
    
    if (!gasCoins || gasCoins.length === 0) {
      throw new Error('No gas coins (OCT/SUI) found. Please add some test tokens to your wallet from the faucet.')
    }

    const tx = new Transaction()
    tx.setSender(senderAddress)
    
    // 设置 gas payment - 使用找到的 gas coins
    // 需要转换为正确的对象格式
    const gasCoinsToUse = gasCoins.slice(0, 10).map(coin => ({
      objectId: coin.coinObjectId,
      version: coin.version,
      digest: coin.digest
    }))
    console.log('Using gas coins:', gasCoinsToUse)
    tx.setGasPayment(gasCoinsToUse)
    
    // 调用 create_player 函数
    tx.moveCall({
      target: `${PACKAGE_ID}::player::create_player`,
      arguments: [
        tx.object(REGISTRY_ID), // registry
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(name))), // name as vector<u8>
        tx.pure.u8(classId), // class
      ],
    })

    console.log('Transaction created:', tx)
    console.log('=== CODE VERSION: 2024-11-08-v2 ===')
    console.log('Checking wallet methods...')
    console.log('Has signTransaction?', !!suiWallet.signTransaction)
    console.log('Has signTransactionBlock?', !!suiWallet.signTransactionBlock)
    console.log('Has signAndExecuteTransaction?', !!suiWallet.signAndExecuteTransaction)

    // 方法 1: 使用 signAndExecuteTransaction (最简单的方式)
    if (suiWallet.signAndExecuteTransaction) {
      console.log('Using signAndExecuteTransaction (direct)')
      
      try {
        const result = await suiWallet.signAndExecuteTransaction({
          transaction: tx,
          options: {
            showEffects: true,
            showEvents: true,
          },
        })
        
        console.log('Transaction result:', result)
        return result
      } catch (err) {
        console.log('signAndExecuteTransaction failed, trying alternative:', err)
      }
    }
    
    // 方法 2: 使用 signTransaction (新版 API)
    if (suiWallet.signTransaction) {
      console.log('Using signTransaction + manual execution')
      
      // 构建交易字节
      const txBytes = await tx.build({ client: suiClient })
      console.log('Transaction bytes built:', txBytes)
      
      // 签名
      const signedTx = await suiWallet.signTransaction({
        transaction: txBytes,
      })
      console.log('Transaction signed:', signedTx)
      
      // 执行 - 处理不同的返回格式
      let txBlockBytes = signedTx.transactionBlockBytes
      let signature = signedTx.signature
      
      // 如果是字符串，需要转换为 Uint8Array
      if (typeof txBlockBytes === 'string') {
        // 移除 0x 前缀（如果有）
        const hexString = txBlockBytes.startsWith('0x') ? txBlockBytes.slice(2) : txBlockBytes
        txBlockBytes = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
      }
      
      console.log('Executing transaction with bytes:', txBlockBytes, 'signature:', signature)
      
      const result = await suiClient.executeTransactionBlock({
        transactionBlock: txBlockBytes,
        signature: signature,
        options: {
          showEffects: true,
          showEvents: true,
        },
      })
      
      console.log('Transaction result:', result)
      return result
    }
    // 方法 2: 使用 signTransactionBlock (旧版 API 兼容)
    else if (suiWallet.signTransactionBlock) {
      console.log('Using signTransactionBlock + manual execution')
      
      const txBytes = await tx.build({ client: suiClient })
      
      const signedTx = await suiWallet.signTransactionBlock({
        transactionBlock: txBytes,
      })
      console.log('Transaction signed:', signedTx)
      
      let txBlockBytes = signedTx.transactionBlockBytes || signedTx.bytes
      let signature = signedTx.signature
      
      if (typeof txBlockBytes === 'string') {
        const hexString = txBlockBytes.startsWith('0x') ? txBlockBytes.slice(2) : txBlockBytes
        txBlockBytes = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
      }
      
      const result = await suiClient.executeTransactionBlock({
        transactionBlock: txBlockBytes,
        signature: signature,
        options: {
          showEffects: true,
          showEvents: true,
        },
      })
      
      console.log('Transaction result:', result)
      return result
    }
    else {
      throw new Error('Wallet does not support transaction signing')
    }
  } catch (error) {
    console.error('Error creating player on chain:', error)
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

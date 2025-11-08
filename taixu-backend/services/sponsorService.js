import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHex } from '@mysten/sui/utils';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 初始化 Sui 客户端
const suiClient = new SuiClient({ 
  url: process.env.SUI_RPC_URL || 'https://rpc-testnet.onelabs.cc:443' 
});

// 赞助钱包（你的钱包）
let sponsorKeypair;
try {
  const privateKeyHex = process.env.SPONSOR_PRIVATE_KEY;
  if (!privateKeyHex) {
    throw new Error('SPONSOR_PRIVATE_KEY not set in .env file');
  }
  
  // 移除可能的 0x 前缀
  const cleanKey = privateKeyHex.startsWith('0x') 
    ? privateKeyHex.slice(2) 
    : privateKeyHex;
  
  sponsorKeypair = Ed25519Keypair.fromSecretKey(fromHex(cleanKey));
  const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
  console.log(`✅ Sponsor wallet loaded: ${sponsorAddress}`);
} catch (error) {
  console.error('❌ Failed to load sponsor wallet:', error.message);
  console.error('Please set SPONSOR_PRIVATE_KEY in .env file');
  process.exit(1);
}

const PACKAGE_ID = process.env.PACKAGE_ID;
const REGISTRY_ID = process.env.REGISTRY_ID;

/**
 * 赞助创建角色交易（完全赞助模式）
 * @param {string} playerAddress - 玩家钱包地址
 * @param {string} name - 角色名称
 * @param {number} classId - 职业 ID (1=Mage, 2=Warrior, 3=Archer)
 */
export async function sponsorCreatePlayer(playerAddress, name, classId) {
  try {
    const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
    
    console.log(`[Sponsor] Building transaction...`);
    console.log(`  Player: ${playerAddress}`);
    console.log(`  Sponsor: ${sponsorAddress} (paying gas)`);
    
    // 1. 获取赞助钱包的 gas coins (支持 SUI 和 OCT)
    console.log(`[Sponsor] Fetching gas coins...`);
    
    const allCoins = await suiClient.getAllCoins({
      owner: sponsorAddress,
    });
    
    console.log(`[Sponsor] Total coins found: ${allCoins.data.length}`);
    
    // 查找可用的 gas coins (SUI 或 OCT)
    let gasCoins = allCoins.data.filter(coin => 
      coin.coinType === '0x2::sui::SUI' || 
      coin.coinType === '0x2::oct::OCT' ||
      coin.coinType.endsWith('::sui::SUI') ||
      coin.coinType.endsWith('::oct::OCT')
    );
    
    if (!gasCoins || gasCoins.length === 0) {
      throw new Error('Sponsor wallet has no gas coins (SUI or OCT). Please add tokens to the sponsor wallet.');
    }
    
    console.log(`[Sponsor] Found ${gasCoins.length} gas coins (${gasCoins[0]?.coinType})`);
    
    // 2. 创建交易 - 赞助者作为 sender
    const tx = new Transaction();
    tx.setSender(sponsorAddress);
    
    // 设置 gas payment (使用前几个 coins)
    tx.setGasPayment(gasCoins.slice(0, 5).map(coin => ({
      objectId: coin.coinObjectId,
      version: coin.version,
      digest: coin.digest,
    })));
    
    // 3. 调用 create_player_for 函数（赞助版本）
    // 这个函数会创建 Player 对象并转移给 playerAddress
    tx.moveCall({
      target: `${PACKAGE_ID}::player::create_player_for`,
      arguments: [
        tx.object(REGISTRY_ID),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(name))),
        tx.pure.u8(classId),
        tx.pure.address(playerAddress),  // 指定接收者为玩家地址
      ],
    });
    
    console.log(`[Sponsor] Building and signing transaction...`);
    
    // 4. 构建、签名并执行交易
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: sponsorKeypair,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    
    console.log(`[Sponsor] ✅ Transaction successful!`);
    console.log(`  Digest: ${result.digest}`);
    console.log(`  Gas used: ${result.effects?.gasUsed?.computationCost || 'N/A'}`);
    
    return result;
  } catch (error) {
    console.error('[Sponsor] ❌ Transaction failed:', error);
    throw error;
  }
}

/**
 * 获取赞助钱包余额
 */
export async function getSponsorBalance() {
  try {
    const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
    const balance = await suiClient.getBalance({
      owner: sponsorAddress,
      coinType: '0x2::sui::SUI',
    });
    return {
      address: sponsorAddress,
      balance: balance.totalBalance,
      balanceFormatted: (parseInt(balance.totalBalance) / 1e9).toFixed(4) + ' SUI',
    };
  } catch (error) {
    console.error('Failed to get sponsor balance:', error);
    throw error;
  }
}

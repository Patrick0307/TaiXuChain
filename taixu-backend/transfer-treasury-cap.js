import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHex } from '@mysten/sui/utils';
import dotenv from 'dotenv';

dotenv.config();

const suiClient = new SuiClient({ 
  url: process.env.SUI_RPC_URL || 'https://rpc-testnet.onelabs.cc:443' 
});

const LINGSTONE_PACKAGE_ID = process.env.LINGSTONE_PACKAGE_ID;
const LINGSTONE_TREASURY_CAP = process.env.LINGSTONE_TREASURY_CAP;

// 从环境变量读取当前拥有者的私钥
// 根据错误信息，TreasuryCap 被 0x3a12bbc64c803156905510125e939ad9b6bbbce8fd0debb184ec73ef60fde9b3 拥有
// 这个地址对应的私钥需要设置在环境变量中
const CURRENT_OWNER_PRIVATE_KEY = process.env.WEAPON_DEPLOY_PRIVATE_KEY;

// Sponsor 地址（目标地址）
const SPONSOR_PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY;

async function transferTreasuryCap() {
  try {
    console.log('=== 转移 TreasuryCap 所有权 ===\n');
    
    // 加载当前拥有者的钱包
    const cleanKey = CURRENT_OWNER_PRIVATE_KEY.startsWith('0x') 
      ? CURRENT_OWNER_PRIVATE_KEY.slice(2) 
      : CURRENT_OWNER_PRIVATE_KEY;
    const currentOwnerKeypair = Ed25519Keypair.fromSecretKey(fromHex(cleanKey));
    const currentOwnerAddress = currentOwnerKeypair.getPublicKey().toSuiAddress();
    
    // 加载 sponsor 钱包
    const sponsorCleanKey = SPONSOR_PRIVATE_KEY.startsWith('0x') 
      ? SPONSOR_PRIVATE_KEY.slice(2) 
      : SPONSOR_PRIVATE_KEY;
    const sponsorKeypair = Ed25519Keypair.fromSecretKey(fromHex(sponsorCleanKey));
    const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
    
    console.log(`当前拥有者: ${currentOwnerAddress}`);
    console.log(`目标地址 (Sponsor): ${sponsorAddress}`);
    console.log(`TreasuryCap ID: ${LINGSTONE_TREASURY_CAP}\n`);
    
    // 1. 验证 TreasuryCap 所有权
    console.log('1️⃣ 验证 TreasuryCap 所有权...');
    const treasuryCapObject = await suiClient.getObject({
      id: LINGSTONE_TREASURY_CAP,
      options: {
        showOwner: true,
        showType: true,
      },
    });
    
    const owner = treasuryCapObject.data?.owner;
    console.log(`   当前拥有者:`, owner);
    
    if (owner?.AddressOwner !== currentOwnerAddress) {
      console.error(`\n❌ 错误: TreasuryCap 不是由 ${currentOwnerAddress} 拥有`);
      console.error(`   实际拥有者: ${owner?.AddressOwner}`);
      console.error(`\n请更新 WEAPON_DEPLOY_PRIVATE_KEY 环境变量为实际拥有者的私钥`);
      return;
    }
    
    console.log(`   ✅ 验证通过\n`);
    
    // 2. 获取 gas coins
    console.log('2️⃣ 获取 gas coins...');
    const allCoins = await suiClient.getAllCoins({
      owner: currentOwnerAddress,
    });
    
    let gasCoins = allCoins.data.filter(coin => 
      coin.coinType === '0x2::sui::SUI' || 
      coin.coinType === '0x2::oct::OCT' ||
      coin.coinType.endsWith('::sui::SUI') ||
      coin.coinType.endsWith('::oct::OCT')
    );
    
    if (!gasCoins || gasCoins.length === 0) {
      console.error('   ❌ 当前拥有者钱包没有 gas coins');
      return;
    }
    
    console.log(`   ✅ 找到 ${gasCoins.length} 个 gas coins\n`);
    
    // 3. 创建转移交易
    console.log('3️⃣ 创建转移交易...');
    const tx = new Transaction();
    tx.setSender(currentOwnerAddress);
    
    tx.setGasPayment(gasCoins.slice(0, 5).map(coin => ({
      objectId: coin.coinObjectId,
      version: coin.version,
      digest: coin.digest,
    })));
    
    // 调用 transfer_treasury_cap 函数
    tx.moveCall({
      target: `${LINGSTONE_PACKAGE_ID}::lingstone_coin::transfer_treasury_cap`,
      arguments: [
        tx.object(LINGSTONE_TREASURY_CAP),
        tx.pure.address(sponsorAddress),
      ],
    });
    
    console.log(`   ✅ 交易已创建\n`);
    
    // 4. 签名并执行交易
    console.log('4️⃣ 签名并执行交易...');
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: currentOwnerKeypair,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    
    console.log(`   ✅ 交易成功!\n`);
    console.log(`Transaction Digest: ${result.digest}`);
    console.log(`Gas Used: ${result.effects?.gasUsed?.computationCost || 'N/A'}\n`);
    
    // 5. 验证转移结果
    console.log('5️⃣ 验证转移结果...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待 2 秒
    
    const updatedTreasuryCapObject = await suiClient.getObject({
      id: LINGSTONE_TREASURY_CAP,
      options: {
        showOwner: true,
      },
    });
    
    const newOwner = updatedTreasuryCapObject.data?.owner;
    console.log(`   新拥有者:`, newOwner);
    
    if (newOwner?.AddressOwner === sponsorAddress) {
      console.log(`\n✅ 成功! TreasuryCap 已转移给 Sponsor 钱包`);
      console.log(`\n现在可以使用 LingStone 铸币功能了！`);
    } else {
      console.error(`\n❌ 转移失败，请检查交易详情`);
    }
    
  } catch (error) {
    console.error('\n❌ 转移失败:', error);
    console.error('错误详情:', error.message);
  }
}

// 运行转移
transferTreasuryCap();

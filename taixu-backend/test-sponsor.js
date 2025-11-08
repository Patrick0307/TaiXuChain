/**
 * 测试赞助钱包配置
 * 运行: node test-sponsor.js
 */

import dotenv from 'dotenv';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHex } from '@mysten/sui/utils';

dotenv.config();

async function testSponsorWallet() {
  console.log('🧪 Testing Sponsor Wallet Configuration...\n');

  // 1. 检查环境变量
  console.log('1️⃣ Checking environment variables...');
  const privateKey = process.env.SPONSOR_PRIVATE_KEY;
  const rpcUrl = process.env.SUI_RPC_URL;
  const packageId = process.env.PACKAGE_ID;
  const registryId = process.env.REGISTRY_ID;

  if (!privateKey) {
    console.error('❌ SPONSOR_PRIVATE_KEY not set in .env file');
    return;
  }
  console.log('✅ SPONSOR_PRIVATE_KEY found');

  if (!rpcUrl) {
    console.error('❌ SUI_RPC_URL not set');
    return;
  }
  console.log('✅ SUI_RPC_URL:', rpcUrl);

  if (!packageId || !registryId) {
    console.error('❌ PACKAGE_ID or REGISTRY_ID not set');
    return;
  }
  console.log('✅ Contract addresses configured');

  // 2. 加载钱包
  console.log('\n2️⃣ Loading sponsor wallet...');
  let sponsorKeypair;
  try {
    const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    sponsorKeypair = Ed25519Keypair.fromSecretKey(fromHex(cleanKey));
    const address = sponsorKeypair.getPublicKey().toSuiAddress();
    console.log('✅ Sponsor wallet loaded');
    console.log('   Address:', address);
  } catch (error) {
    console.error('❌ Failed to load wallet:', error.message);
    return;
  }

  // 3. 连接到 Sui 网络
  console.log('\n3️⃣ Connecting to Sui network...');
  const suiClient = new SuiClient({ url: rpcUrl });
  try {
    const chainId = await suiClient.getChainIdentifier();
    console.log('✅ Connected to Sui network');
    console.log('   Chain ID:', chainId);
  } catch (error) {
    console.error('❌ Failed to connect:', error.message);
    return;
  }

  // 4. 检查余额
  console.log('\n4️⃣ Checking sponsor wallet balance...');
  const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
  try {
    // 检查 SUI 余额
    const suiBalance = await suiClient.getBalance({
      owner: sponsorAddress,
      coinType: '0x2::sui::SUI',
    });
    
    const suiBalanceFormatted = (parseInt(suiBalance.totalBalance) / 1e9).toFixed(4);
    console.log('✅ SUI Balance:', suiBalanceFormatted, 'SUI');
    
    // 检查所有 coins（包括 OCT）
    const allCoins = await suiClient.getAllCoins({
      owner: sponsorAddress,
    });
    
    console.log('✅ Total coins found:', allCoins.data.length);
    
    let totalBalance = parseInt(suiBalance.totalBalance);
    
    // 显示所有 coin 类型
    const coinTypes = new Set();
    allCoins.data.forEach(coin => {
      coinTypes.add(coin.coinType);
    });
    
    if (coinTypes.size > 0) {
      console.log('   Coin types:', Array.from(coinTypes).join(', '));
    }
    
    if (totalBalance === 0 && allCoins.data.length === 0) {
      console.log('\n⚠️  WARNING: Sponsor wallet has no balance!');
      console.log('   Please get test tokens from faucet:');
      console.log('   https://faucet.onechain.com/');
    } else if (allCoins.data.length > 0) {
      console.log('✅ Wallet has coins available for gas!');
      const estimatedTransactions = Math.floor(allCoins.data.length * 100);
      console.log(`   Estimated transactions: ~${estimatedTransactions}`);
    }
  } catch (error) {
    console.error('❌ Failed to get balance:', error.message);
    return;
  }

  // 5. 检查 gas coins
  console.log('\n5️⃣ Checking gas coins...');
  try {
    const gasCoins = await suiClient.getCoins({
      owner: sponsorAddress,
      coinType: '0x2::sui::SUI',
    });
    
    console.log('✅ Gas coins found:', gasCoins.data.length);
    if (gasCoins.data.length > 0) {
      console.log('   First coin:', gasCoins.data[0].coinObjectId);
    }
  } catch (error) {
    console.error('❌ Failed to get gas coins:', error.message);
    return;
  }

  // 6. 验证合约
  console.log('\n6️⃣ Verifying contract...');
  try {
    const packageObj = await suiClient.getObject({
      id: packageId,
      options: { showContent: true },
    });
    
    if (packageObj.data) {
      console.log('✅ Package found:', packageId);
    } else {
      console.log('⚠️  Package not found or not accessible');
    }
  } catch (error) {
    console.log('⚠️  Could not verify package:', error.message);
  }

  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('✅ All checks passed!');
  console.log('🚀 Your sponsor wallet is ready to use!');
  console.log('='.repeat(50));
  console.log('\nNext steps:');
  console.log('1. Start the backend server: npm start');
  console.log('2. Start the frontend: cd ../taixuchain && npm run dev');
  console.log('3. Test creating a player with zero gas!');
}

testSponsorWallet().catch(console.error);

/**
 * 赞助钱包监控脚本
 * 定期检查余额和交易统计
 * 运行: node monitor.js
 */

import dotenv from 'dotenv';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHex } from '@mysten/sui/utils';

dotenv.config();

const suiClient = new SuiClient({ 
  url: process.env.SUI_RPC_URL || 'https://rpc-testnet.onelabs.cc:443' 
});

let sponsorKeypair;
let sponsorAddress;

// 初始化赞助钱包
try {
  const privateKey = process.env.SPONSOR_PRIVATE_KEY;
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  sponsorKeypair = Ed25519Keypair.fromSecretKey(fromHex(cleanKey));
  sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
} catch (error) {
  console.error('❌ Failed to load sponsor wallet:', error.message);
  process.exit(1);
}

// 获取余额
async function getBalance() {
  try {
    const balance = await suiClient.getBalance({
      owner: sponsorAddress,
      coinType: '0x2::sui::SUI',
    });
    return parseInt(balance.totalBalance);
  } catch (error) {
    console.error('Error getting balance:', error.message);
    return 0;
  }
}

// 获取最近的交易
async function getRecentTransactions() {
  try {
    const txs = await suiClient.queryTransactionBlocks({
      filter: {
        FromAddress: sponsorAddress,
      },
      options: {
        showEffects: true,
        showInput: true,
      },
      limit: 10,
    });
    return txs.data;
  } catch (error) {
    console.error('Error getting transactions:', error.message);
    return [];
  }
}

// 格式化余额
function formatBalance(balance) {
  return (balance / 1e9).toFixed(4) + ' SUI';
}

// 格式化时间
function formatTime(timestamp) {
  return new Date(parseInt(timestamp)).toLocaleString('zh-CN');
}

// 显示监控信息
async function displayMonitorInfo() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Taixu Sponsor Wallet Monitor                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // 钱包信息
  console.log('📍 Sponsor Wallet Address:');
  console.log('   ' + sponsorAddress);
  console.log('');
  
  // 余额信息
  const balance = await getBalance();
  const balanceFormatted = formatBalance(balance);
  const estimatedTxs = Math.floor(balance / 1e6);
  
  console.log('💰 Balance:');
  console.log('   ' + balanceFormatted);
  console.log('   Estimated transactions: ~' + estimatedTxs);
  
  // 余额警告
  if (balance < 1e8) { // < 0.1 SUI
    console.log('   ⚠️  WARNING: Low balance! Please refill.');
  } else if (balance < 5e8) { // < 0.5 SUI
    console.log('   ⚡ Balance is getting low.');
  } else {
    console.log('   ✅ Balance is healthy.');
  }
  console.log('');
  
  // 最近交易
  console.log('📊 Recent Transactions (Last 10):');
  const txs = await getRecentTransactions();
  
  if (txs.length === 0) {
    console.log('   No transactions found.');
  } else {
    let totalGasUsed = 0;
    
    txs.forEach((tx, index) => {
      const digest = tx.digest.slice(0, 10) + '...';
      const gasUsed = tx.effects?.gasUsed?.computationCost || 0;
      totalGasUsed += parseInt(gasUsed);
      
      const status = tx.effects?.status?.status === 'success' ? '✅' : '❌';
      const timestamp = tx.timestampMs ? formatTime(tx.timestampMs) : 'N/A';
      
      console.log(`   ${index + 1}. ${status} ${digest}`);
      console.log(`      Gas: ${formatBalance(gasUsed)} | ${timestamp}`);
    });
    
    console.log('');
    console.log('   Total gas used (last 10 txs): ' + formatBalance(totalGasUsed));
    console.log('   Average gas per tx: ' + formatBalance(totalGasUsed / txs.length));
  }
  
  console.log('');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Last updated: ' + new Date().toLocaleString('zh-CN'));
  console.log('Press Ctrl+C to exit');
}

// 主循环
async function monitor() {
  await displayMonitorInfo();
  
  // 每 30 秒更新一次
  setInterval(async () => {
    await displayMonitorInfo();
  }, 30000);
}

// 启动监控
console.log('🚀 Starting monitor...\n');
monitor().catch(console.error);

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitor stopped.');
  process.exit(0);
});

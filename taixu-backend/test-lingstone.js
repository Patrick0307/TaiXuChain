import { getLingStoneBalance, sponsorMintLingStone } from './services/sponsorService.js';
import dotenv from 'dotenv';

dotenv.config();

// 测试地址（使用你的测试钱包地址）
const TEST_ADDRESS = '0x0d718270b1e5ef1352c3556df66d6e3b49c1187e13854d46ce68e22e646a8383';

async function testLingStone() {
  try {
    console.log('=== LingStone 功能测试 ===\n');
    
    // 1. 查询余额
    console.log('1️⃣ 查询 LingStone 余额...');
    const balanceBefore = await getLingStoneBalance(TEST_ADDRESS);
    console.log(`   余额: ${balanceBefore} LING\n`);
    
    // 2. 铸造 LingStone
    console.log('2️⃣ 铸造 10000 LingStone...');
    const result = await sponsorMintLingStone(TEST_ADDRESS);
    console.log(`   ✅ 铸造成功!`);
    console.log(`   Transaction: ${result.digest}\n`);
    
    // 3. 再次查询余额
    console.log('3️⃣ 再次查询余额...');
    // 等待 2 秒让交易确认
    await new Promise(resolve => setTimeout(resolve, 2000));
    const balanceAfter = await getLingStoneBalance(TEST_ADDRESS);
    console.log(`   新余额: ${balanceAfter} LING`);
    console.log(`   增加: ${balanceAfter - balanceBefore} LING\n`);
    
    console.log('=== 测试完成 ✅ ===');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误详情:', error.message);
  }
}

testLingStone();

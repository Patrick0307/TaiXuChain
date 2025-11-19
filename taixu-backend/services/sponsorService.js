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

// 武器部署钱包（拥有 WeaponMintCap）
let weaponDeployKeypair;
try {
  const privateKeyHex = process.env.WEAPON_DEPLOY_PRIVATE_KEY;
  if (!privateKeyHex) {
    throw new Error('WEAPON_DEPLOY_PRIVATE_KEY not set in .env file');
  }
  
  const cleanKey = privateKeyHex.startsWith('0x') 
    ? privateKeyHex.slice(2) 
    : privateKeyHex;
  
  weaponDeployKeypair = Ed25519Keypair.fromSecretKey(fromHex(cleanKey));
  const weaponDeployAddress = weaponDeployKeypair.getPublicKey().toSuiAddress();
  console.log(`✅ Weapon deploy wallet loaded: ${weaponDeployAddress}`);
} catch (error) {
  console.error('❌ Failed to load weapon deploy wallet:', error.message);
  console.error('Please set WEAPON_DEPLOY_PRIVATE_KEY in .env file');
  process.exit(1);
}

const PACKAGE_ID = process.env.PACKAGE_ID;
const REGISTRY_ID = process.env.REGISTRY_ID;
const WEAPON_MINT_CAP = process.env.WEAPON_MINT_CAP;

/**
 * 赞助创建角色交易（完全赞助模式）
 * @param {string} playerAddress - 玩家钱包地址
 * @param {string} name - 角色名称
 * @param {number} classId - 职业 ID (1=Mage, 2=Warrior, 3=Archer)
 * @param {object} customization - 角色自定义数据
 */
export async function sponsorCreatePlayer(playerAddress, name, classId, customization) {
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
        // 角色自定义数据
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(customization.gender || 'male'))),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(customization.skinColor || '#ffd4a3'))),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(customization.hairStyle || 'short'))),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(customization.hairColor || '#000000'))),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(customization.clothesStyle || 'default'))),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(customization.clothesColor || '#8b0000'))),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(customization.shoesColor || '#4a4a4a'))),
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
 * 查询玩家是否已有角色
 * @param {string} playerAddress - 玩家钱包地址
 * @returns {Promise<object|null>} 玩家角色信息或 null
 */
export async function getPlayerByAddress(playerAddress) {
  try {
    console.log(`[Query] Checking if player exists: ${playerAddress}`);
    console.log(`[Query] Looking for player type: ${PACKAGE_ID}::player::Player`);
    
    // 查询该地址拥有的所有对象
    const objects = await suiClient.getOwnedObjects({
      owner: playerAddress,
      options: {
        showType: true,
        showContent: true,
      },
    });
    
    console.log(`[Query] Total objects found: ${objects.data.length}`);
    
    // 打印所有对象类型以便调试
    objects.data.forEach((obj, index) => {
      if (obj.data?.type?.includes('::player::Player')) {
        console.log(`[Query] Found Player object ${index}: ${obj.data.type}`);
      }
    });
    
    // 查找 Player 类型的对象（支持新旧版本的 Package ID）
    // 新版本: 0xd249f6f2ecf256b26025e2d8454482e05565b716d5c3ebb6cf5fd24d01f03c9f
    // 旧版本: 0xbf08e952309ce954de4fc8b85eaa791adb2b407e2be10ebf91538f9915badb6e
    const playerObject = objects.data.find(obj => 
      obj.data?.type?.includes('::player::Player')
    );
    
    if (!playerObject) {
      console.log(`[Query] No player found for ${playerAddress}`);
      console.log(`[Query] Searched for type containing: ::player::Player`);
      return null;
    }
    
    console.log(`[Query] Player found with type: ${playerObject.data.type}`);
    
    console.log(`[Query] Player found!`, playerObject.data.objectId);
    
    // 返回玩家信息
    const content = playerObject.data.content.fields;
    return {
      objectId: playerObject.data.objectId,
      name: content.name,
      class: parseInt(content.class),
      level: parseInt(content.level),
      exp: parseInt(content.exp),
      exp_to_next_level: parseInt(content.exp_to_next_level),
      hp: parseInt(content.hp || 0),
      max_hp: parseInt(content.max_hp || 0),
      attack: parseInt(content.attack || 0),
      owner: content.owner,
      customization: {
        gender: content.gender,
        skinColor: content.skin_color,
        hairStyle: content.hair_style,
        hairColor: content.hair_color,
        clothesStyle: content.clothes_style,
        clothesColor: content.clothes_color,
        shoesColor: content.shoes_color,
      },
    };
  } catch (error) {
    console.error('[Query] Error checking player:', error);
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

/**
 * 查询玩家的所有武器
 * @param {string} playerAddress - 玩家钱包地址
 * @returns {Promise<Array>} 武器列表
 */
export async function getAllPlayerWeapons(playerAddress) {
  try {
    console.log(`[Query] Getting all weapons for: ${playerAddress}`);
    
    // 查询该地址拥有的所有对象
    const objects = await suiClient.getOwnedObjects({
      owner: playerAddress,
      options: {
        showType: true,
        showContent: true,
      },
    });
    
    console.log(`[Query] Total objects found: ${objects.data.length}`);
    
    // 查找所有 Weapon 类型的对象（排除 WeaponMintCap）
    const weaponObjects = objects.data.filter(obj => {
      const objType = obj.data?.type;
      return objType && objType.includes('::weapon::Weapon') && !objType.includes('WeaponMintCap');
    });
    
    console.log(`[Query] Found ${weaponObjects.length} weapon(s)`);
    
    if (weaponObjects.length === 0) {
      return [];
    }
    
    // 转换为武器信息数组并按 version 排序（最新的在前）
    const weapons = weaponObjects
      .map(obj => {
        const content = obj.data.content.fields;
        if (!content) return null;
        
        return {
          objectId: obj.data.objectId,
          name: content.name,
          weaponType: parseInt(content.weapon_type),
          attack: parseInt(content.attack),
          level: parseInt(content.level),
          rarity: parseInt(content.rarity),
          owner: content.owner,
          createdAt: parseInt(content.created_at),
          version: parseInt(obj.data.version),
        };
      })
      .filter(weapon => weapon !== null)
      .sort((a, b) => b.version - a.version); // 按 version 降序排序（最新的在前）
    
    console.log(`[Query] Returning ${weapons.length} weapon(s), sorted by version`);
    
    return weapons;
  } catch (error) {
    console.error('[Query] Error getting all weapons:', error);
    throw error;
  }
}

/**
 * 查询玩家的武器（根据职业过滤）
 * @param {string} playerAddress - 玩家钱包地址
 * @param {number} classId - 职业 ID (可选，用于过滤匹配职业的武器)
 * @returns {Promise<object|null>} 武器信息或 null
 */
export async function getPlayerWeapon(playerAddress, classId = null) {
  try {
    console.log(`[Query] Checking weapons for: ${playerAddress}`);
    console.log(`[Query] Looking for weapon type: ${PACKAGE_ID}::weapon::Weapon`);
    
    // 查询该地址拥有的所有对象
    const objects = await suiClient.getOwnedObjects({
      owner: playerAddress,
      options: {
        showType: true,
        showContent: true,
      },
    });
    
    console.log(`[Query] Total objects found: ${objects.data.length}`);
    
    // 打印所有对象类型以便调试
    objects.data.forEach((obj, index) => {
      console.log(`[Query] Object ${index}: ${obj.data?.type || 'no type'}`);
    });
    
    // 查找所有 Weapon 类型的对象（排除 WeaponMintCap）
    const weaponObjects = objects.data.filter(obj => {
      const objType = obj.data?.type;
      const isWeapon = objType && objType.includes('::weapon::Weapon') && !objType.includes('WeaponMintCap');
      console.log(`[Query] Checking object ${obj.data?.objectId}: ${objType} -> isWeapon: ${isWeapon}`);
      return isWeapon;
    });
    
    if (weaponObjects.length === 0) {
      console.log(`[Query] No weapon found for ${playerAddress}`);
      return null;
    }
    
    console.log(`[Query] Found ${weaponObjects.length} weapon(s) total`);
    
    // 如果提供了职业 ID，根据职业过滤武器
    let filteredWeapons = weaponObjects;
    if (classId !== null) {
      // 职业到武器类型的映射
      const classToWeaponType = {
        1: 3, // Mage -> Staff
        2: 1, // Warrior -> Sword
        3: 2, // Archer -> Bow
      };
      
      const expectedWeaponType = classToWeaponType[classId];
      console.log(`[Query] Filtering for class ${classId}, expected weapon type: ${expectedWeaponType}`);
      
      filteredWeapons = weaponObjects.filter(obj => {
        const weaponType = parseInt(obj.data?.content?.fields?.weapon_type);
        const matches = weaponType === expectedWeaponType;
        console.log(`[Query] Weapon ${obj.data?.objectId} type ${weaponType} ${matches ? '✅ matches' : '❌ does not match'}`);
        return matches;
      });
      
      if (filteredWeapons.length === 0) {
        console.log(`[Query] No weapon matching class ${classId} found`);
        return null;
      }
      
      console.log(`[Query] Found ${filteredWeapons.length} weapon(s) matching class ${classId}`);
    }
    
    // 返回最新的武器（version 最大的）
    const weaponObject = filteredWeapons.reduce((latest, current) => {
      const latestVersion = parseInt(latest.data?.version || 0);
      const currentVersion = parseInt(current.data?.version || 0);
      return currentVersion > latestVersion ? current : latest;
    });
    
    if (filteredWeapons.length > 1) {
      console.log(`[Query] Multiple matching weapons found, versions: ${filteredWeapons.map(w => w.data?.version).join(', ')}`);
      console.log(`[Query] Returning weapon with version ${weaponObject.data?.version}`);
    }
    
    console.log(`[Query] Weapon found!`, weaponObject.data.objectId);
    console.log(`[Query] Weapon content:`, JSON.stringify(weaponObject.data.content, null, 2));
    
    // 返回武器信息
    const content = weaponObject.data.content.fields;
    
    // 检查 content 是否存在
    if (!content) {
      console.error(`[Query] Weapon content is missing!`);
      return null;
    }
    
    return {
      objectId: weaponObject.data.objectId,
      name: content.name,
      weaponType: parseInt(content.weapon_type),
      attack: parseInt(content.attack),
      level: parseInt(content.level),
      rarity: parseInt(content.rarity),
      owner: content.owner,
    };
  } catch (error) {
    console.error('[Query] Error checking weapon:', error);
    console.error('[Query] Error details:', error.message);
    throw error;
  }
}

/**
 * 赞助铸造武器（根据职业自动选择武器类型）
 * @param {string} playerAddress - 玩家钱包地址
 * @param {number} classId - 职业 ID (1=Mage, 2=Warrior, 3=Archer)
 */
export async function sponsorMintWeapon(playerAddress, classId) {
  try {
    const weaponDeployAddress = weaponDeployKeypair.getPublicKey().toSuiAddress();
    
    // 根据职业确定武器类型（与 Move 合约中的 CLASS 常量对应）
    // 1=Mage -> Staff(3), 2=Warrior -> Sword(1), 3=Archer -> Bow(2)
    const weaponTypeMap = {
      1: 3, // Mage -> Staff
      2: 1, // Warrior -> Sword
      3: 2, // Archer -> Bow
    };
    
    const weaponType = weaponTypeMap[classId];
    if (!weaponType) {
      throw new Error(`Invalid class ID: ${classId}`);
    }
    
    const rarity = 1; // 普通品质
    
    console.log(`[Sponsor] Minting weapon for ${playerAddress}`);
    console.log(`  Class: ${classId}, Weapon Type: ${weaponType}, Rarity: ${rarity}`);
    console.log(`  Using weapon deploy wallet: ${weaponDeployAddress}`);
    
    // 获取 gas coins（使用武器部署钱包）
    const allCoins = await suiClient.getAllCoins({
      owner: weaponDeployAddress,
    });
    
    let gasCoins = allCoins.data.filter(coin => 
      coin.coinType === '0x2::sui::SUI' || 
      coin.coinType === '0x2::oct::OCT' ||
      coin.coinType.endsWith('::sui::SUI') ||
      coin.coinType.endsWith('::oct::OCT')
    );
    
    if (!gasCoins || gasCoins.length === 0) {
      throw new Error('Weapon deploy wallet has no gas coins');
    }
    
    console.log(`[Sponsor] Found ${gasCoins.length} gas coins`);
    
    // 创建交易（使用武器部署钱包作为 sender）
    const tx = new Transaction();
    tx.setSender(weaponDeployAddress);
    
    tx.setGasPayment(gasCoins.slice(0, 5).map(coin => ({
      objectId: coin.coinObjectId,
      version: coin.version,
      digest: coin.digest,
    })));
    
    // 调用 mint_weapon 函数
    tx.moveCall({
      target: `${PACKAGE_ID}::weapon::mint_weapon`,
      arguments: [
        tx.object(WEAPON_MINT_CAP),
        tx.pure.u8(weaponType),
        tx.pure.u8(rarity),
        tx.pure.address(playerAddress),
      ],
    });
    
    console.log(`[Sponsor] Signing and executing weapon mint transaction...`);
    
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: weaponDeployKeypair,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    
    console.log(`[Sponsor] ✅ Weapon minted successfully!`);
    console.log(`  Digest: ${result.digest}`);
    
    return result;
  } catch (error) {
    console.error('[Sponsor] ❌ Weapon mint failed:', error);
    throw error;
  }
}

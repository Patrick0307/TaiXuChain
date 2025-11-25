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
const LINGSTONE_PACKAGE_ID = process.env.LINGSTONE_PACKAGE_ID;
const LINGSTONE_TREASURY_CAP = process.env.LINGSTONE_TREASURY_CAP;

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
 * 查询玩家是否已有角色（只查询当前 PACKAGE_ID 版本的角色）
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
    
    // 打印所有 Player 对象类型以便调试
    const allPlayerObjects = objects.data.filter(obj => 
      obj.data?.type?.includes('::player::Player')
    );
    
    allPlayerObjects.forEach((obj, index) => {
      const isCurrentVersion = obj.data.type.includes(PACKAGE_ID);
      console.log(`[Query] Found Player object ${index}: ${obj.data.type}`);
      console.log(`[Query]   -> ${isCurrentVersion ? '✅ Current version' : '⚠️ Old version (will be ignored)'}`);
    });
    
    // 只查找当前 PACKAGE_ID 版本的 Player 对象
    // 这样升级合约后，玩家需要重新创建角色
    const playerObject = objects.data.find(obj => {
      const objType = obj.data?.type;
      if (!objType || !objType.includes('::player::Player')) {
        return false;
      }
      // 检查是否是当前 package 的角色
      const isCurrentPackage = objType.includes(PACKAGE_ID);
      return isCurrentPackage;
    });
    
    if (!playerObject) {
      console.log(`[Query] No player found for ${playerAddress} with current PACKAGE_ID`);
      console.log(`[Query] Current PACKAGE_ID: ${PACKAGE_ID}`);
      if (allPlayerObjects.length > 0) {
        console.log(`[Query] ⚠️ Found ${allPlayerObjects.length} old version player(s), but they are ignored`);
      }
      return null;
    }
    
    console.log(`[Query] ✅ Player found with current version!`);
    console.log(`[Query] Player type: ${playerObject.data.type}`);
    console.log(`[Query] Player ID: ${playerObject.data.objectId}`);
    
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
      packageId: PACKAGE_ID, // 添加 package ID 信息
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
 * 通过 objectId 查询武器
 * @param {string} objectId - 武器对象 ID
 * @returns {Promise<object|null>} 武器信息或 null
 */
export async function getWeaponById(objectId) {
  try {
    console.log(`[Query] Getting weapon by ID: ${objectId}`);
    
    const weaponObject = await suiClient.getObject({
      id: objectId,
      options: {
        showType: true,
        showContent: true,
      },
    });
    
    if (!weaponObject.data) {
      console.log(`[Query] Weapon not found: ${objectId}`);
      return null;
    }
    
    const objType = weaponObject.data.type;
    if (!objType || !objType.includes('::weapon::Weapon') || objType.includes('WeaponMintCap')) {
      console.log(`[Query] Object is not a weapon: ${objType}`);
      return null;
    }
    
    const content = weaponObject.data.content.fields;
    if (!content) {
      console.log(`[Query] Weapon has no content`);
      return null;
    }
    
    const weapon = {
      objectId: weaponObject.data.objectId,
      name: content.name,
      weaponType: parseInt(content.weapon_type),
      attack: parseInt(content.attack),
      level: parseInt(content.level),
      rarity: parseInt(content.rarity),
      owner: content.owner,
      createdAt: parseInt(content.created_at),
      version: parseInt(weaponObject.data.version),
    };
    
    console.log(`[Query] Weapon found:`, weapon);
    return weapon;
  } catch (error) {
    console.error('[Query] Error getting weapon by ID:', error);
    return null;
  }
}

/**
 * 查询玩家的所有武器（只返回当前 package 版本的武器）
 * @param {string} playerAddress - 玩家钱包地址
 * @returns {Promise<Array>} 武器列表
 */
export async function getAllPlayerWeapons(playerAddress) {
  try {
    console.log(`[Query] Getting all weapons for: ${playerAddress}`);
    console.log(`[Query] Current PACKAGE_ID: ${PACKAGE_ID}`);
    
    // 查询该地址拥有的所有对象（支持分页）
    let allObjects = [];
    let hasNextPage = true;
    let cursor = null;
    
    while (hasNextPage) {
      const response = await suiClient.getOwnedObjects({
        owner: playerAddress,
        options: {
          showType: true,
          showContent: true,
        },
        cursor,
        limit: 50, // 每页50个对象
      });
      
      allObjects = allObjects.concat(response.data);
      hasNextPage = response.hasNextPage;
      cursor = response.nextCursor;
      
      console.log(`[Query] Fetched ${response.data.length} objects, hasNextPage: ${hasNextPage}`);
    }
    
    console.log(`[Query] Total objects found: ${allObjects.length}`);
    
    // 查找所有 Weapon 类型的对象（排除 WeaponMintCap）
    // 并且只保留当前 PACKAGE_ID 的武器
    const weaponObjects = allObjects.filter(obj => {
      const objType = obj.data?.type;
      if (!objType || !objType.includes('::weapon::Weapon') || objType.includes('WeaponMintCap')) {
        return false;
      }
      
      // 检查是否是当前 package 的武器
      // 类型格式: 0x<package_id>::weapon::Weapon
      const isCurrentPackage = objType.includes(PACKAGE_ID);
      
      if (!isCurrentPackage) {
        console.log(`[Query] Skipping weapon from old package: ${objType}`);
      }
      
      return isCurrentPackage;
    });
    
    console.log(`[Query] Found ${weaponObjects.length} weapon(s) from current package (${PACKAGE_ID})`);
    
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
          packageId: PACKAGE_ID, // 添加 package ID 信息
        };
      })
      .filter(weapon => weapon !== null)
      .sort((a, b) => b.version - a.version); // 按 version 降序排序（最新的在前）
    
    console.log(`[Query] Returning ${weapons.length} weapon(s) from current package, sorted by version`);
    
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

/**
 * 赞助铸造随机武器（随机职业、武器类型、品质）
 * @param {string} playerAddress - 玩家钱包地址
 * @returns {Promise<object>} 交易结果和武器信息
 */
export async function sponsorMintRandomWeapon(playerAddress) {
  try {
    const weaponDeployAddress = weaponDeployKeypair.getPublicKey().toSuiAddress();
    
    // 随机生成武器类型 (1=剑, 2=弓, 3=法杖)
    const weaponType = Math.floor(Math.random() * 3) + 1;
    
    // 随机生成品质 (1=普通 70%, 2=稀有 25%, 3=史诗 5%)
    const rarityRoll = Math.random();
    let rarity;
    if (rarityRoll < 0.70) {
      rarity = 1; // 普通 70%
    } else if (rarityRoll < 0.95) {
      rarity = 2; // 稀有 25%
    } else {
      rarity = 3; // 史诗 5%
    }
    
    console.log(`[Sponsor] Minting RANDOM weapon for ${playerAddress}`);
    console.log(`  🎲 Random Weapon Type: ${weaponType} (1=剑, 2=弓, 3=法杖)`);
    console.log(`  🎲 Random Rarity: ${rarity} (1=普通, 2=稀有, 3=史诗)`);
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
    
    console.log(`[Sponsor] Signing and executing random weapon mint transaction...`);
    
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: weaponDeployKeypair,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    
    console.log(`[Sponsor] ✅ Random weapon minted successfully!`);
    console.log(`  Digest: ${result.digest}`);
    
    // 提取新创建的武器 objectId
    let weaponObjectId = null;
    if (result.objectChanges) {
      const createdWeapon = result.objectChanges.find(
        change => change.type === 'created' && 
        change.objectType && 
        change.objectType.includes('::weapon::Weapon')
      );
      if (createdWeapon) {
        weaponObjectId = createdWeapon.objectId;
        console.log(`  Weapon Object ID: ${weaponObjectId}`);
      }
    }
    
    // 返回交易结果和武器信息
    return {
      result,
      weaponInfo: {
        weaponType,
        rarity,
        objectId: weaponObjectId
      }
    };
  } catch (error) {
    console.error('[Sponsor] ❌ Random weapon mint failed:', error);
    throw error;
  }
}

/**
 * 获取 LingStone 余额
 * @param {string} walletAddress - 钱包地址
 * @returns {Promise<number>} LingStone 余额（已转换为可读格式）
 */
export async function getLingStoneBalance(walletAddress) {
  try {
    console.log(`[Query] Getting LingStone balance for: ${walletAddress}`);
    
    // 获取该地址的所有 LingStone coins
    const coins = await suiClient.getAllCoins({
      owner: walletAddress,
    });
    
    // 过滤出 LingStone 代币（只计算当前版本）
    const correctVersionType = `${PACKAGE_ID}::lingstone_coin::LINGSTONE_COIN`;
    const lingStoneCoins = coins.data.filter(coin => 
      coin.coinType === correctVersionType
    );
    
    if (lingStoneCoins.length === 0) {
      console.log(`[Query] No LingStone found for ${walletAddress} (version: ${PACKAGE_ID})`);
      return 0;
    }
    
    // 计算总余额（单位：最小单位）
    const totalBalance = lingStoneCoins.reduce((sum, coin) => {
      return sum + BigInt(coin.balance);
    }, BigInt(0));
    
    // 转换为可读格式（除以 10^9）
    const readableBalance = Number(totalBalance) / 1e9;
    
    console.log(`[Query] LingStone balance: ${readableBalance} LING (${totalBalance} raw)`);
    
    return readableBalance;
  } catch (error) {
    console.error('[Query] Error getting LingStone balance:', error);
    throw error;
  }
}

/**
 * 赞助铸造 LingStone（给玩家发送 10000 LING）
 * @param {string} playerAddress - 玩家钱包地址
 * @returns {Promise<object>} 交易结果
 */
export async function sponsorMintLingStone(playerAddress) {
  try {
    const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
    
    console.log(`[Sponsor] Minting LingStone for ${playerAddress}`);
    console.log(`  Amount: 10000 LING`);
    console.log(`  Using sponsor wallet: ${sponsorAddress}`);
    
    // 检查 sponsor 是否拥有 TreasuryCap
    console.log(`[Sponsor] Checking TreasuryCap ownership...`);
    
    let treasuryCapObject;
    try {
      treasuryCapObject = await suiClient.getObject({
        id: LINGSTONE_TREASURY_CAP,
        options: {
          showOwner: true,
          showType: true,
        },
      });
      
      const owner = treasuryCapObject.data?.owner;
      console.log(`[Sponsor] TreasuryCap owner:`, owner);
      
      // 检查 owner 是否是 sponsor 地址
      if (owner?.AddressOwner !== sponsorAddress) {
        const currentOwner = owner?.AddressOwner;
        console.log(`[Sponsor] ⚠️ TreasuryCap not owned by sponsor`);
        console.log(`[Sponsor] Current owner: ${currentOwner}`);
        console.log(`[Sponsor] Expected owner: ${sponsorAddress}`);
        
        // 检查是否被 weapon deploy 钱包拥有
        const weaponDeployAddress = weaponDeployKeypair.getPublicKey().toSuiAddress();
        
        if (currentOwner === weaponDeployAddress) {
          console.log(`[Sponsor] TreasuryCap owned by weapon deploy wallet, transferring to sponsor...`);
          await transferTreasuryCapToSponsor();
          console.log(`[Sponsor] ✅ TreasuryCap transferred successfully`);
        } else {
          // TreasuryCap 被其他地址拥有，无法自动转移
          throw new Error(
            `TreasuryCap is owned by ${currentOwner}, but sponsor is ${sponsorAddress}. ` +
            `Please run 'node transfer-treasury-cap.js' to transfer ownership manually. ` +
            `Make sure to set the correct private key in WEAPON_DEPLOY_PRIVATE_KEY environment variable.`
          );
        }
      } else {
        console.log(`[Sponsor] ✅ TreasuryCap is owned by sponsor`);
      }
    } catch (error) {
      console.error(`[Sponsor] Error checking TreasuryCap:`, error);
      throw new Error(`Failed to verify TreasuryCap ownership: ${error.message}`);
    }
    
    // 获取 gas coins（使用 sponsor 钱包）
    const allCoins = await suiClient.getAllCoins({
      owner: sponsorAddress,
    });
    
    let gasCoins = allCoins.data.filter(coin => 
      coin.coinType === '0x2::sui::SUI' || 
      coin.coinType === '0x2::oct::OCT' ||
      coin.coinType.endsWith('::sui::SUI') ||
      coin.coinType.endsWith('::oct::OCT')
    );
    
    if (!gasCoins || gasCoins.length === 0) {
      throw new Error('Sponsor wallet has no gas coins');
    }
    
    console.log(`[Sponsor] Found ${gasCoins.length} gas coins`);
    
    // 创建交易（使用 sponsor 钱包作为 sender）
    const tx = new Transaction();
    tx.setSender(sponsorAddress);
    
    tx.setGasPayment(gasCoins.slice(0, 5).map(coin => ({
      objectId: coin.coinObjectId,
      version: coin.version,
      digest: coin.digest,
    })));
    
    // 铸造 10000 LING (需要乘以 10^9)
    const amount = 10000 * 1e9;
    
    // 调用 mint 函数
    tx.moveCall({
      target: `${LINGSTONE_PACKAGE_ID}::lingstone_coin::mint`,
      arguments: [
        tx.object(LINGSTONE_TREASURY_CAP),
        tx.pure.u64(amount),
        tx.pure.address(playerAddress),
      ],
    });
    
    console.log(`[Sponsor] Signing and executing LingStone mint transaction...`);
    
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: sponsorKeypair,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    
    console.log(`[Sponsor] ✅ LingStone minted successfully!`);
    console.log(`  Digest: ${result.digest}`);
    console.log(`  Amount: 10000 LING sent to ${playerAddress}`);
    
    return result;
  } catch (error) {
    console.error('[Sponsor] ❌ LingStone mint failed:', error);
    throw error;
  }
}

/**
 * 将 TreasuryCap 转移给 sponsor 钱包
 * @returns {Promise<object>} 交易结果
 */
async function transferTreasuryCapToSponsor() {
  try {
    const weaponDeployAddress = weaponDeployKeypair.getPublicKey().toSuiAddress();
    const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
    
    console.log(`[Transfer] Transferring TreasuryCap from ${weaponDeployAddress} to ${sponsorAddress}`);
    
    // 获取 gas coins（使用 weapon deploy 钱包）
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
    
    // 创建交易
    const tx = new Transaction();
    tx.setSender(weaponDeployAddress);
    
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
    
    console.log(`[Transfer] Signing and executing transfer transaction...`);
    
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: weaponDeployKeypair,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    
    console.log(`[Transfer] ✅ TreasuryCap transferred successfully!`);
    console.log(`  Digest: ${result.digest}`);
    
    return result;
  } catch (error) {
    console.error('[Transfer] ❌ TreasuryCap transfer failed:', error);
    throw error;
  }
}

/**
 * 赞助销毁武器（玩家丢弃武器）
 * @param {string} weaponObjectId - 武器对象 ID
 * @returns {Promise<object>} 交易结果
 */
export async function sponsorBurnWeapon(weaponObjectId) {
  try {
    const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();
    
    console.log(`[Sponsor] Burning weapon: ${weaponObjectId}`);
    console.log(`  Using sponsor wallet: ${sponsorAddress}`);
    
    // 获取 gas coins（使用 sponsor 钱包）
    const allCoins = await suiClient.getAllCoins({
      owner: sponsorAddress,
    });
    
    let gasCoins = allCoins.data.filter(coin => 
      coin.coinType === '0x2::sui::SUI' || 
      coin.coinType === '0x2::oct::OCT' ||
      coin.coinType.endsWith('::sui::SUI') ||
      coin.coinType.endsWith('::oct::OCT')
    );
    
    if (!gasCoins || gasCoins.length === 0) {
      throw new Error('Sponsor wallet has no gas coins');
    }
    
    console.log(`[Sponsor] Found ${gasCoins.length} gas coins`);
    
    // 创建交易（使用 sponsor 钱包作为 sender）
    const tx = new Transaction();
    tx.setSender(sponsorAddress);
    
    tx.setGasPayment(gasCoins.slice(0, 5).map(coin => ({
      objectId: coin.coinObjectId,
      version: coin.version,
      digest: coin.digest,
    })));
    
    // 调用 burn_weapon_by_player 函数
    tx.moveCall({
      target: `${PACKAGE_ID}::weapon::burn_weapon_by_player`,
      arguments: [
        tx.object(weaponObjectId),
      ],
    });
    
    console.log(`[Sponsor] Signing and executing weapon burn transaction...`);
    
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: sponsorKeypair,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    
    console.log(`[Sponsor] ✅ Weapon burned successfully!`);
    console.log(`  Digest: ${result.digest}`);
    
    return result;
  } catch (error) {
    console.error('[Sponsor] ❌ Weapon burn failed:', error);
    throw error;
  }
}

/**
 * 赞助合成武器（铸造升级后的武器）
 * @param {string} playerAddress - 玩家钱包地址
 * @param {number} weaponType - 武器类型
 * @param {number} rarity - 稀有度
 * @param {number} newLevel - 新武器等级
 * @returns {Promise<object>} 交易结果
 */
export async function sponsorMergeWeapon(playerAddress, weaponType, rarity, newLevel) {
  try {
    const weaponDeployAddress = weaponDeployKeypair.getPublicKey().toSuiAddress();
    
    console.log(`[Sponsor] Merging weapons for ${playerAddress}`);
    console.log(`  Weapon Type: ${weaponType}, Rarity: ${rarity}, New Level: ${newLevel}`);
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
    
    // 调用 mint_weapon_with_level 函数铸造指定等级的新武器
    console.log(`[Sponsor] Minting weapon with level ${newLevel}...`);
    tx.moveCall({
      target: `${PACKAGE_ID}::weapon::mint_weapon_with_level`,
      arguments: [
        tx.object(WEAPON_MINT_CAP),
        tx.pure.u8(weaponType),
        tx.pure.u8(rarity),
        tx.pure.u64(newLevel),
        tx.pure.address(playerAddress),
      ],
    });
    
    console.log(`[Sponsor] Signing and executing weapon merge transaction...`);
    
    const result = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: weaponDeployKeypair,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    
    console.log(`[Sponsor] ✅ Weapon merged successfully!`);
    console.log(`  Digest: ${result.digest}`);
    
    // 提取新创建的武器 objectId
    let weaponObjectId = null;
    if (result.objectChanges) {
      const createdWeapon = result.objectChanges.find(
        change => change.type === 'created' && 
        change.objectType && 
        change.objectType.includes('::weapon::Weapon')
      );
      if (createdWeapon) {
        weaponObjectId = createdWeapon.objectId;
        console.log(`  New Weapon Object ID: ${weaponObjectId}`);
      }
    }
    
    return {
      result,
      weaponObjectId
    };
  } catch (error) {
    console.error('[Sponsor] ❌ Weapon merge failed:', error);
    throw error;
  }
}

/**
 * 获取 LingStone coin 对象列表
 * @param {string} walletAddress - 钱包地址
 * @returns {Promise<Array>} LingStone coin 对象列表
 */
export async function getLingStoneCoins(walletAddress) {
  try {
    console.log(`[Query] Getting LingStone coins for: ${walletAddress}`);
    
    // 获取该地址的所有 LingStone coins
    const coins = await suiClient.getAllCoins({
      owner: walletAddress,
    });
    
    // 过滤出 LingStone 代币（只返回当前版本）
    const correctVersionType = `${PACKAGE_ID}::lingstone_coin::LINGSTONE_COIN`;
    const lingStoneCoins = coins.data.filter(coin => 
      coin.coinType === correctVersionType
    );
    
    if (lingStoneCoins.length === 0) {
      console.log(`[Query] No LingStone coins found for ${walletAddress} (version: ${PACKAGE_ID})`);
      return [];
    }
    
    // 转换为前端需要的格式
    const coinList = lingStoneCoins.map(coin => ({
      coinObjectId: coin.coinObjectId,
      balance: parseInt(coin.balance),
      version: coin.version,
      digest: coin.digest,
      coinType: coin.coinType, // 添加 coinType 用于版本检查
    }));
    
    console.log(`[Query] Found ${coinList.length} LingStone coin(s)`);
    
    return coinList;
  } catch (error) {
    console.error('[Query] Error getting LingStone coins:', error);
    throw error;
  }
}

// ========== 市场相关函数 ==========

const MARKETPLACE_ID = process.env.MARKETPLACE_ID;

/**
 * 查询 WeaponSold 事件
 * @param {string} rpcUrl - RPC URL
 * @returns {Promise<Array>} 售出事件列表
 */
async function querySoldEvents(rpcUrl) {
  try {
    const eventType = `${PACKAGE_ID}::marketplace::WeaponSold`;
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'suix_queryEvents',
        params: [
          {
            MoveEventType: eventType
          },
          null,
          100,
          true
        ]
      })
    });
    
    const data = await response.json();
    return data.result?.data || [];
  } catch (error) {
    console.error(`[Query] Error querying sold events:`, error.message);
    return [];
  }
}

/**
 * 查询 ListingCancelled 事件
 * @param {string} rpcUrl - RPC URL
 * @returns {Promise<Array>} 取消事件列表
 */
async function queryCancelledEvents(rpcUrl) {
  try {
    const eventType = `${PACKAGE_ID}::marketplace::ListingCancelled`;
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'suix_queryEvents',
        params: [
          {
            MoveEventType: eventType
          },
          null,
          100,
          true
        ]
      })
    });
    
    const data = await response.json();
    return data.result?.data || [];
  } catch (error) {
    console.error(`[Query] Error querying cancelled events:`, error.message);
    return [];
  }
}

/**
 * 获取所有市场挂单
 * @returns {Promise<Array>} 挂单列表
 */
export async function getAllMarketplaceListings() {
  try {
    console.log(`[Query] Getting all marketplace listings`);
    console.log(`[Query] Marketplace ID: ${MARKETPLACE_ID}`);
    console.log(`[Query] Package ID: ${PACKAGE_ID}`);
    
    if (!MARKETPLACE_ID) {
      console.error(`[Query] MARKETPLACE_ID is not configured!`);
      return [];
    }
    
    // 获取 Marketplace 对象
    const marketplaceObject = await suiClient.getObject({
      id: MARKETPLACE_ID,
      options: {
        showContent: true,
      },
    });
    
    if (!marketplaceObject.data) {
      console.log(`[Query] Marketplace not found`);
      return [];
    }
    
    console.log(`[Query] Marketplace object:`, JSON.stringify(marketplaceObject.data, null, 2));
    
    const content = marketplaceObject.data.content.fields;
    const totalListings = parseInt(content.total_listings);
    
    console.log(`[Query] Total listings: ${totalListings}`);
    
    if (totalListings === 0) {
      console.log(`[Query] No listings in marketplace, returning empty array`);
      return [];
    }
    
    // 使用事件查询来获取市场挂单
    console.log(`[Query] Querying WeaponListed events...`);
    
    const listings = [];
    
    try {
      const rpcUrl = process.env.SUI_RPC_URL || 'https://rpc-testnet.onelabs.cc:443';
      const eventType = `${PACKAGE_ID}::marketplace::WeaponListed`;
      
      console.log(`[Query] RPC URL: ${rpcUrl}`);
      console.log(`[Query] Event type: ${eventType}`);
      
      // 查询 WeaponListed 事件
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_queryEvents',
          params: [
            {
              MoveEventType: eventType
            },
            null,  // cursor
            100,   // limit
            true   // descending order (newest first)
          ]
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error(`[Query] RPC error:`, data.error);
        console.log(`[Query] Returning empty array`);
        return [];
      }
      
      const events = data.result?.data || [];
      console.log(`[Query] Found ${events.length} WeaponListed event(s)`);
      
      // 查询 WeaponSold 和 ListingCancelled 事件来过滤已售出或取消的挂单
      const soldEvents = await querySoldEvents(rpcUrl);
      const cancelledEvents = await queryCancelledEvents(rpcUrl);
      
      // 策略：
      // 1. 对于每个 weapon_id，只保留最新的上架记录
      // 2. 检查该上架记录之后是否有售出或取消事件
      // 3. 使用事件时间戳（timestamp）而不是 epoch，因为多个事件可能在同一个 epoch
      
      // 首先，按 weapon_id 分组，找到每个武器的最新上架记录
      const latestListings = new Map(); // weapon_id -> latest listing event
      
      for (const event of events) {
        const listing = event.parsedJson;
        const weaponId = listing.weapon_id;
        const timestamp = event.timestampMs || event.timestamp;
        
        if (!latestListings.has(weaponId)) {
          latestListings.set(weaponId, { event, timestamp });
        } else {
          const current = latestListings.get(weaponId);
          const currentTimestamp = current.timestamp;
          
          // 比较时间戳，保留最新的
          if (timestamp > currentTimestamp) {
            latestListings.set(weaponId, { event, timestamp });
          }
        }
      }
      
      console.log(`[Query] Found ${latestListings.size} unique weapon(s) with latest listings`);
      
      // 创建 weapon_id -> 所有售出事件的映射（包含时间戳）
      const soldWeaponEvents = new Map();
      soldEvents.forEach(e => {
        const weaponId = e.parsedJson.weapon_id;
        const timestamp = e.timestampMs || e.timestamp;
        if (!soldWeaponEvents.has(weaponId)) {
          soldWeaponEvents.set(weaponId, []);
        }
        soldWeaponEvents.get(weaponId).push({ timestamp, event: e });
      });
      
      // 创建 weapon_id -> 所有取消事件的映射（包含时间戳）
      const cancelledWeaponEvents = new Map();
      cancelledEvents.forEach(e => {
        const weaponId = e.parsedJson.weapon_id;
        const timestamp = e.timestampMs || e.timestamp;
        if (!cancelledWeaponEvents.has(weaponId)) {
          cancelledWeaponEvents.set(weaponId, []);
        }
        cancelledWeaponEvents.get(weaponId).push({ timestamp, event: e });
      });
      
      console.log(`[Query] Found ${soldWeaponEvents.size} weapon(s) with sold events`);
      console.log(`[Query] Found ${cancelledWeaponEvents.size} weapon(s) with cancelled events`);
      
      // 处理每个最新的上架记录
      for (const [weaponId, { event, timestamp: listingTimestamp }] of latestListings) {
        try {
          const listing = event.parsedJson;
          
          // 检查是否在上架后被售出（找到任何一个售出时间戳 > 上架时间戳）
          const soldEventsForWeapon = soldWeaponEvents.get(weaponId) || [];
          const wasSoldAfterListing = soldEventsForWeapon.some(({ timestamp }) => timestamp > listingTimestamp);
          
          if (wasSoldAfterListing) {
            console.log(`[Query] Skipping weapon ${weaponId} (sold after listing)`);
            continue;
          }
          
          // 检查是否在上架后被取消（找到任何一个取消时间戳 > 上架时间戳）
          const cancelledEventsForWeapon = cancelledWeaponEvents.get(weaponId) || [];
          const wasCancelledAfterListing = cancelledEventsForWeapon.some(({ timestamp }) => timestamp > listingTimestamp);
          
          if (wasCancelledAfterListing) {
            console.log(`[Query] Skipping weapon ${weaponId} (cancelled after listing)`);
            continue;
          }
          
          // 将 weapon_name 从 bytes 转换为字符串
          let weaponName = listing.weapon_name;
          if (Array.isArray(weaponName)) {
            weaponName = Buffer.from(weaponName).toString('utf8');
          }
          
          const listingData = {
            escrowedObjectId: listing.escrowed_id,
            weaponId: listing.weapon_id,
            seller: listing.seller,
            price: parseInt(listing.price),
            weapon: {
              objectId: listing.weapon_id,
              name: weaponName,
              weaponType: parseInt(listing.weapon_type),
              attack: parseInt(listing.weapon_attack),
              level: parseInt(listing.weapon_level),
              rarity: parseInt(listing.weapon_rarity),
            },
            listedAt: parseInt(listing.listed_at),
          };
          
          listings.push(listingData);
        } catch (error) {
          console.error(`[Query] Error processing event:`, error.message);
        }
      }
    } catch (error) {
      console.error(`[Query] Error querying events:`, error.message);
    }
    
    console.log(`[Query] Returning ${listings.length} listing(s)`);
    
    return listings;
  } catch (error) {
    console.error('[Query] Error getting marketplace listings:', error);
    throw error;
  }
}

/**
 * 获取单个挂单详情
 * @param {string} weaponId - 武器 ID
 * @returns {Promise<object|null>} 挂单详情或 null
 */
export async function getMarketplaceListing(weaponId) {
  try {
    console.log(`[Query] Getting listing for weapon: ${weaponId}`);
    console.log(`[Query] ⚠️ Warning: Cannot fetch listing details without indexer service`);
    
    // 由于 Sui SDK 限制，我们无法直接查询 shared objects
    // 返回 null 表示未找到
    return null;
  } catch (error) {
    console.error('[Query] Error getting marketplace listing:', error);
    throw error;
  }
}

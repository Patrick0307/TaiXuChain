# 武器系统操作指南 - Weapon System Operations Guide

## 功能概述 - Features Overview

### 1. 武器属性 - Weapon Properties
- **id**: 唯一标识符
- **name**: 武器名称
- **weapon_type**: 武器类型 (1=剑, 2=弓, 3=法杖)
- **attack**: 攻击力
- **level**: 等级 (1-100)
- **rarity**: 稀有度 (1=普通, 2=稀有, 3=史诗)
- **created_at**: 创建时间
- **owner**: 拥有者地址

### 2. 武器掉落几率 - Drop Rates
- 普通品质 (Common): 80%
- 稀有品质 (Rare): 15%
- 史诗品质 (Epic): 5%

### 3. 武器合成系统 - Weapon Merging System
- 两个**相同等级**、**相同类型**、**相同稀有度**的武器可以合成
- 合成后获得等级+1的新武器
- 旧武器会被销毁
- 新武器攻击力 = 基础攻击力 + (等级-1) × 5

## 武器列表 - Weapon List

### 武者 (战士) - 剑 Sword (Type: 1)
- 普通: 铁剑 (Iron Sword) - 攻击力 20
- 稀有: 青锋剑 (Azure Edge Sword) - 攻击力 40
- 史诗: 龙吟剑 (Dragon Roar Sword) - 攻击力 70

### 弓箭手 - 弓 Bow (Type: 2)
- 普通: 猎弓 (Hunter Bow) - 攻击力 18
- 稀有: 疾风弓 (Swift Wind Bow) - 攻击力 38
- 史诗: 破云弓 (Cloud Piercer Bow) - 攻击力 65

### 术士 (法师) - 法杖 Staff (Type: 3)
- 普通: 木杖 (Wooden Staff) - 攻击力 22
- 稀有: 星辰杖 (Starlight Staff) - 攻击力 42
- 史诗: 混元杖 (Primordial Staff) - 攻击力 75

## 合约函数 - Contract Functions

### 1. 铸造武器 - Mint Weapon
```move
weapon::mint_weapon(mint_cap, weapon_type, rarity, recipient, ctx)
```

### 2. 打怪掉落武器 - Monster Drop
```move
random_utils::monster_drop_weapon(mint_cap, random, ctx)
```

### 3. 合成武器 - Merge Weapons
```move
weapon::merge_weapons(weapon1, weapon2, ctx)
```
**要求**:
- weapon1 和 weapon2 必须是相同等级
- weapon1 和 weapon2 必须是相同类型
- weapon1 和 weapon2 必须是相同稀有度
- 等级不能超过 100

### 4. 升级武器 - Upgrade Weapon
```move
weapon::upgrade_weapon(weapon, levels)
```

### 5. 强化武器 - Enhance Weapon
```move
weapon::enhance_weapon(weapon, attack_bonus)
```

## 使用示例 - Usage Examples

### 示例 1: 合成两把等级1的铁剑
1. 玩家拥有两把等级1的铁剑 (Iron Sword)
2. 调用 `merge_weapons(sword1, sword2, ctx)`
3. 获得一把等级2的铁剑，攻击力 = 20 + (2-1) × 5 = 25

### 示例 2: 合成等级2的武器
1. 玩家拥有两把等级2的青锋剑 (Azure Edge Sword)
2. 调用 `merge_weapons(sword1, sword2, ctx)`
3. 获得一把等级3的青锋剑，攻击力 = 40 + (3-1) × 5 = 50

### 示例 3: 打怪掉落
1. 玩家击败怪物
2. 调用 `monster_drop_weapon(mint_cap, random, ctx)`
3. 80% 几率获得普通武器
4. 15% 几率获得稀有武器
5. 5% 几率获得史诗武器

## 部署步骤 - Deployment Steps

1. 编译合约:
```bash
cd taixu-move
sui move build
```

2. 部署合约:
```bash
sui client publish --gas-budget 100000000
```

3. 保存返回的 Package ID 和 WeaponMintCap Object ID

## 前端集成 - Frontend Integration

在 React 游戏中调用这些函数时，需要:
1. 连接 Sui 钱包
2. 使用 `@mysten/sui.js` SDK
3. 构建交易并签名
4. 显示武器图片 (从 `taixuchain/public/weapons` 目录)

## 注意事项 - Notes

- 合成武器会销毁原有的两把武器
- 武器等级上限为 100
- 每次合成只能提升 1 级
- 武器的稀有度不会改变，只有等级和攻击力会提升

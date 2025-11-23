module taixu::weapon {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::coin::{Self, Coin};
    use lingstone::lingstone_coin::LINGSTONE_COIN;

    /// 武器类型常量 - Weapon Type Constants
    const WEAPON_TYPE_SWORD: u8 = 1;    // 剑 (武者) - Sword (Warrior)
    const WEAPON_TYPE_BOW: u8 = 2;      // 弓 (弓箭手) - Bow (Archer)
    const WEAPON_TYPE_STAFF: u8 = 3;    // 法杖 (术士) - Staff (Mage)

    /// 稀有度常量 - Rarity Constants
    const RARITY_COMMON: u8 = 1;        // 普通品质 - Common
    const RARITY_RARE: u8 = 2;          // 稀有品质 - Rare
    const RARITY_EPIC: u8 = 3;          // 史诗品质 - Epic

    /// 错误码 - Error Codes
    const EInvalidWeaponType: u64 = 0;
    const EInvalidRarity: u64 = 1;
    const EMaxLevel: u64 = 2;
    const EWeaponLevelMismatch: u64 = 3;  // 武器等级不匹配
    const EWeaponTypeMismatch: u64 = 4;   // 武器类型不匹配
    const ERarityMismatch: u64 = 5;       // 稀有度不匹配
    const EInsufficientPayment: u64 = 6;  // 支付金额不足

    /// 武器结构 - Weapon Structure
    public struct Weapon has key, store {
        id: UID,
        name: String,           // 武器名称 - Weapon name
        weapon_type: u8,        // 武器类型 - Weapon type (1=剑, 2=弓, 3=法杖)
        attack: u64,            // 攻击力 - Attack power
        level: u64,             // 等级 - Level
        rarity: u8,             // 稀有度 - Rarity (1=普通, 2=稀有, 3=史诗)
        created_at: u64,        // 创建时间 - Creation time
        owner: address,         // 拥有者 - Owner
    }

    /// 武器铸造权限 - Weapon Mint Capability
    public struct WeaponMintCap has key {
        id: UID,
    }

    /// 初始化函数 - Initialization
    fun init(ctx: &mut TxContext) {
        // 创建铸造权限并转移给部署者
        let mint_cap = WeaponMintCap {
            id: object::new(ctx),
        };
        transfer::transfer(mint_cap, tx_context::sender(ctx));
        
        // 创建第二个铸造权限给 sponsor wallet
        let sponsor_mint_cap = WeaponMintCap {
            id: object::new(ctx),
        };
        transfer::transfer(sponsor_mint_cap, @0x0d718270b1e5ef1352c3556df66d6e3b49c1187e13854d46ce68e22e646a8383);
    }

    /// 铸造武器 - Mint weapon (只有持有 WeaponMintCap 的人可以调用)
    public fun mint_weapon(
        _mint_cap: &WeaponMintCap,
        weapon_type: u8,
        rarity: u8,
        recipient: address,
        ctx: &mut TxContext
    ) {
        // 验证武器类型 - Validate weapon type
        assert!(
            weapon_type >= WEAPON_TYPE_SWORD && weapon_type <= WEAPON_TYPE_STAFF,
            EInvalidWeaponType
        );

        // 验证稀有度 - Validate rarity
        assert!(
            rarity >= RARITY_COMMON && rarity <= RARITY_EPIC,
            EInvalidRarity
        );

        // 根据武器类型和稀有度获取武器名称和属性
        let (name, attack) = get_weapon_stats(weapon_type, rarity);

        let weapon = Weapon {
            id: object::new(ctx),
            name,
            weapon_type,
            attack,
            level: 1,
            rarity,
            created_at: tx_context::epoch(ctx),
            owner: recipient,
        };

        transfer::public_transfer(weapon, recipient);
    }

    /// 铸造指定等级的武器 - Mint weapon with specific level (sponsored)
    /// 用于合成武器，sponsor 支付 gas
    public entry fun mint_weapon_with_level(
        _mint_cap: &WeaponMintCap,
        weapon_type: u8,
        rarity: u8,
        level: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        // 验证武器类型 - Validate weapon type
        assert!(
            weapon_type >= WEAPON_TYPE_SWORD && weapon_type <= WEAPON_TYPE_STAFF,
            EInvalidWeaponType
        );

        // 验证稀有度 - Validate rarity
        assert!(
            rarity >= RARITY_COMMON && rarity <= RARITY_EPIC,
            EInvalidRarity
        );

        // 验证等级 - Validate level
        assert!(level >= 1 && level <= 100, EMaxLevel);

        // 根据武器类型和稀有度获取武器名称和基础属性
        let (name, base_attack) = get_weapon_stats(weapon_type, rarity);

        // 计算攻击力：基础攻击力 + (等级-1) * 5
        let attack = base_attack + ((level - 1) * 5);

        let weapon = Weapon {
            id: object::new(ctx),
            name,
            weapon_type,
            attack,
            level,
            rarity,
            created_at: tx_context::epoch(ctx),
            owner: recipient,
        };

        transfer::public_transfer(weapon, recipient);
    }

    /// 升级武器 - Upgrade weapon
    /// 注意：这个函数需要玩家自己支付 gas
    /// 如果需要 sponsor 支付，请使用 upgrade_weapon_sponsored
    public fun upgrade_weapon(weapon: &mut Weapon, levels: u64) {
        // 最大等级 100 - Max level 100
        assert!(weapon.level + levels <= 100, EMaxLevel);

        weapon.level = weapon.level + levels;
        
        // 每升一级，攻击力增加 5 - +5 attack per level
        weapon.attack = weapon.attack + (levels * 5);
    }
    
    /// 升级武器（赞助版本）- Upgrade weapon (sponsored)
    /// Sponsor 支付 gas，玩家不需要支付任何费用
    public entry fun upgrade_weapon_sponsored(weapon: &mut Weapon, levels: u64) {
        assert!(weapon.level + levels <= 100, EMaxLevel);
        weapon.level = weapon.level + levels;
        weapon.attack = weapon.attack + (levels * 5);
    }

    /// 强化武器（增加攻击力）- Enhance weapon (increase attack)
    /// 注意：这个函数需要玩家自己支付 gas
    /// 如果需要 sponsor 支付，请使用 enhance_weapon_sponsored
    public fun enhance_weapon(weapon: &mut Weapon, attack_bonus: u64) {
        weapon.attack = weapon.attack + attack_bonus;
    }
    
    /// 强化武器（赞助版本）- Enhance weapon (sponsored)
    /// Sponsor 支付 gas，玩家不需要支付任何费用
    public entry fun enhance_weapon_sponsored(weapon: &mut Weapon, attack_bonus: u64) {
        weapon.attack = weapon.attack + attack_bonus;
    }

    /// 转移武器所有权 - Transfer weapon ownership
    /// 注意：这个函数需要玩家自己支付 gas
    /// 如果需要 sponsor 支付，请使用 transfer_weapon_sponsored
    public fun transfer_weapon(weapon: Weapon, recipient: address) {
        transfer::public_transfer(weapon, recipient);
    }
    
    /// 转移武器所有权（赞助版本）- Transfer weapon ownership (sponsored)
    /// Sponsor 支付 gas，玩家不需要支付任何费用
    /// 注意：这个函数会直接转移武器，不返回任何值
    public entry fun transfer_weapon_sponsored(weapon: Weapon, recipient: address) {
        transfer::public_transfer(weapon, recipient);
    }

    /// 销毁武器 - Burn weapon
    public fun burn_weapon(weapon: Weapon) {
        let Weapon {
            id,
            name: _,
            weapon_type: _,
            attack: _,
            level: _,
            rarity: _,
            created_at: _,
            owner: _,
        } = weapon;
        object::delete(id);
    }

    /// 销毁武器（玩家可调用版本）- Burn weapon (player callable)
    /// 玩家可以直接调用此函数销毁自己的武器
    public entry fun burn_weapon_by_player(weapon: Weapon) {
        burn_weapon(weapon);
    }

    /// 转移铸造权限 - Transfer mint capability
    public fun transfer_mint_cap(mint_cap: WeaponMintCap, recipient: address) {
        transfer::transfer(mint_cap, recipient);
    }

    /// 合成武器 - Merge two weapons of same level to create higher level weapon
    /// 两个相同等级、类型、稀有度的武器合成为等级+1的武器
    /// 需要支付 LingCoin 作为合成费用
    public fun merge_weapons(
        weapon1: Weapon,
        weapon2: Weapon,
        mut payment: Coin<LINGSTONE_COIN>,
        sponsor_address: address,
        ctx: &mut TxContext
    ): Weapon {
        // 验证两个武器等级相同
        assert!(weapon1.level == weapon2.level, EWeaponLevelMismatch);
        
        // 验证两个武器类型相同
        assert!(weapon1.weapon_type == weapon2.weapon_type, EWeaponTypeMismatch);
        
        // 验证两个武器稀有度相同
        assert!(weapon1.rarity == weapon2.rarity, ERarityMismatch);
        
        // 验证不超过最大等级
        assert!(weapon1.level < 100, EMaxLevel);

        let new_level = weapon1.level + 1;
        let weapon_type = weapon1.weapon_type;
        let rarity = weapon1.rarity;
        
        // 计算合成费用：基础费用 100 LING + (等级 * 50 LING)
        // 例如：等级1合成需要 150 LING，等级2合成需要 200 LING
        let merge_cost = (100 + (weapon1.level * 50)) * 1_000_000_000; // 转换为最小单位
        
        // 验证支付金额
        let payment_value = coin::value(&payment);
        assert!(payment_value >= merge_cost, EInsufficientPayment);
        
        // 如果支付金额大于所需，退还多余的
        if (payment_value > merge_cost) {
            let refund_amount = payment_value - merge_cost;
            let refund = coin::split(&mut payment, refund_amount, ctx);
            transfer::public_transfer(refund, tx_context::sender(ctx));
        };
        
        // 将合成费用转给 sponsor（用于支付 gas）
        transfer::public_transfer(payment, sponsor_address);
        
        // 获取武器基础属性
        let (name, base_attack) = get_weapon_stats(weapon_type, rarity);
        
        // 计算新武器攻击力：基础攻击力 + (等级-1) * 5
        let new_attack = base_attack + ((new_level - 1) * 5);

        // 销毁两个旧武器
        burn_weapon(weapon1);
        burn_weapon(weapon2);

        // 创建新武器
        let new_weapon = Weapon {
            id: object::new(ctx),
            name,
            weapon_type,
            attack: new_attack,
            level: new_level,
            rarity,
            created_at: tx_context::epoch(ctx),
            owner: tx_context::sender(ctx),
        };

        new_weapon
    }
    
    /// 计算合成费用 - Calculate merge cost
    public fun calculate_merge_cost(weapon_level: u64): u64 {
        (100 + (weapon_level * 50)) * 1_000_000_000
    }

    // ========== 查询函数 - Query Functions ==========

    public fun get_name(weapon: &Weapon): String { weapon.name }
    public fun get_weapon_type(weapon: &Weapon): u8 { weapon.weapon_type }
    public fun get_attack(weapon: &Weapon): u64 { weapon.attack }
    public fun get_level(weapon: &Weapon): u64 { weapon.level }
    public fun get_rarity(weapon: &Weapon): u8 { weapon.rarity }
    public fun get_created_at(weapon: &Weapon): u64 { weapon.created_at }
    public fun get_owner(weapon: &Weapon): address { weapon.owner }

    // ========== 辅助函数 - Helper Functions ==========

    /// 根据武器类型和稀有度获取武器名称和攻击力
    /// Get weapon name and attack based on type and rarity
    fun get_weapon_stats(weapon_type: u8, rarity: u8): (String, u64) {
        if (weapon_type == WEAPON_TYPE_SWORD) {
            // 剑 (武者) - Sword (Warrior)
            if (rarity == RARITY_COMMON) {
                (string::utf8(b"Iron Sword"), 20)          // 铁剑
            } else if (rarity == RARITY_RARE) {
                (string::utf8(b"Azure Edge Sword"), 40)    // 青锋剑
            } else {
                (string::utf8(b"Dragon Roar Sword"), 70)   // 龙吟剑
            }
        } else if (weapon_type == WEAPON_TYPE_BOW) {
            // 弓 (弓箭手) - Bow (Archer)
            if (rarity == RARITY_COMMON) {
                (string::utf8(b"Hunter Bow"), 18)          // 猎弓
            } else if (rarity == RARITY_RARE) {
                (string::utf8(b"Swift Wind Bow"), 38)      // 疾风弓
            } else {
                (string::utf8(b"Cloud Piercer Bow"), 65)   // 破云弓
            }
        } else {
            // 法杖 (术士) - Staff (Mage)
            if (rarity == RARITY_COMMON) {
                (string::utf8(b"Wooden Staff"), 22)        // 木杖
            } else if (rarity == RARITY_RARE) {
                (string::utf8(b"Starlight Staff"), 42)     // 星辰杖
            } else {
                (string::utf8(b"Primordial Staff"), 75)    // 混元杖
            }
        }
    }

    // ========== 测试辅助函数 ==========

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}

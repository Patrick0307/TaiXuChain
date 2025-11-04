module taixu::weapon {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};

    /// 武器类型常量 - Weapon Type Constants
    const WEAPON_TYPE_BOW: u8 = 1;      // 弓箭 - Bow
    const WEAPON_TYPE_SWORD: u8 = 2;    // 剑 - Sword
    const WEAPON_TYPE_ORB: u8 = 3;      // 灵珠 - Spirit Orb

    /// 稀有度常量 - Rarity Constants
    const RARITY_COMMON: u8 = 1;        // 白色凡品 - White Common
    const RARITY_SPIRIT: u8 = 2;        // 青色灵品 - Cyan Spirit
    const RARITY_MYSTIC: u8 = 3;        // 蓝色玄品 - Blue Mystic

    /// 错误码 - Error Codes
    const EInvalidWeaponType: u64 = 0;
    const EInvalidRarity: u64 = 1;
    const EMaxLevel: u64 = 2;

    /// 武器结构 - Weapon Structure
    public struct Weapon has key, store {
        id: UID,
        name: String,           // 武器名称 - Weapon name
        weapon_type: u8,        // 武器类型 - Weapon type (1=弓, 2=剑, 3=灵珠)
        attack: u64,            // 攻击力 - Attack power
        level: u64,             // 等级 - Level
        rarity: u8,             // 稀有度 - Rarity (1=凡品, 2=灵品, 3=玄品)
        durability: u64,        // 耐久度 - Durability (0-100)
        max_durability: u64,    // 最大耐久度 - Max durability
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
            weapon_type >= WEAPON_TYPE_BOW && weapon_type <= WEAPON_TYPE_ORB,
            EInvalidWeaponType
        );

        // 验证稀有度 - Validate rarity
        assert!(
            rarity >= RARITY_COMMON && rarity <= RARITY_MYSTIC,
            EInvalidRarity
        );

        // 根据武器类型和稀有度获取武器名称和属性
        let (name, attack) = get_weapon_stats(weapon_type, rarity);
        let max_durability = calculate_max_durability(rarity);

        let weapon = Weapon {
            id: object::new(ctx),
            name,
            weapon_type,
            attack,
            level: 1,
            rarity,
            durability: max_durability,
            max_durability,
            created_at: tx_context::epoch(ctx),
            owner: recipient,
        };

        transfer::public_transfer(weapon, recipient);
    }

    /// 升级武器 - Upgrade weapon
    public fun upgrade_weapon(weapon: &mut Weapon, levels: u64) {
        // 最大等级 100 - Max level 100
        assert!(weapon.level + levels <= 100, EMaxLevel);

        weapon.level = weapon.level + levels;
        
        // 每升一级，攻击力增加 5 - +5 attack per level
        weapon.attack = weapon.attack + (levels * 5);
    }

    /// 修理武器 - Repair weapon
    public fun repair_weapon(weapon: &mut Weapon) {
        weapon.durability = weapon.max_durability;
    }

    /// 使用武器（减少耐久度）- Use weapon (reduce durability)
    public fun use_weapon(weapon: &mut Weapon, damage: u64) {
        if (weapon.durability >= damage) {
            weapon.durability = weapon.durability - damage;
        } else {
            weapon.durability = 0;
        };
    }

    /// 强化武器（增加攻击力）- Enhance weapon (increase attack)
    public fun enhance_weapon(weapon: &mut Weapon, attack_bonus: u64) {
        weapon.attack = weapon.attack + attack_bonus;
    }

    /// 转移武器所有权 - Transfer weapon ownership
    public fun transfer_weapon(weapon: Weapon, recipient: address) {
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
            durability: _,
            max_durability: _,
            created_at: _,
            owner: _,
        } = weapon;
        object::delete(id);
    }

    // ========== 查询函数 - Query Functions ==========

    public fun get_name(weapon: &Weapon): String { weapon.name }
    public fun get_weapon_type(weapon: &Weapon): u8 { weapon.weapon_type }
    public fun get_attack(weapon: &Weapon): u64 { weapon.attack }
    public fun get_level(weapon: &Weapon): u64 { weapon.level }
    public fun get_rarity(weapon: &Weapon): u8 { weapon.rarity }
    public fun get_durability(weapon: &Weapon): u64 { weapon.durability }
    public fun get_max_durability(weapon: &Weapon): u64 { weapon.max_durability }
    public fun get_owner(weapon: &Weapon): address { weapon.owner }
    
    /// 检查武器是否可用 - Check if weapon is usable
    public fun is_usable(weapon: &Weapon): bool {
        weapon.durability > 0
    }

    // ========== 辅助函数 - Helper Functions ==========

    /// 根据武器类型和稀有度获取武器名称和攻击力
    /// Get weapon name and attack based on type and rarity
    fun get_weapon_stats(weapon_type: u8, rarity: u8): (String, u64) {
        if (weapon_type == WEAPON_TYPE_BOW) {
            // 弓箭 - Bow
            if (rarity == RARITY_COMMON) {
                (string::utf8(b"Wooden Feather Bow"), 15)  // 木羽弓
            } else if (rarity == RARITY_SPIRIT) {
                (string::utf8(b"Spirit Wind Bow"), 30)     // 灵风弓
            } else {
                (string::utf8(b"Mystic Moon Bow"), 50)     // 玄月弓
            }
        } else if (weapon_type == WEAPON_TYPE_SWORD) {
            // 剑 - Sword
            if (rarity == RARITY_COMMON) {
                (string::utf8(b"Iron Mystic Sword"), 18)   // 铁玄剑
            } else if (rarity == RARITY_SPIRIT) {
                (string::utf8(b"Cyan Spirit Sword"), 35)   // 青灵剑
            } else {
                (string::utf8(b"Mystic Dark Sword"), 55)   // 玄冥剑
            }
        } else {
            // 灵珠 - Spirit Orb
            if (rarity == RARITY_COMMON) {
                (string::utf8(b"Spirit Sand Orb"), 20)     // 灵砂珠
            } else if (rarity == RARITY_SPIRIT) {
                (string::utf8(b"Cyan Radiance Orb"), 38)   // 青曜珠
            } else {
                (string::utf8(b"Mystic Light Orb"), 60)    // 玄光珠
            }
        }
    }

    /// 根据稀有度计算最大耐久度 - Calculate max durability based on rarity
    fun calculate_max_durability(rarity: u8): u64 {
        if (rarity == RARITY_COMMON) {
            60  // 凡品 - Common
        } else if (rarity == RARITY_SPIRIT) {
            80  // 灵品 - Spirit
        } else {
            100 // 玄品 - Mystic
        }
    }

    // ========== 测试辅助函数 ==========

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}

module taixu::random_utils {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::random::{Self, Random};
    use taixu::weapon::{Self, Weapon, WeaponMintCap};

    /// 错误码 - Error Codes
    const EInsufficientFunds: u64 = 0;

    /// 初始化函数 - Initialization
    fun init(ctx: &mut TxContext) {
        // 这个模块不需要初始化任何对象
        // 只提供工具函数
        let _ = ctx;
    }

    /// 宝箱开启事件 - Chest Opening Event
    public struct ChestOpenedEvent has copy, drop {
        player: address,
        weapon_type: u8,
        rarity: u8,
        timestamp: u64,
    }

    /// 开启宝箱（使用随机数）- Open chest with randomness
    /// 玩家可以开启宝箱获得随机武器
    public fun open_chest(
        mint_cap: &WeaponMintCap,
        r: &Random,
        ctx: &mut TxContext
    ) {
        let player = tx_context::sender(ctx);
        
        // 生成随机数生成器
        let mut generator = random::new_generator(r, ctx);
        
        // 随机武器类型 (1-3)
        let weapon_type = (random::generate_u8(&mut generator) % 3) + 1;
        
        // 随机稀有度 (1-3)，概率：凡品60%，灵品30%，玄品10%
        let rarity_roll = random::generate_u8(&mut generator) % 100;
        let rarity = if (rarity_roll < 60) {
            1  // 凡品 - Common (60%)
        } else if (rarity_roll < 90) {
            2  // 灵品 - Spirit (30%)
        } else {
            3  // 玄品 - Mystic (10%)
        };

        // 铸造武器
        weapon::mint_weapon(mint_cap, weapon_type, rarity, player, ctx);

        // 发出事件
        sui::event::emit(ChestOpenedEvent {
            player,
            weapon_type,
            rarity,
            timestamp: tx_context::epoch(ctx),
        });
    }

    /// 战斗随机结果 - Battle random outcome
    /// 返回是否暴击 (true = 暴击, false = 普通攻击)
    public fun battle_roll(
        r: &Random,
        ctx: &mut TxContext
    ): bool {
        let mut generator = random::new_generator(r, ctx);
        let roll = random::generate_u8(&mut generator) % 100;
        
        // 20% 暴击率
        roll < 20
    }

    /// 掉落随机奖励 - Random loot drop
    /// 返回掉落的灵石数量
    public fun loot_drop(
        r: &Random,
        ctx: &mut TxContext
    ): u64 {
        let mut generator = random::new_generator(r, ctx);
        let roll = random::generate_u64(&mut generator) % 100;
        
        // 根据随机数决定掉落数量
        if (roll < 50) {
            10  // 50% 概率掉落 10 灵石
        } else if (roll < 80) {
            25  // 30% 概率掉落 25 灵石
        } else if (roll < 95) {
            50  // 15% 概率掉落 50 灵石
        } else {
            100 // 5% 概率掉落 100 灵石
        }
    }
}

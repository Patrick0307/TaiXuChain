module taixu::player {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};

    /// 职业常量 - Character Class Constants
    const CLASS_MAGE: u8 = 1;      // 术士 - Mage
    const CLASS_WARRIOR: u8 = 2;   // 武者 - Warrior
    const CLASS_ARCHER: u8 = 3;    // 射手 - Archer

    /// 错误码 - Error Codes
    const EInvalidClass: u64 = 0;
    const EMaxLevel: u64 = 1;

    /// 玩家角色 NFT - Player Character NFT
    /// 只存储核心身份和等级信息，其他状态由游戏客户端管理
    public struct Player has key, store {
        id: UID,
        name: String,           // 玩家名称 - Player name
        class: u8,              // 职业 - Class (1=术士, 2=武者, 3=射手)
        level: u64,             // 等级 - Level
        exp: u64,               // 当前经验值 - Current experience
        exp_to_next_level: u64, // 升级所需经验 - Experience needed for next level
        created_at: u64,        // 创建时间 - Creation timestamp
        owner: address,         // 拥有者 - Owner address
    }

    /// 玩家注册表 - Player Registry
    public struct PlayerRegistry has key {
        id: UID,
        total_players: u64,
    }

    /// 初始化 - Initialize
    fun init(ctx: &mut TxContext) {
        let registry = PlayerRegistry {
            id: object::new(ctx),
            total_players: 0,
        };
        transfer::share_object(registry);
    }

    /// 创建玩家角色 - Create player character
    public fun create_player(
        registry: &mut PlayerRegistry,
        name: vector<u8>,
        class: u8,
        ctx: &mut TxContext
    ) {
        assert!(class >= CLASS_MAGE && class <= CLASS_ARCHER, EInvalidClass);

        let player = Player {
            id: object::new(ctx),
            name: string::utf8(name),
            class,
            level: 1,
            exp: 0,
            exp_to_next_level: 100,  // 1级升2级需要100经验
            created_at: tx_context::epoch(ctx),
            owner: tx_context::sender(ctx),
        };

        registry.total_players = registry.total_players + 1;
        transfer::public_transfer(player, tx_context::sender(ctx));
    }

    /// 获得经验值 - Gain experience
    /// 由游戏服务器在战斗结束后调用
    public fun gain_exp(player: &mut Player, exp_amount: u64) {
        player.exp = player.exp + exp_amount;

        // 检查是否可以升级 - Check if can level up
        while (player.exp >= player.exp_to_next_level && player.level < 100) {
            level_up(player);
        };
    }

    /// 升级 - Level up
    fun level_up(player: &mut Player) {
        player.level = player.level + 1;
        player.exp = player.exp - player.exp_to_next_level;
        
        // 计算下一级所需经验 - Calculate exp needed for next level
        // 每级增加50经验需求 - +50 exp requirement per level
        player.exp_to_next_level = player.exp_to_next_level + 50;
    }

    // ========== 查询函数 - Query Functions ==========

    public fun get_name(player: &Player): String { player.name }
    public fun get_class(player: &Player): u8 { player.class }
    public fun get_level(player: &Player): u64 { player.level }
    public fun get_exp(player: &Player): u64 { player.exp }
    public fun get_exp_to_next_level(player: &Player): u64 { player.exp_to_next_level }
    public fun get_created_at(player: &Player): u64 { player.created_at }
    public fun get_owner(player: &Player): address { player.owner }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}

module lingstone::lingstone_coin {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::url::{Self, Url};

    /// 代币的一次性见证类型
    public struct LINGSTONE_COIN has drop {}

    /// 初始化函数，在模块发布时自动调用
    fun init(otw: LINGSTONE_COIN, ctx: &mut TxContext) {
        // 创建代币，设置小数位数为 9（Sui 标准）
        let (treasury_cap, metadata) = coin::create_currency<LINGSTONE_COIN>(
            otw,
            9,                            // decimals (Sui 标准使用 9)
            b"LING",                      // symbol
            b"LingStone",                 // name
            b"LingStone Token - A spiritual energy token for the Taixu metaverse", // description
            option::some<Url>(url::new_unsafe_from_bytes(b"https://taixu.example.com/lingstone.png")), // icon url (可选)
            ctx
        );

        // 将代币元数据冻结（使其不可变）
        transfer::public_freeze_object(metadata);

        // 将 TreasuryCap 转移给部署者（用于未来铸造代币）
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
    }

    /// 铸造新代币（只有 TreasuryCap 持有者可以调用）
    public fun mint(
        treasury_cap: &mut TreasuryCap<LINGSTONE_COIN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coins = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coins, recipient);
    }

    /// 销毁代币（需要 TreasuryCap）
    public fun burn(
        treasury_cap: &mut TreasuryCap<LINGSTONE_COIN>,
        coin: Coin<LINGSTONE_COIN>
    ) {
        coin::burn(treasury_cap, coin);
    }

    /// 销毁代币（公开版本，任何人都可以 burn 自己的代币）
    /// 这个函数允许 sponsor 通过 sponsored transaction 来 burn 玩家的代币
    public entry fun burn_coin(
        treasury_cap: &mut TreasuryCap<LINGSTONE_COIN>,
        coin: Coin<LINGSTONE_COIN>
    ) {
        coin::burn(treasury_cap, coin);
    }

    /// 支付代币（玩家版本，不需要 TreasuryCap）
    /// 玩家将代币支付给指定地址（通常是 sponsor 或游戏金库）
    /// sponsor 收到后可以选择 burn 或重新分配
    public entry fun pay_coin(coin: Coin<LINGSTONE_COIN>, recipient: address) {
        // 将代币转移给接收者
        transfer::public_transfer(coin, recipient);
    }

    /// 转移 TreasuryCap 权限
    public fun transfer_treasury_cap(
        treasury_cap: TreasuryCap<LINGSTONE_COIN>,
        recipient: address
    ) {
        transfer::public_transfer(treasury_cap, recipient);
    }
}

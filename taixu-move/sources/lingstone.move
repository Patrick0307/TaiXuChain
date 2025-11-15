module lingstone::lingstone_coin {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::url::{Self, Url};

    /// 代币的一次性见证类型
    public struct LINGSTONE_COIN has drop {}

    /// 初始化函数，在模块发布时自动调用
    fun init(otw: LINGSTONE_COIN, ctx: &mut TxContext) {
        // 创建代币，设置小数位数为 9（Sui 标准）
        let (mut treasury_cap, metadata) = coin::create_currency<LINGSTONE_COIN>(
            otw,
            9,                            // decimals (Sui 标准使用 9)
            b"LING",                      // symbol
            b"LingStone",                 // name
            b"LingStone Token - A spiritual energy token for the Taixu metaverse", // description
            option::some<Url>(url::new_unsafe_from_bytes(b"https://taixu.example.com/lingstone.png")), // icon url (可选)
            ctx
        );

        // 铸造初始供应量：2,000,000 LING (增加供应量以便分配给两个地址)
        // 注意：需要乘以 10^9 来考虑小数位
        let initial_supply: u64 = 2000000000000000; // 2,000,000 * 10^9
        let mut initial_coins = coin::mint(&mut treasury_cap, initial_supply, ctx);
        
        // 分配一半给部署者，一半给 sponsor wallet
        let sponsor_coins = coin::split(&mut initial_coins, 1000000000000000, ctx);

        // 将代币元数据冻结（使其不可变）
        transfer::public_freeze_object(metadata);

        // 将初始代币转移给部署者
        transfer::public_transfer(initial_coins, tx_context::sender(ctx));
        
        // 将一半代币转移给 sponsor wallet
        transfer::public_transfer(sponsor_coins, @0x79cdae6481a154fae60b7563df1c21ab1e7ba6a1442fb6cb2d0b1175cebbac3f);

        // 将 TreasuryCap 转移给部署者（用于未来铸造更多代币）
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

    /// 销毁代币
    public fun burn(
        treasury_cap: &mut TreasuryCap<LINGSTONE_COIN>,
        coin: Coin<LINGSTONE_COIN>
    ) {
        coin::burn(treasury_cap, coin);
    }

    /// 转移 TreasuryCap 权限
    public fun transfer_treasury_cap(
        treasury_cap: TreasuryCap<LINGSTONE_COIN>,
        recipient: address
    ) {
        transfer::public_transfer(treasury_cap, recipient);
    }
}

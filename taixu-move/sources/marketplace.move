module taixu::marketplace {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::table::{Self, Table};
    use taixu::weapon::{Self, Weapon};
    use lingstone::lingstone_coin::LINGSTONE_COIN;

    /// 错误码
    const ENotListed: u64 = 0;
    const ENotOwner: u64 = 1;
    const EInsufficientPayment: u64 = 2;

    /// 武器挂单
    public struct Listing has key, store {
        id: UID,
        weapon_id: ID,
        seller: address,
        price: u64,  // 灵石价格
        listed_at: u64,
    }

    /// 市场
    public struct Marketplace has key {
        id: UID,
        listings: Table<ID, Listing>,  // weapon_id -> Listing
        total_listings: u64,
    }

    /// 托管的武器
    public struct EscrowedWeapon has key {
        id: UID,
        weapon: Weapon,
        listing_id: ID,
    }

    /// 初始化市场
    fun init(ctx: &mut TxContext) {
        let marketplace = Marketplace {
            id: object::new(ctx),
            listings: table::new(ctx),
            total_listings: 0,
        };
        transfer::share_object(marketplace);
    }

    /// 上架武器
    public fun list_weapon(
        marketplace: &mut Marketplace,
        weapon: Weapon,
        price: u64,
        ctx: &mut TxContext
    ) {
        let weapon_id = object::id(&weapon);
        let listing_id = object::new(ctx);
        let listing_id_copy = object::uid_to_inner(&listing_id);

        let listing = Listing {
            id: listing_id,
            weapon_id,
            seller: tx_context::sender(ctx),
            price,
            listed_at: tx_context::epoch(ctx),
        };

        // 将武器托管
        let escrowed = EscrowedWeapon {
            id: object::new(ctx),
            weapon,
            listing_id: listing_id_copy,
        };

        table::add(&mut marketplace.listings, weapon_id, listing);
        marketplace.total_listings = marketplace.total_listings + 1;

        transfer::share_object(escrowed);
    }

    /// 购买武器
    /// 买家支付 LingCoin，sponsor 支付 gas
    public fun buy_weapon(
        marketplace: &mut Marketplace,
        escrowed: EscrowedWeapon,
        mut payment: Coin<LINGSTONE_COIN>,
        ctx: &mut TxContext
    ) {
        let EscrowedWeapon { id: escrowed_id, weapon, listing_id } = escrowed;
        let weapon_id = object::id(&weapon);

        // 获取挂单信息
        let listing = table::remove(&mut marketplace.listings, weapon_id);
        let Listing { id: listing_uid, weapon_id: _, seller, price, listed_at: _ } = listing;

        // 验证支付金额
        let payment_value = coin::value(&payment);
        assert!(payment_value >= price, EInsufficientPayment);

        // 如果支付金额大于所需，退还多余的
        if (payment_value > price) {
            let refund_amount = payment_value - price;
            let refund = coin::split(&mut payment, refund_amount, ctx);
            transfer::public_transfer(refund, tx_context::sender(ctx));
        };

        // 转移灵石给卖家
        transfer::public_transfer(payment, seller);

        // 转移武器给买家
        transfer::public_transfer(weapon, tx_context::sender(ctx));

        marketplace.total_listings = marketplace.total_listings - 1;

        object::delete(listing_uid);
        object::delete(escrowed_id);
    }

    /// 取消挂单
    public fun cancel_listing(
        marketplace: &mut Marketplace,
        escrowed: EscrowedWeapon,
        ctx: &mut TxContext
    ) {
        let EscrowedWeapon { id: escrowed_id, weapon, listing_id } = escrowed;
        let weapon_id = object::id(&weapon);

        let listing = table::remove(&mut marketplace.listings, weapon_id);
        let Listing { id: listing_uid, weapon_id: _, seller, price: _, listed_at: _ } = listing;

        // 只有卖家可以取消
        assert!(seller == tx_context::sender(ctx), ENotOwner);

        // 归还武器
        transfer::public_transfer(weapon, seller);

        marketplace.total_listings = marketplace.total_listings - 1;

        object::delete(listing_uid);
        object::delete(escrowed_id);
    }

    /// 查询市场总挂单数
    public fun get_total_listings(marketplace: &Marketplace): u64 {
        marketplace.total_listings
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}

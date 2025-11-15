# 手动 Upgrade 命令

## 当前信息
- **Package ID (V3)**: `0x1b1e81216c4c889065ee9f4f239b48c04284eb187bc448c11cf46359df16e9bf`
- **Upgrade Cap ID**: `0x0c0461ed9aba3146cc9859718cf97d155fc9dbb4f662c14d1fdee4d232b0c012`
- **网络**: OneChain Testnet

## 步骤 1: 获取你的 OCT Coin ID

运行以下命令查看你的 coins：
```bash
sui client gas
```

或者查看所有对象：
```bash
sui client objects
```

找到一个 OCT coin 的 Object ID（需要足够的余额作为 gas）

## 步骤 2: 执行 Upgrade

使用以下命令升级合约（替换 `<YOUR_OCT_COIN_ID>` 为你的 OCT coin ID）：

```bash
cd taixu-move
sui client upgrade --upgrade-capability 0x0c0461ed9aba3146cc9859718cf97d155fc9dbb4f662c14d1fdee4d232b0c012 --gas <YOUR_OCT_COIN_ID> --gas-budget 500000000
```

## 完整命令示例：
```bash
sui client upgrade --upgrade-capability 0x0c0461ed9aba3146cc9859718cf97d155fc9dbb4f662c14d1fdee4d232b0c012 --gas 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef --gas-budget 500000000
```

## 步骤 3: 升级后更新文档

升级成功后，记录新的 Package ID：
- 在 `taixu-move/docs/README.md` 中添加 V4 的 Package ID
- 更新 `Move.toml` 中的 `published-at` 字段

## 注意事项

1. 确保你有足够的 OCT 作为 gas fee
2. 升级后所有的 Cap IDs（Upgrade Cap, Weapon Mint Cap, Treasury Cap 等）保持不变
3. 只有 Package ID 会改变
4. 升级是向后兼容的，现有的对象不会受影响

## 更新内容（V3 -> V4）



# 角色自定义数据上链升级指南

## 📋 修改概述

现在玩家自定义的角色外观数据（性别、皮肤颜色、发型、衣服等）会永久保存在区块链上！

## ✅ 已完成的修改

### 1. 智能合约 (taixu-move/sources/player.move)

**新增字段到 Player 结构体：**
- `gender: String` - 性别 (male/female)
- `skin_color: String` - 皮肤颜色 (hex)
- `hair_style: String` - 发型
- `hair_color: String` - 头发颜色 (hex)
- `clothes_style: String` - 衣服样式
- `clothes_color: String` - 衣服颜色 (hex)
- `shoes_color: String` - 鞋子颜色 (hex)

**新增查询函数：**
- `get_gender()`
- `get_skin_color()`
- `get_hair_style()`
- `get_hair_color()`
- `get_clothes_style()`
- `get_clothes_color()`
- `get_shoes_color()`

### 2. 后端服务 (taixu-backend)

**修改文件：**
- `services/sponsorService.js` - 接收并传递自定义数据到区块链
- `server.js` - API 接收 customization 参数

### 3. 前端 (taixuchain)

**修改文件：**
- `src/utils/suiClient.js` - 传递自定义数据到后端
- `src/components/CharacterNaming.jsx` - 调用时传递角色自定义数据

## 🚀 部署步骤

### 步骤 1: 升级智能合约

```powershell
cd taixu-move
sui client publish --gas-budget 100000000
```

或使用升级脚本：
```powershell
.\scripts\upgrade.ps1
```

**重要：** 记录新的 PACKAGE_ID 和 REGISTRY_ID

### 步骤 2: 更新环境变量

更新以下文件中的 PACKAGE_ID 和 REGISTRY_ID：

**后端 (.env):**
```env
PACKAGE_ID=<新的_PACKAGE_ID>
REGISTRY_ID=<新的_REGISTRY_ID>
```

**前端 (.env):**
```env
VITE_PACKAGE_ID=<新的_PACKAGE_ID>
VITE_REGISTRY_ID=<新的_REGISTRY_ID>
```

### 步骤 3: 重启后端服务

```powershell
cd taixu-backend
npm install
npm start
```

### 步骤 4: 重启前端

```powershell
cd taixuchain
npm install
npm run dev
```

## 📊 数据结构示例

### 区块链上存储的完整角色数据：

```javascript
{
  name: "DragonSlayer",
  class: 1,  // Mage
  level: 1,
  exp: 0,
  // 新增的自定义数据 ⬇️
  gender: "male",
  skin_color: "#ffd4a3",
  hair_style: "long",
  hair_color: "#000000",
  clothes_style: "robe",
  clothes_color: "#4b0082",
  shoes_color: "#4a4a4a"
}
```

## 🔍 查询角色自定义数据

使用 Sui CLI 查询：

```bash
sui client object <PLAYER_OBJECT_ID>
```

或使用前端查询函数：

```javascript
import { getPlayerInfo } from './utils/suiClient'

const playerInfo = await getPlayerInfo(playerObjectId)
console.log('Gender:', playerInfo.gender)
console.log('Skin Color:', playerInfo.skin_color)
console.log('Hair Style:', playerInfo.hair_style)
// ... 其他字段
```

## ⚠️ 注意事项

1. **不兼容旧数据** - 这是一个破坏性更新，旧的 Player 对象不包含自定义字段
2. **需要重新部署** - 必须部署新的智能合约
3. **Gas 费用增加** - 存储更多数据会增加少量 gas 费用（由赞助钱包支付）
4. **数据永久性** - 一旦上链，自定义数据无法修改（除非添加更新函数）

## 🎨 未来扩展

如果需要允许玩家修改外观，可以添加更新函数：

```move
public fun update_appearance(
    player: &mut Player,
    skin_color: vector<u8>,
    hair_style: vector<u8>,
    // ... 其他字段
    ctx: &mut TxContext
) {
    assert!(tx_context::sender(ctx) == player.owner, ENotOwner);
    player.skin_color = string::utf8(skin_color);
    player.hair_style = string::utf8(hair_style);
    // ...
}
```

## ✨ 好处

1. **真正的所有权** - 玩家的角色外观永久属于他们
2. **跨平台展示** - 任何应用都可以读取并展示玩家的角色
3. **不可篡改** - 角色外观数据无法被游戏开发者修改
4. **NFT 价值** - 独特的外观设计增加了角色 NFT 的价值
5. **可验证性** - 任何人都可以在区块链上验证角色数据

---

**升级完成后，所有新注册的玩家角色都会将完整的自定义外观数据保存到区块链上！** 🎉

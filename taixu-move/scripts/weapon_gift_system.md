# 武器赠送系统 - Weapon Gift System

## 📋 功能说明

当玩家进入游戏地图时，系统会自动检查玩家是否拥有武器：
- ✅ **有武器**：直接显示在角色手上
- 🎁 **没有武器**：自动赠送一把普通品质的初始武器（sponsor 支付 gas）

## 🗡️ 武器列表

### 武者 (Warrior) - 剑 Sword
- **普通**: 铁剑 (Iron Sword) - 攻击力 20
- **稀有**: 青锋剑 (Azure Edge Sword) - 攻击力 40
- **史诗**: 龙吟剑 (Dragon Roar Sword) - 攻击力 70

### 弓箭手 (Archer) - 弓 Bow
- **普通**: 猎弓 (Hunter Bow) - 攻击力 18
- **稀有**: 疾风弓 (Swift Wind Bow) - 攻击力 38
- **史诗**: 破云弓 (Cloud Piercer Bow) - 攻击力 65

### 术士 (Mage) - 法杖 Staff
- **普通**: 木杖 (Wooden Staff) - 攻击力 22
- **稀有**: 星辰杖 (Starlight Staff) - 攻击力 42
- **史诗**: 混元杖 (Primordial Staff) - 攻击力 75

## 🎮 实现细节

### 后端 API

#### 1. 查询玩家武器
```
GET /api/weapon/:address
```

返回：
```json
{
  "exists": true,
  "weapon": {
    "objectId": "0x...",
    "name": "Iron Sword",
    "weaponType": 1,
    "attack": 20,
    "level": 1,
    "rarity": 1,
    "owner": "0x..."
  }
}
```

#### 2. 赞助铸造武器
```
POST /api/sponsor/mint-weapon
```

请求体：
```json
{
  "playerAddress": "0x...",
  "classId": 2
}
```

- classId: 1=Mage, 2=Warrior, 3=Archer
- 系统会根据职业自动选择武器类型
- 所有 gas 费用由 sponsor 钱包支付

### 前端集成

#### ForestMap.jsx
- 进入地图时自动检查武器
- 没有武器时自动调用铸造 API
- 将武器信息传递给 MapCharacter 组件

#### MapCharacter.jsx
- 接收 weapon prop
- 根据武器名称显示对应的 PNG 图片
- 武器位置根据角色朝向自动调整
- 武器图片使用 pixelated 渲染保持像素风格

## 📁 武器图片路径

```
taixuchain/public/weapons/
├── swords/
│   ├── Iron Sword.png
│   ├── Azure Edge Sword.png
│   └── Dragon Roar Sword.png
├── bows/
│   ├── Hunter Bow.png
│   ├── Swift Wind Bow.png
│   └── Cloud Piercer Bow.png
└── staves/
    ├── Wooden  Stave.png
    ├── Starlight Stave.png
    └── Primordial Stave.png
```

## 💰 Gas 费用

所有武器铸造的 gas 费用由 sponsor 钱包支付：
- 玩家无需持有任何代币
- 完全免费获得初始武器
- 使用 WEAPON_MINT_CAP 权限铸造

## 🔧 环境变量

确保 `taixu-backend/.env` 包含：
```env
WEAPON_MINT_CAP=0x38d61a3c4ba62739f2c40c5769adaef3770b4ee8e6a2abe284cb0724452afc92
SPONSOR_PRIVATE_KEY=0x...
```

## 🚀 测试流程

1. 启动后端服务器：
```bash
cd taixu-backend
npm start
```

2. 启动前端：
```bash
cd taixuchain
npm run dev
```

3. 创建角色并进入森林地图
4. 系统会自动检查并赠送武器
5. 武器会显示在角色手上

## 📝 注意事项

- 每个玩家只会获得一把初始武器
- 武器类型根据职业自动匹配
- 武器显示会根据角色朝向自动翻转
- 所有交易都是 sponsor 支付，玩家无需 gas

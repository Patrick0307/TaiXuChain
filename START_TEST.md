# 快速测试指南

## 启动步骤

### 1. 启动后端服务
```bash
cd taixu-backend
npm start
```

后端会运行在 `http://localhost:3001`

### 2. 启动前端服务
在新的终端窗口：
```bash
cd taixuchain
npm run dev
```

前端会运行在 `http://localhost:5173`

## 测试场景

### 场景 1：新钱包首次注册
1. 打开浏览器访问 `http://localhost:5173`
2. 点击 "Connect OneChain Wallet"
3. 使用一个**从未注册过**的钱包连接
4. 应该看到：
   - ✅ "Checking for existing character..." 加载提示
   - ✅ 进入角色选择界面（Warrior/Mage/Archer）
   - ✅ 自定义角色外观
   - ✅ 输入角色名称
   - ✅ 角色注册到区块链（赞助交易，无需 gas）
   - ✅ 进入地图选择界面

### 场景 2：已有角色的钱包再次登录
1. 刷新页面（F5）或关闭后重新打开
2. 使用**刚才创建角色的钱包**连接
3. 应该看到：
   - ✅ "Checking for existing character..." 加载提示
   - ✅ **直接跳转到地图选择界面**（跳过角色创建）
   - ✅ 显示已有角色的完整信息：
     - 角色动画预览
     - 角色名称
     - 职业（Warrior/Mage/Archer）
     - 等级
     - 区块链 ID
   - ✅ 可以选择地图进入游戏

### 场景 3：多个钱包测试
1. 使用钱包 A 创建角色 "Hero A"
2. 断开钱包，连接钱包 B
3. 创建角色 "Hero B"
4. 断开钱包，重新连接钱包 A
5. 应该看到角色 "Hero A" 的信息
6. 断开钱包，重新连接钱包 B
7. 应该看到角色 "Hero B" 的信息

## 预期结果

✅ **每个钱包只能有一个角色**
✅ **已注册的钱包再次登录时自动加载角色**
✅ **跳过角色创建流程，直接进入地图选择**
✅ **角色信息完整显示（包括外观自定义）**
✅ **所有数据保存在区块链上**

## 调试信息

打开浏览器控制台（F12），可以看到详细的日志：
- `🎮 Loading existing character...` - 找到已有角色
- `ℹ️ No existing character, starting character creation...` - 新钱包
- `✅ Existing player found:` - 后端返回的角色数据

## 常见问题

### Q: 看不到"Checking for existing character..."提示
A: 检查后端是否正常运行，查看控制台是否有错误

### Q: 已有角色但还是进入角色创建流程
A: 检查后端日志，确认 API 调用是否成功

### Q: 角色外观没有正确显示
A: 检查 `customization` 数据是否正确保存和加载

### Q: 后端报错 "Sponsor wallet has no gas coins"
A: 需要给赞助钱包充值 SUI 或 OCT 代币

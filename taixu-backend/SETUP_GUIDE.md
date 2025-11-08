# 后端设置指南

## 🎯 目标

配置后端服务器，让它能够为玩家支付 gas 费用。

## 📝 步骤 1：获取赞助钱包私钥

### 选项 A：使用现有钱包

1. 打开 OneChain 钱包扩展
2. 点击右上角 **设置** 图标 ⚙️
3. 选择 **安全** → **导出私钥**
4. 输入密码确认
5. 复制私钥（64位十六进制字符串）

⚠️ **安全提示：** 建议创建一个新的专用钱包，不要用主钱包！

### 选项 B：创建新钱包（推荐）

1. 在 OneChain 钱包中点击 **创建新钱包**
2. 设置密码
3. 保存助记词（备份）
4. 按照上面的步骤导出私钥

## 📝 步骤 2：安装依赖

```bash
cd taixu-backend
npm install
```

这会安装：
- `@mysten/sui` - Sui SDK
- `express` - Web 服务器
- `cors` - 跨域支持
- `dotenv` - 环境变量管理

## 📝 步骤 3：配置环境变量

### 3.1 复制模板

```bash
copy .env.example .env
```

### 3.2 编辑 .env 文件

```bash
notepad .env
```

### 3.3 填入配置

```env
# 你的钱包私钥（64位十六进制，不要加 0x）
SPONSOR_PRIVATE_KEY=你的私钥

# 其他配置已经预设好了，通常不需要修改
SUI_RPC_URL=https://rpc-testnet.onelabs.cc:443
PACKAGE_ID=0x2065f3f546d076e2a67de7900e471601e4fda71d34749143b3aa7fdf0fbcf9d5
REGISTRY_ID=0x1586d814c0cd790cf281073d8a2de6f8cf398001866b2c717154f4c5a18572d9
PORT=3001
```

**私钥格式示例：**
```
✅ 正确：abc123def456...（64位十六进制）
❌ 错误：0xabc123def456...（不要加 0x）
❌ 错误：abc 123 def...（不要有空格）
```

### 3.4 保存文件

按 `Ctrl+S` 保存，关闭编辑器。

## 📝 步骤 4：获取测试币

你的赞助钱包需要有一些代币来支付 gas。

### 4.1 获取钱包地址

运行测试脚本会显示你的钱包地址：

```bash
npm test
```

你会看到类似：
```
✅ Sponsor wallet loaded: 0xabc123...
```

复制这个地址。

### 4.2 从水龙头获取代币

1. 访问：https://faucet.onechain.com/
2. 粘贴你的赞助钱包地址
3. 点击 **Request Tokens**
4. 等待几秒钟

建议获取至少 **1 SUI**（可以支持约 1000 次交易）。

### 4.3 验证余额

再次运行测试：

```bash
npm test
```

应该看到：
```
✅ Balance: 1.0000 SUI
   Estimated transactions: ~1000
```

## 📝 步骤 5：测试配置

运行完整测试：

```bash
npm test
```

**预期输出：**

```
🧪 Testing Sponsor Wallet Configuration...

1️⃣ Checking environment variables...
✅ SPONSOR_PRIVATE_KEY found
✅ SUI_RPC_URL: https://rpc-testnet.onelabs.cc:443
✅ Contract addresses configured

2️⃣ Loading sponsor wallet...
✅ Sponsor wallet loaded
   Address: 0xabc123...

3️⃣ Connecting to Sui network...
✅ Connected to Sui network
   Chain ID: ...

4️⃣ Checking sponsor wallet balance...
✅ Balance: 1.0000 SUI
   Estimated transactions: ~1000

5️⃣ Checking gas coins...
✅ Gas coins found: 1
   First coin: 0xdef456...

6️⃣ Verifying contract...
✅ Package found: 0x2065f3f...

==================================================
✅ All checks passed!
🚀 Your sponsor wallet is ready to use!
==================================================
```

如果所有检查都通过，说明配置成功！

## 📝 步骤 6：启动服务器

```bash
npm start
```

**预期输出：**

```
✅ Sponsor wallet loaded: 0xabc123...
🚀 Taixu Backend running on http://localhost:3001
📝 Sponsor wallet will pay gas for all player transactions
```

## 📝 步骤 7：测试 API

打开新的命令行窗口，测试健康检查：

```bash
curl http://localhost:3001/health
```

**预期响应：**

```json
{
  "status": "ok",
  "message": "Taixu Backend is running"
}
```

## ✅ 完成！

你的后端服务器现在已经准备好了！

## 🔧 常见问题

### Q1: 测试失败 - SPONSOR_PRIVATE_KEY not set

**原因：** `.env` 文件不存在或私钥未填写

**解决：**
1. 确认 `.env` 文件存在（不是 `.env.example`）
2. 打开 `.env` 文件
3. 确认 `SPONSOR_PRIVATE_KEY=` 后面有你的私钥
4. 确认没有多余的空格或引号

### Q2: 测试失败 - Failed to load wallet

**原因：** 私钥格式不正确

**解决：**
1. 私钥应该是 64 位十六进制字符串
2. 不要包含 `0x` 前缀
3. 不要有空格或换行
4. 只包含字符：0-9, a-f

### Q3: 余额为 0

**原因：** 钱包没有代币

**解决：**
1. 访问水龙头：https://faucet.onechain.com/
2. 输入你的赞助钱包地址
3. 请求代币
4. 等待几秒后重新测试

### Q4: 端口 3001 被占用

**原因：** 其他程序正在使用 3001 端口

**解决：**

方式 1 - 更改端口：
```env
# 在 .env 中
PORT=3002
```

方式 2 - 停止占用端口的程序：
```bash
# 查找占用端口的程序
netstat -ano | findstr :3001

# 结束进程（替换 PID）
taskkill /PID <进程ID> /F
```

### Q5: 连接 RPC 失败

**原因：** 网络问题或 RPC 地址错误

**解决：**
1. 检查网络连接
2. 确认 RPC URL 正确
3. 尝试访问：https://rpc-testnet.onelabs.cc:443
4. 如果无法访问，可能需要 VPN

## 📊 监控钱包

启动监控脚本实时查看钱包状态：

```bash
npm run monitor
```

这会显示：
- 钱包地址
- 当前余额
- 最近 10 笔交易
- Gas 使用统计

每 30 秒自动更新。

## 🔐 安全建议

1. **不要分享私钥**
   - 私钥就是钱包的完全控制权
   - 不要发送给任何人
   - 不要截图或复制到不安全的地方

2. **使用专用钱包**
   - 创建一个新钱包专门用于赞助
   - 不要用存有大量资产的主钱包
   - 只存放必要的代币

3. **限制余额**
   - 不要在赞助钱包存放过多代币
   - 定期检查余额
   - 及时补充，但不要过量

4. **备份私钥**
   - 将私钥安全保存（纸质备份）
   - 存放在安全的地方
   - 考虑使用密码管理器

5. **监控使用**
   - 定期查看交易记录
   - 注意异常交易
   - 设置余额告警

## 🚀 下一步

1. 启动前端：`cd ../taixuchain && npm run dev`
2. 测试完整流程：创建角色
3. 查看监控：`npm run monitor`
4. 阅读文档：`../QUICK_START.md`

## 📚 相关文档

- [快速开始](../QUICK_START.md)
- [架构说明](../ARCHITECTURE.md)
- [部署检查清单](../CHECKLIST.md)
- [实现总结](../IMPLEMENTATION_SUMMARY.md)

---

**需要帮助？** 查看故障排除部分或联系技术支持。

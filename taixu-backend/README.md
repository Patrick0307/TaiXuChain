# Taixu Backend - Sponsored Transaction Server

这是 Taixu 游戏的后端服务器，用于处理赞助交易（Sponsored Transactions）。

## 功能

- 🎮 **赞助创建角色** - 玩家创建角色时，由项目方支付 gas 费用
- 💰 **零门槛** - 玩家不需要任何代币即可开始游戏
- 🔒 **安全** - 玩家仍需签名确认操作

## 快速开始

### 1. 安装依赖

```bash
cd taixu-backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
copy .env.example .env
```

编辑 `.env` 文件，填入你的钱包私钥：

```env
# 从 OneChain 钱包导出私钥
# 设置 -> 安全 -> 导出私钥
SPONSOR_PRIVATE_KEY=你的私钥

# 其他配置已经预设好了
```

⚠️ **重要安全提示：**
- 不要将 `.env` 文件提交到 Git
- 私钥要保密，不要分享给任何人
- 建议使用专门的赞助钱包，不要用主钱包

### 3. 确保赞助钱包有余额

你的赞助钱包需要有一些 SUI/OCT 代币来支付 gas：

- **测试网水龙头**: https://faucet.onechain.com/
- 建议至少有 1 SUI/OCT（可以支持数千次交易）

### 4. 启动服务器

```bash
npm start
```

或者使用开发模式（自动重启）：

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

### 5. 测试服务器

打开浏览器访问：
```
http://localhost:3001/health
```

应该看到：
```json
{
  "status": "ok",
  "message": "Taixu Backend is running"
}
```

## API 接口

### POST /api/sponsor/create-player

创建玩家角色（赞助交易）

**请求体：**
```json
{
  "playerAddress": "0x...",
  "name": "玩家名称",
  "classId": 1
}
```

**响应：**
```json
{
  "success": true,
  "result": {
    "digest": "交易哈希",
    "effects": { ... }
  },
  "message": "Player created successfully with sponsored gas"
}
```

## 成本估算

- 每次创建角色约消耗：0.001 SUI/OCT
- 1 SUI/OCT 可以支持约 1000 个玩家注册
- 测试网代币免费，可以从水龙头获取

## 前端配置

在前端项目的 `.env` 文件中添加：

```env
VITE_BACKEND_URL=http://localhost:3001
```

## 部署到生产环境

### 使用 PM2（推荐）

```bash
npm install -g pm2
pm2 start server.js --name taixu-backend
pm2 save
pm2 startup
```

### 使用 Docker

```bash
docker build -t taixu-backend .
docker run -d -p 3001:3001 --env-file .env taixu-backend
```

## 安全建议

1. **使用专用赞助钱包** - 不要用主钱包
2. **限制赞助次数** - 可以添加每个地址的赞助次数限制
3. **监控余额** - 定期检查赞助钱包余额
4. **使用 HTTPS** - 生产环境必须使用 HTTPS
5. **添加速率限制** - 防止滥用

## 故障排除

### 错误：SPONSOR_PRIVATE_KEY not set

确保 `.env` 文件存在且包含正确的私钥。

### 错误：Sponsor wallet has no gas coins

赞助钱包余额不足，需要从水龙头获取代币。

### 错误：Connection refused

确保后端服务器正在运行，检查端口是否被占用。

## 许可证

MIT

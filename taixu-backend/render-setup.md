# Render 部署指南

## 快速部署步骤

### 1. 准备工作
- 确保代码已推送到 GitHub/GitLab/Bitbucket
- 准备好所有环境变量的值（从 `.env` 文件）

### 2. 在 Render 上部署

#### 方式 A：使用 render.yaml（推荐）
1. 访问 [render.com](https://render.com) 并登录
2. 点击 "New +" → "Blueprint"
3. 连接你的 Git 仓库
4. Render 会自动检测到 `render.yaml` 文件
5. 填写敏感环境变量（标记为 `sync: false` 的变量）：
   - `SPONSOR_PRIVATE_KEY`
   - `PACKAGE_ID`
   - `REGISTRY_ID`
   - `MARKETPLACE_ID`
   - `WEAPON_MINT_CAP`
   - `LINGSTONE_PACKAGE_ID`
   - `LINGSTONE_TREASURY_CAP`
   - `WEAPON_DEPLOY_PRIVATE_KEY`
6. 点击 "Apply" 开始部署

#### 方式 B：手动创建 Web Service
1. 访问 [render.com](https://render.com) 并登录
2. 点击 "New +" → "Web Service"
3. 连接你的 Git 仓库
4. 配置：
   - **Name**: `taixu-backend`
   - **Root Directory**: `taixu-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: 选择 Free 或 Starter
5. 在 "Environment" 标签添加所有环境变量
6. 点击 "Create Web Service"

### 3. 环境变量配置

在 Render Dashboard → 你的服务 → Environment 中添加：

```
SPONSOR_PRIVATE_KEY=你的私钥
SUI_RPC_URL=https://rpc-testnet.onelabs.cc:443
PACKAGE_ID=0xa79ef1da9c93429f23ce943c9d53466ede3428d4c7749bd5bc922dc4909a9282
REGISTRY_ID=0x0bcd52c6da276932d518a4f07d0dded8eafc17d5e99009b43a007c568ed5adea
MARKETPLACE_ID=0x20f8b6f5b5bfdcec1aa6063c0160b99f56bbe4f632a585147e7d774b6af176c1
WEAPON_MINT_CAP=0x3e676e7e000d78670a67aec6ec8e8da175a4bbfe6056a4ff5dbe905fe2501199
LINGSTONE_PACKAGE_ID=0xa79ef1da9c93429f23ce943c9d53466ede3428d4c7749bd5bc922dc4909a9282
LINGSTONE_TREASURY_CAP=0x5c39572fdaf20c9e5b1efb5afe3032724c1cc9b86438402929a6aa9e4cbe4119
WEAPON_DEPLOY_PRIVATE_KEY=你的部署钱包私钥
```

### 4. 部署完成

部署成功后，你会得到一个 URL，例如：
```
https://taixu-backend.onrender.com
```

测试健康检查：
```bash
curl https://taixu-backend.onrender.com/health
```

### 5. 更新前端配置

在 `taixuchain` 项目中更新 API 地址：
- 找到前端代码中的 API 配置
- 将 `http://localhost:3001` 替换为你的 Render URL
- 例如：`https://taixu-backend.onrender.com`

## 重要提示

### 免费层限制
- 15 分钟不活动后会休眠
- 首次请求需要等待服务唤醒（~30秒）
- 每月 750 小时免费运行时间

### 付费层优势（Starter $7/月）
- 服务不会休眠，始终在线
- 更快的响应速度
- 更多的资源

### WebSocket 支持
- Render 完全支持 WebSocket
- 你的多人游戏功能可以正常工作
- 不需要额外配置

### 自动部署
- 每次推送到主分支会自动触发部署
- 可以在 Render Dashboard 查看部署日志
- 可以手动触发重新部署

## 故障排查

### 查看日志
在 Render Dashboard → 你的服务 → Logs

### 常见问题
1. **服务启动失败** - 检查环境变量是否都已配置
2. **WebSocket 连接失败** - 确保前端使用 `wss://` 而不是 `ws://`
3. **CORS 错误** - 检查 CORS 配置是否包含你的前端域名

### 健康检查
Render 会定期访问 `/health` 端点检查服务状态
如果连续失败，会自动重启服务

## 监控和维护

### 查看服务状态
- Dashboard 显示 CPU、内存使用情况
- 可以查看请求日志和错误日志

### 手动重启
如果需要重启服务：
Dashboard → 你的服务 → Manual Deploy → Deploy latest commit

### 回滚
如果新版本有问题：
Dashboard → 你的服务 → Events → 选择之前的部署 → Rollback

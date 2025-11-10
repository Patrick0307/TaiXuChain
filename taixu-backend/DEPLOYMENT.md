# Vercel 部署指南

## 部署步骤

### 1. 安装 Vercel CLI（可选）
```bash
npm install -g vercel
```

### 2. 在 Vercel 网站部署

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub/GitLab 账号登录
3. 点击 "Add New Project"
4. 导入你的 Git 仓库
5. 配置项目：
   - **Root Directory**: `taixu-backend`
   - **Framework Preset**: Other
   - **Build Command**: 留空
   - **Output Directory**: 留空

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

- `SPONSOR_PRIVATE_KEY`: 你的赞助钱包私钥
- `SUI_RPC_URL`: `https://rpc-testnet.onelabs.cc:443`
- `PACKAGE_ID`: `0x2065f3f546d076e2a67de7900e471601e4fda71d34749143b3aa7fdf0fbcf9d5`
- `REGISTRY_ID`: `0x1586d814c0cd790cf281073d8a2de6f8cf398001866b2c717154f4c5a18572d9`

### 4. 部署

点击 "Deploy" 按钮，Vercel 会自动部署你的应用。

### 5. 使用 CLI 部署（可选）

```bash
cd taixu-backend
vercel
```

按照提示操作即可。

## 部署后

部署成功后，你会得到一个 URL，例如：
```
https://your-project.vercel.app
```

### API 端点

- 健康检查: `GET https://your-project.vercel.app/health`
- 查询玩家: `GET https://your-project.vercel.app/api/player/:address`
- 创建角色: `POST https://your-project.vercel.app/api/sponsor/create-player`

## 更新前端配置

部署后，记得更新前端项目 `taixuchain/.env` 中的 API 地址：

```env
VITE_BACKEND_URL=https://your-project.vercel.app
```

## 注意事项

1. **私钥安全**: 确保 `SPONSOR_PRIVATE_KEY` 只在 Vercel 环境变量中配置，不要提交到 Git
2. **免费额度**: Vercel 免费版有使用限制，注意监控
3. **冷启动**: Serverless 函数可能有冷启动延迟（首次请求较慢）
4. **日志查看**: 在 Vercel Dashboard 可以查看实时日志

## 故障排查

如果部署失败：
1. 检查环境变量是否正确配置
2. 查看 Vercel 部署日志
3. 确保 `package.json` 中的依赖都已正确安装
4. 检查 Node.js 版本兼容性（Vercel 默认使用 Node 18+）

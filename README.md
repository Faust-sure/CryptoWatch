# 项目归档与目录整理说明

本仓库为 CryptoWatch/CryptoPhone 项目收尾归档版本，已进行最少侵入的目录整理，并排除了敏感信息与本地依赖，便于公开托管与后续查看。

## 目录结构
- `clients/`：前端客户端（UniApp）
  - `CryptoWatch/`
  - `CryptoPhone/`
- `server/`：服务端与部署脚本（原 `server-deploy/`）
- `web-test-pages/`：测试与演示页面
- `experiments/website-sim-success/`：阶段性实验与调试产物（原“7，网站模拟成功了”）
- `scripts/`：常用脚本（安装、诊断、下载工具等）
- `docs/`：说明文档与记录（`docs/archive/` 存放历史归档）
- `archive/`：其他历史/大型备份（如第三方SDK示例等）

## 敏感信息与配置
- 已通过 `.gitignore` 排除 `aliyun_config.json` 及相似命名文件，避免将 Token/密钥提交到仓库。
- 如需运行服务端，请在 `server/` 目录创建 `aliyun_config.json` 或参考 `aliyun_config.example.json` 手动填入必要字段（仅示例字段，不含真实值）。

## 本地快速开始（服务端）
```bash
cd server
npm install
# 需要本地存在 aliyun_config.json（参考 example 模板）
node server.js
```

## 推送到 GitHub（如果本地未配置远程）
```bash
git init -b main
git add .
git commit -m "chore: archive project, clean secrets, and structure folders"
# 替换 <your-repo-url> 为你的 GitHub 仓库地址
git remote add origin <your-repo-url>
git push -u origin main
```

如需我直接创建远程仓库并推送，请提供你的 GitHub 仓库 URL（或授权方式）。

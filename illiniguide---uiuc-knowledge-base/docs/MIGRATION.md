# 🚀 快速开始: 迁移到 Dify

## 立即开始 (5 分钟快速配置)

### 1️⃣ 注册 Dify 和 DeepSeek

```bash
# 打开以下网站并注册:
# Dify Cloud: https://cloud.dify.ai
# DeepSeek: https://platform.deepseek.com
```

### 2️⃣ 配置环境变量

```bash
# 复制环境变量模板
cp .env.local.example .env.local

# 编辑 .env.local,填入你的 API Key
# VITE_DIFY_API_KEY=app-xxxxx (从 Dify 获取)
```

### 3️⃣ 切换到 Dify Service

在 `components/ChatScreen.tsx` 中:

```typescript
// 修改第 5 行:
// 从:
import { streamChatResponse } from '../services/cozeService';

// 改为:
import { streamChatResponse } from '../services/difyService';
```

### 4️⃣ 启动测试

```bash
npm run dev
```

---

## 📚 完整文档

详细的迁移步骤请查看:
- **完整指南**: 查看 AI 生成的 `migration-guide.md`
- **任务清单**: 查看 AI 生成的 `task.md`

---

## 💰 成本对比

| 方案 | 月成本 (1万次对话) |
|------|------------------|
| Coze | ¥200-500 |
| **Dify + DeepSeek** | **¥12-20** ✨ |
| **节省** | **90%+** |

---

## 🆘 需要帮助?

- 📖 [Dify 官方文档](https://docs.dify.ai)
- 💬 [Dify Discord](https://discord.gg/dify)
- 📧 [DeepSeek 支持](https://platform.deepseek.com)

---

## ✅ 迁移检查清单

- [ ] 注册 Dify Cloud 账号
- [ ] 获取 DeepSeek API Key
- [ ] 在 Dify 中配置 DeepSeek
- [ ] 创建知识库并上传文档
- [ ] 创建 AI 应用
- [ ] 获取 Dify API Key
- [ ] 配置 `.env.local`
- [ ] 修改 `ChatScreen.tsx` 导入
- [ ] 测试功能

**预计时间**: 30-60 分钟

开始迁移吧! 🚀

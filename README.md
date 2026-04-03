# AI Leadership 评估网页（对话式）

一个简单可运行的在线评估窗口：

- 网页对话框交互（AI提问，用户回答）
- 开场支持被评估人自我介绍（职责、团队规模、业务场景、评估目标）
- 混合题型（开放题 + 选择题）
- 自动生成报告
- 双雷达图（角色雷达评分 / 能力雷达评分）
- 10维度深度评价（事实依据 + 深层判断 + 维度级30/60/90动作）

## 目录结构

```text
ai-leadership-assessment-web/
  ├─ public/
  │  ├─ index.html
  │  ├─ app.js
  │  └─ styles.css
  ├─ server.js
  ├─ package.json
  └─ .env.example
```

## 快速启动

1. 安装依赖

```bash
npm install
```

2. （可选）配置模型

```bash
cp .env.example .env
```

在 `.env` 中填写 `OPENAI_API_KEY`（或 `DEEPSEEK_API_KEY`）后，报告文案将优先使用模型生成；未配置则使用内置规则生成。

默认模型配置为 DeepSeek：

```env
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-chat
```

3. 启动服务

```bash
npm start
```

4. 打开浏览器

访问 [http://localhost:3000](http://localhost:3000)

## 接口说明

- `POST /api/start`：初始化会话并返回第一题
- `POST /api/answer`：提交当前题目答案并返回下一题
- `POST /api/report`：生成评估报告（双雷达图 + 文案）
- `GET /api/health`：健康检查

## 说明

- 当前版本会把会话保存在内存中（服务重启后清空）。
- 维度与权重采用 10 维模型（角色5维 + 能力5维），1-5分制。
- 双雷达图分组为：
  - 角色雷达：偏职责事项
  - 能力雷达：偏个体能力

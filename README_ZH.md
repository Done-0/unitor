# Unitor - Claude Code 插件

复杂软件项目的多 AI 协作。

此插件编排 Codex、Gemini 和 Claude 作为团队协作 - 讨论需求、协商 API 契约、自主实现完整的全栈应用。

## 你将获得什么

- `/unitor:collab` 用于复杂任务的多 AI 协作
- `/unitor:route` 用于智能单领域任务路由
- `/unitor:config` 和 `/unitor:status` 用于团队管理

## 要求

- **Claude Code**
- **Node.js 18.18 或更高版本**
- **Gemini CLI**（可选，用于前端协作）
- **Codex CLI**（可选，用于后端协作）

> [!NOTE]
> Unitor 只用 Claude 也能工作。Gemini 和 Codex 是可选的，但强烈推荐用于多 AI 协作。没有它们，所有任务会路由到 Claude。

## 安装

在 Claude Code 中添加市场：

```bash
/plugin marketplace add Done-0/unitor
```

安装插件：

```bash
/plugin install unitor@Done-0
```

重新加载插件：

```bash
/reload-plugins
```

插件现在可以使用了。默认情况下 Gemini 和 Codex 已启用但不是必需的。

### 设置 Gemini（可选）

如果你想让 Gemini 处理前端任务：

```bash
npm install -g @google/gemini-cli
gemini  # 首次运行授权
```

### 设置 Codex（可选）

如果你想让 Codex 处理后端任务：

```bash
npm install -g @openai/codex
codex login
```

检查提供商状态：

```bash
/unitor:status
```

你会看到哪些提供商可用。如果 Gemini 或 Codex 未安装，它们会显示为不可用，任务会路由到 Claude。

### 设置状态栏（可选）

启用实时状态栏显示 AI 团队活动：

```bash
/unitor:setup
```

状态栏会显示：
- 提供商状态（启用/禁用）
- 活跃的协作会话，包含参与者、阶段和讨论预览
- 无活跃会话时显示最近的任务

禁用状态栏：

```bash
claude config unset statusline.command
```

## 工作原理

### 多 AI 协作

当你运行 `/unitor:collab` 处理多领域任务时，Unitor 编排真实的 AI 间协作：

1. **检测领域** - 识别后端、前端、数据库需求
2. **分配专家** - 路由到 Codex（后端）、Gemini（前端）、Claude（架构）
3. **圆桌讨论** - AI 讨论需求并协商 API 契约
4. **自主实现** - 每个 AI 实现各自部分
5. **验证** - 系统验证集成

示例：

```bash
/unitor:collab "构建用户列表页面：React 前端和 Express 后端，GET /api/users"
```

**会发生什么：**
- Codex 提出后端 API 结构
- Gemini 提出前端组件设计
- 他们协商数据格式（对象包装 vs 数组）
- 双方实现并创建实际文件
- 系统验证集成

**结果：** 在 `user-list-app/` 中创建完整可运行应用：
```
user-list-app/
├── backend/server.mjs       # Express API，端口 3001
├── frontend/src/App.jsx     # React 应用
└── README.md                # 设置说明
```

### 单领域路由

对于单领域任务，`/unitor:route` 选择最佳专家：

- 前端/CSS → Gemini
- 后端/API → Codex  
- 架构/安全 → Claude

路由使用基于每个 AI 专长的标签权重匹配。

## 使用方法

### `/unitor:collab`

编排多个 AI 协作完成复杂任务。

使用场景：
- 多个 AI 共同完成全栈功能
- 一次性实现后端和前端
- 真实 AI 讨论和协商

示例：

```bash
/unitor:collab "构建用户认证：React 登录表单 + Express JWT API"
/unitor:collab "创建待办事项应用，React 前端和 Express 后端"
```

> [!NOTE]
> 协作需要 5-8 分钟。AI 讨论、协商、实现、验证。这是真实工作，不是即时生成。

### `/unitor:route`

将单领域任务路由到最佳专家。

使用场景：
- 前端任务由 Gemini 处理
- 后端任务由 Codex 处理
- 快速路由，无协作开销

示例：

```bash
/unitor:route "修复登录按钮样式"
/unitor:route "实现用户认证 API"
/unitor:route "重构认证架构"
```

### `/unitor:config`

管理你的 AI 团队配置。

查看当前设置：

```bash
/unitor:config --show
```

配置模型：

```bash
/unitor:config --set-model gemini gemini-2.0-flash-exp
/unitor:config --set-model codex gpt-5.4
```

启用/禁用提供商：

```bash
/unitor:config --enable gemini
/unitor:config --disable codex
```

### `/unitor:status`

检查提供商健康状态和最近任务。

```bash
/unitor:status
/unitor:status --json
```

## 典型流程

### 多领域功能

```bash
/unitor:collab "构建用户资料页面，包含 API 和 React UI"
```

### 单领域任务

```bash
/unitor:route "在导航栏添加搜索框"
```

### 检查团队状态

```bash
/unitor:status
```

## 支持的 AI 提供商

| 提供商 | 最适合 | 默认模型 |
|--------|--------|----------|
| Claude | 架构、安全、编排 | claude-sonnet-4-6 |
| Gemini | 前端 UI、CSS、React/Vue | gemini-flash-latest |
| Codex | 后端 API、数据库、Python/Go | gpt-5.4 |

## 生产特性

- **真实 AI 协作** - 调用真实的 Codex 和 Gemini CLI，不是模拟
- **自主共识** - AI 检测协议并进入实现阶段
- **文件验证** - 验证实际文件内容符合约定契约
- **重试逻辑** - 瞬态错误重试 2 次，指数退避
- **超时保护** - 默认 300 秒，每个提供商可配置
- **成本保护** - 每次协作最多 50 次提供商调用
- **优雅降级** - 一个 AI 失败时继续

## 常见问题

### 我需要安装 Gemini 和 Codex 吗？

对于**路由**（`/unitor:route`）：不需要。没有它们，所有任务路由到 Claude。

对于**协作**（`/unitor:collab`）：强烈推荐。多 AI 协作至少需要 2 个不同提供商。只有 Claude 会失去协作优势。

### 多 AI 协作如何工作？

Unitor 生成真实的 CLI 进程：
- Codex：`codex exec "<提示>"`
- Gemini：`gemini --prompt "<提示>"`

每个 AI 接收完整对话历史并自然回应。系统通过分析响应中的协议信号和未解决问题来检测共识。

这不是模拟 - 是真实的 AI 间通信。

### 为什么协作需要几分钟？

真实 AI 协作涉及：
- 讨论轮次（每个 AI 每轮 30-60 秒）
- 文件创建（完整项目 2-5 分钟）
- 验证（读取和验证文件）

典型的 3 轮协作需要 5-8 分钟。这是生产级工作。

### 如果 AI 超时怎么办？

系统重试两次。如果都失败：
- 将 AI 标记为暂时不可用
- 与剩余 AI 继续
- 其他 AI 仍可完成各自部分

### 我能看到对话历史吗？

可以。协作输出显示所有轮次和完整 AI 响应。

### 如何安装 Gemini CLI？

```bash
npm install -g @google/gemini-cli
gemini  # 首次运行授权
```

### 如何安装 Codex CLI？

```bash
npm install -g @openai/codex
codex login
```

### 它会使用我现有的 CLI 配置吗？

是的。Unitor 使用你的本地 CLI 安装，并采用现有身份验证和配置。

### 我可以使用不同的模型吗？

可以：

```bash
/unitor:config --set-model gemini gemini-2.0-flash-exp
/unitor:config --set-model codex gpt-5.4
```

### 如果提供商失败会怎样？

对于**路由**：重试，然后降级到 Claude。

对于**协作**：重试两次，然后标记为不可用并与剩余 AI 继续。

### 协作成本是多少？

取决于你的提供商定价：
- Codex（OpenAI）：每次协作约 $0.01-0.05
- Gemini（Google）：通常有免费层
- 成本保护：每次协作最多 50 次提供商调用

典型 3 轮协作：总共 6-10 次 API 调用。

## 许可证

MIT

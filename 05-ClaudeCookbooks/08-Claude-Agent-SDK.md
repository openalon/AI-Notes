---
id: n_c7c798a1443d
---

# 第 8 章：Claude Agent SDK

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://github.com/anthropics/claude-cookbooks/tree/main/claude_agent_sdk">claude_agent_sdk/</a> · 状态：已读</p>
</details>

## 一句话

**Agent SDK 把 query loop 收成你进程里的运行时：同一套 Read / Edit / Bash / 权限 / 缓存，从 one-liner 到可托管。** `query()` 无状态；生产多轮用 `ClaudeSDKClient`。SDK 把循环放在你这边，下一章 CMA 把循环收到服务端——对照着读，不是升级关系。

## 核心概念

### `query()`：无状态 one-liner

`00_The_one_liner_research_agent.ipynb`：研究任务的路径事先不知道，所以适合 agent 而不是固定 workflow。几行：`query()` + `allowed_tools=["WebSearch"]`。模型自己决定搜什么、何时停。

权限模型：`allowed_tools` 可自由用；其它工具要批准；只读默认开；`disallowed_tools` 从上下文里拿掉。无状态适合一次性、可并行的独立问题；多轮调查、基于上次发现再搜，要换 client。

生产向的三步：`ClaudeSDKClient` 保记忆；system prompt 写研究标准；`Read` 吃图表和截图。

### Chief of Staff：CLAUDE.md 是上下文不是枷锁

`01_The_chief_of_staff_agent.ipynb` 往上叠：memory、output styles、plan mode、subagents、hooks、自定义命令。和 Claude Code 同运行时——仓库里的 `CLAUDE.md` 进上下文，**约束仍靠权限和 hook**，不是靠模型「答应遵守」。Bash 脚本当工具，output style 管交卷格式（第 1 章契约在 SDK 里的位置）。

### Observability → SRE：MCP 从读到写

`02_The_observability_agent.ipynb`：Git MCP（约 13 个本地 git 工具）→ GitHub MCP（100+，Docker + PAT）。agent 从看仓库变成看 Actions、分辨真失败和安全限制。模块化成 `send_query`，`continue_conversation=True` 接多轮。

`03_The_site_reliability_agent.ipynb` 再进一步：**能改配置、能重启**。本地 Docker 模拟 PG + FastAPI + Prometheus。MCP 12 个工具分四类（指标 / 日志 / 配置 / 控制）。要点：

- 写权限靠目录限制、命令 allowlist、validation hook，不靠「请小心」
- **工具 description 比长 prompt 更能驱动自主行为**
- HITL：调查和修复拆开，你决定何时放行

### 从 OpenAI Agents SDK 搬家

`04_migrating_from_openai_agents_sdk.ipynb` 用报销审批当单一例子。你继承 Claude Code 的内置工具、分层权限、自动 cache、事件流。工具要显式 schema，循环你来开。多数 port：**每个工具更啰嗦，别处更少样板**。

| OpenAI | Claude |
|---|---|
| `Agent(...)` + `Runner.run` | `ClaudeAgentOptions` + `ClaudeSDKClient` |
| `@function_tool` | `@tool` + `create_sdk_mcp_server`（进程内 MCP，无网络） |
| input/output guardrail | 循环前后的普通函数（或 `UserPromptSubmit` hook） |
| Sessions / `conversation_id` | 同一 client；`resume=session_id` 落盘 |
| 内置 tracing | OTel → 你已有的 Grafana/Datadog |
| `handoffs` | `AgentDefinition` + Agent tool |

`allowed_tools` 里自定义工具名是 `mcp__{server}__{tool}`。只读自定义工具默认直接跑；写文件 / shell 要 `permission_mode`。

### Session 是产品对象

`05_Building_a_session_browser.ipynb`：SDK 把对话写成 JSONL，并提供列表 / 读消息 / 重命名 / 打标签 / **在任意点 fork 再 `query()`**。agent 循环是产品一半，另一半是侧边栏。Claude Code Desktop / VS Code 就是这些原语。

其余：`06` 安全向检测；`07` 进程外托管；`08` 运行时编排 subagent；`scheduled_repository_reviewer` 定时审仓库。编号顺序就是复杂度顺序。

对照 recipe（按编号走）：

| 路径 | 钉的是什么 |
|---|---|
| `claude_agent_sdk/00_The_one_liner_research_agent.ipynb` | 最小可运行 agent |
| `claude_agent_sdk/01_The_chief_of_staff_agent.ipynb` | 记忆、style、subagent、hook |
| `claude_agent_sdk/02_The_observability_agent.ipynb` | MCP 读外部系统 |
| `claude_agent_sdk/03_The_site_reliability_agent.ipynb` | 作用域内的写和 HITL |
| `claude_agent_sdk/04_migrating_from_openai_agents_sdk.ipynb` | 控制面怎么搬家 |
| `claude_agent_sdk/05_Building_a_session_browser.ipynb` | session 是一等对象 |
| `claude_agent_sdk/06_The_vulnerability_detection_agent.ipynb` | 安全向 agent |
| `claude_agent_sdk/07_Hosting_the_agent.ipynb` | 进程外托管 |
| `claude_agent_sdk/08_Dynamic_workflows.ipynb` | 运行时编排 subagent |
| `claude_agent_sdk/scheduled_repository_reviewer/scheduled_repository_reviewer.ipynb` | 定时仓库审查 |

## 关键洞察

SDK 的价值不是「比 Messages API 更能写代码」，是 **把 Claude Code 已经打磨过的循环、权限、工具、session 文件交给你的产品**。`query()` 演示智能；`ClaudeSDKClient` + `allowed_tools` + hook 才是控制面。SRE notebook 把第 3 章的权限课上到基础设施：description 驱动行为，allowlist 驱动安全。

Guardrail 从框架装饰器变回普通函数——拒绝逻辑留在你的代码里，而不是藏进 SDK 对象。这和 moderation 第 1 章「模型不判刑」是亲戚。

## 个人思考

读完 00–05 已经够用。06–08 和定时审查是同一运行时的领域皮肤。若你的问题是「不想运维循环」，下一章 CMA；若你要 IDE / 桌面 / 自建权限，留在 SDK。

## 相关

- [[00-Cookbooks阅读地图]]
- [[03-QueryLoop代理系统的心跳]]
- [[05-Agent工作流]]
- [[09-Managed-Agents]]
- [[04-工具权限与中断]]

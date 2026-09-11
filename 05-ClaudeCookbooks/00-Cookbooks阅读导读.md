---
id: n_a458a2b22fc6
---

# Cookbooks阅读导读：怎么把 95 道 recipe 读成一本书

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://github.com/anthropics/claude-cookbooks">anthropics/claude-cookbooks</a> · 状态：已读 · 官方仓库 95 条 recipe，另有未进目录的 Managed Agents notebook</p>
</details>

## 一句话

**Cookbooks 不是「Claude 会什么」的展览，而是「把不稳的模型接进真实工作流时，约束该按什么顺序钉上去」的练习册。** 上游按文件夹堆例子；这本笔记按工程依赖重排。

## 一张图看懂

```mermaid
flowchart TD
  O[1 输出契约 JSON / 引用 / 分类] --> R[2 检索 RAG / SQL / 图谱]
  O --> T[3 工具：何时调用、并行、代码里调工具]
  R --> Ctx[4 上下文：缓存 / 压缩 / 记忆 / 思考]
  T --> Ctx
  Ctx --> W[5 工作流：流水线 / 编排 / 评测再改]
  W --> M[6 多模态]
  W --> S[7 Skills]
  S --> SDK[8 Agent SDK]
  W --> SDK
  SDK --> MA[9 托管 Agents]
  MA --> E[10 评测与成本]
  MA --> Obs[11 用量 / 预算 / 地理]
  W --> Int[12 第三方集成]
```

先钉「交什么」，再钉「能碰什么」，再谈「怎么编排」，最后才是托管和账单。跳过前四章直接抄 SDK 示例，常见结果是 agent 能跑、不能验收。

## 核心概念

### 为什么不当成文件夹笔记

官方仓库的顶层目录是产品面切片：`capabilities/`、`tool_use/`、`claude_agent_sdk/`、`managed_agents/`……同一条工程判断会散在四处。例如「上下文装不下」同时出现在 `misc/prompt_caching`、`tool_use/automatic-context-compaction`、`tool_use/context_engineering/`。按文件夹抄，你会得到 95 篇摘要，得不到一条可执行的顺序。

这本笔记把 registry 收成 12 章，一章一个约束。recipe 清单写在各章里，不在本库复制 `.ipynb`。

### 三大部分，不是三套 API

| 部分 | 章 | 你读完该会什么 |
|---|---|---|
| Part 1 约束 | 1–4 | 能规定输出形状、检索边界、工具权限和上下文预算 |
| Part 2 工作流 | 5–7 | 能把单次调用收成 pipeline / 多代理 / Skills |
| Part 3 产品 | 8–12 | 能在 Agent SDK 或托管 Agents 上落地，并知道怎么评、怎么花钱、怎么接第三方 |

和 [[00-GDW阅读导读]] 是同一类判断：Fullerton 用试玩循环约束「我觉得好玩」；这里用输出契约 + 工具边界 + 评测约束「我觉得模型答对了」。两边都拒绝指望一次就做对。

### 和 Harness 书怎么对

| | Book 1 Harness | 这本书 |
|---|---|---|
| 样本 | Claude Code 运行时 | Messages API / Agent SDK / 托管 Agents 的可复制 recipe |
| 控制面 | Prompt 拼装、CLAUDE.md、hook | system + tools + skills + session |
| 心跳 | 主循环 | 工作流图、session、子代理 |
| 权限 | 工具权限与中断 | 工具选择、沙箱、托管预算 |
| 上下文 | compact / memory | prompt cache、compaction、memory tool |
| 验证 | 多代理拆开合成与核查 | evaluator-optimizer、outcome grader、evals |

读 Cookbooks 是为了看见 **同一套原则在 API 层怎么被拆成可运行的最小例子**。不要指望 notebook 替代 Book 1 的制度判断。

### 目录源是官方食谱表，不是仓库里所有文件

`registry.yaml` 才是对外食谱表（写这份导读时 95 条）。仓库里还有未进 registry 的 notebook，例如：

- `managed_agents/CMA_gate_human_in_the_loop.ipynb`
- `managed_agents/CMA_explore_unfamiliar_codebase.ipynb`
- `managed_agents/CMA_orchestrate_issue_to_pr.ipynb`
- `tool_use/tool_search_alternate_approaches.ipynb`

章节清单会把它们标成「仓库内、未登记」。发现新 recipe 时改对应章的表，不必新开文件。

## 关键洞察

- **文件夹是仓储，章节是依赖。** 先会 JSON mode 再谈 customer service agent，不是品味问题，是验收顺序。
- **SDK 和托管 Agents 是同一套约束的两种封装。** SDK 把循环放在你的进程里；托管把循环、沙箱、session、预算收到服务端。第 8、9 章对照着读，不要当成两门课。
- **Evals 不是附录。** 没有评测的 agent 只能演示。第 10 章要和第 5、9 章交叉，而不是读完全书再补。
- **第三方集成是适配器，不是能力。** Pinecone / LlamaIndex / ElevenLabs 证明的是边界，不是「Claude 必须配这个库」。

## 个人思考

12 章已按依赖填完。开读仍从第 1 章输出契约进：模型一开口就可能形状不对，后面所有工具和检索都在放大这个错误。机制细节在各章，这份导读只负责顺序和对照。

官方 notebook 留在本机的 claude-cookbooks 仓库，本库只引用 GitHub 路径。不要把 notebook 拷进来——否则笔记和官方仓库会各写一份，以后对不上。

## 相关

- [[01-先钉输出]]
- [[00-序言]]
- [[00-GDW阅读导读]]

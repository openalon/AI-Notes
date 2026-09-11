---
id: n_ec2b8f15bf11
---

# 第 5 章：Agent 工作流

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://github.com/anthropics/claude-cookbooks/tree/main/patterns/agents">patterns/agents/</a> · 状态：已读</p>
</details>

## 一句话

**工作流是把单次调用收成可画出来的图，不是把模型叫成 agent。** 子任务能预先钉死就 chain / parallel / router；钉不死才上 orchestrator；生成和打分必须拆开；异步多代理先把邮箱和生命周期做对，再塞领域工具。

## 核心概念

### 三种还没到「agent」的图

`patterns/agents/basic_workflows.ipynb` 自己说了：示例不是生产代码。三张图：

| 图 | 做什么 | 例子 |
|---|---|---|
| Prompt-chaining | 顺序拆步，后一步吃前一步 | 抽结构再格式化 |
| Parallelization | 独立子任务同时跑 | 多利益相关方影响分析 |
| Routing | 按输入特征选专家路径 | 客服工单分流 |

贵或慢，换的是任务表现。子任务形状稳定时，不要上 orchestrator。

### Orchestrator-workers：运行时才决定拆什么

`orchestrator_workers.ipynb`：中心模型看任务，动态生成 2–3 个 XML 子任务，工人各自生成，编排者不当工人。营销文案变体是好例子——不同产品需要的角度事先不知道。

**用：** 最优拆法依赖这一次输入；要多视角对照。
**不用：** 单输出、延迟敏感、子任务每次都一样（直接 parallel）。

代价写死了：N+1 次调用；示例里工人还是串行，生产应用 `asyncio`。失败模式：编排者拆得烂（prompt 工程）、工人空响应、XML 解析碎（可改 JSON）。和 Book 1 [[07-多代理与验证]] 同一句：多代理解决职责分区，不是人海。

### Evaluator-optimizer：有尺子才配闭环

`evaluator_optimizer.ipynb` 两个适配信号：反馈能 demonstrably 改进输出；模型自己能给出有意义的反馈。例子是迭代写代码。没有清晰标准就不要上这个环——你会得到一对互相吹捧的模型。第 9 章 CMA outcome grader、第 10 章 evals 是同一原则的产品化和评测化。

### 异步多代理：先看消息路径

`async_multi_agent_orchestration.ipynb` 复现 Opus 4.8 系统卡里的两种形状，**没有领域任务**，故意只暴露工具开火顺序：

1. **固定 N 人团队**：inbox + `asyncio.Event`；`send_message` / `wait_for_message`；消息附加在最近一次 tool result 上，禁止轮询。
2. **动态 spawn**：lead 有 subagent 工具；spawn 立即返回；`get_status` / `wait_for_message` 收报告；`kill_subagents` 解散。

领域工具后来才挂到 `extra_dispatch`。先把邮箱、阻塞等待、生命周期做对，再谈「多智能体研究」。

### Haiku 前线，Opus 收口

`multimodal/using_sub_agents.ipynb`：Apple 2023 财报 PDF 表多，传统解析吃力，转成图给 Haiku 抽，Opus 写回答和 matplotlib。编排者（Opus）先为每个 Haiku 写专用 prompt。演示里 `exec` 模型代码——注释自己说了，沙箱外不要这样。模型分层：便宜模型读量大的模态，贵模型做合成和作图。第 9 章 plan-big/execute-small 是托管版。

对照 recipe：

| 路径 | 钉的是什么 |
|---|---|
| `patterns/agents/basic_workflows.ipynb` | 链式 / 路由 / 并行，还没到「agent」神话 |
| `patterns/agents/orchestrator_workers.ipynb` | 拆活给工人，编排者不当工人 |
| `patterns/agents/evaluator_optimizer.ipynb` | 生成和打分必须拆开 |
| `patterns/agents/async_multi_agent_orchestration.ipynb` | 先把邮箱和 spawn/kill 做对 |
| `multimodal/using_sub_agents.ipynb` | Haiku 当前线，Opus 收口 |

## 关键洞察

工作流选型是一张短表：形状稳定 → 三种基本图；形状依赖输入 → orchestrator；需要迭代质量 → evaluator；需要并行探索 → async spawn。每一档都多付 N 次调用。没有 evaluator 的 orchestrator，只是把错误复制成 N 份。

和 GDW 的 playtest loop 同构：先写下「怎样算过」，再让系统跑。工作流图是机制，尺子在第 1 章和第 10 章。

## 个人思考

第 8 章 SDK、第 9 章 CMA 会把这些图收成产品原语（subagent、multiagent roster、advisor）。先在 Messages API 上把图画画对，再搬运行时，否则你会把框架当能力。

## 相关

- [[00-Cookbooks阅读地图]]
- [[07-多代理与验证]]
- [[08-Claude-Agent-SDK]]
- [[09-Managed-Agents]]
- [[10-评测与成本]]

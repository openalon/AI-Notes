---
id: n_f48110a8c047
---

# 第 3 章：Query Loop — 代理系统的心跳

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://harness-books.agentway.dev/book1-claude-code/chapter-03-query-loop-heartbeat.html">原网页</a> · 状态：已读 · PDF：<a href="./book1-claude-code.pdf"><code>book1-claude-code.pdf</code></a> p.23–32</p>
</details>

## 一句话

**代理系统的核心能力，是维持可恢复的执行循环。** 一个系统能否被称为 agent，不在于它会不会说，而在于它几轮之后还知不知道自己在做什么。模型调用只是心跳中的一次收缩。

## 核心概念

把会写代码的模型当加强版问答接口，是最常见的错误。一旦开始调工具、跨轮执行、处理中断、保存状态、压缩上下文，「一问一答」就失效了。`query()` 只是壳，真正重要的是 `queryLoop()`：跨迭代状态 → 前置治理 → 流式模型 → 再决定工具执行、恢复、压缩、下一轮还是终止。

### 状态属于主业务

无状态看起来优雅，对代理系统作用有限。忽视状态并不能消除状态，只会让它以更难管理的方式返回。`query.ts` 把可变状态定义清楚并整体装配成 State：messages、toolUseContext、autoCompactTracking、maxOutputTokensRecoveryCount、hasAttemptedReactiveCompact、pendingToolUseSummary、stopHookActive、turnCount、transition。脚本只关心这一步跑没跑完；代理系统还要关心这一步失败之后，下一步能不能承接前面留下的状态。

循环结构：

```
state = { messages, toolUseContext, autoCompactTracking, ... }
while not done(state):
    govern_input(state)          # prefetch / snip / microcompact / collapse / autocompact
    events = stream_model(state)
    for e in events:
        if tool_use: schedule(...)
        if api_error: surface and return
        if interrupted: drain_tools_with_synthetic_results; break
    state = advance(state, recover_if_needed(state))
```

不变式：turnCount 单调；每个发出的 tool_use 必须有匹配的 tool_result（账本闭环）；`hasAttemptedReactiveCompact` 之后不再 compact（防自回环）。

### 第一职责是治理输入，不是调用模型

进入模型流之前先做：memory 预取 → skill discovery 预取 → 截取 compact boundary 之后的有效消息 → tool result budget → history snip → microcompact → context collapse → 最后才 autocompact。顺序本身就是架构声明：**上下文治理放在模型推理之前**。不把从混乱中整理秩序的责任交给概率分布。先整理现场，再开始执行。

### 调用模型只是循环的一段

治理做完才进入 `for await` 流式消费。模型输出是事件流（assistant 文本、tool_use、usage、stop reason、API 错误），不是「最终答案」。系统把 assistant message 存起来，提取 tool_use，决定是否 follow-up，还可能边流边把工具送给 `StreamingToolExecutor`。架构从「请求-响应」变成「驱动-调度-反馈」。流式的意义不只是更早看到几个字，而是允许运行时在模型尚未完全结束之前就开始安排下一步。

### 心跳必须处理中断，否则只是惯性

`query.ts:1011` 优先处理 streaming abort：若启用了 streamingToolExecutor，先消费剩余结果、生成 synthetic tool_result，避免已发出的 tool_use 没有配套结果；否则用 `yieldMissingToolResultBlocks()` 补全中断说明。

原则：只要系统向外承诺了一段执行，中断时就要把账补平。不能因为用户打断，就假装前面的 tool_use 从未发生。外部系统、UI 和 transcript 都需要一致的因果链，哪怕结果是「中断了」，也必须中断得完整。不能解释的执行轨迹迟早会变成运维、审计或谁也说不清的隐患。

### 心跳还必须处理恢复

没有恢复能力的循环，是把幸运当成了设计。恢复层层递进，不是简单重试：

- **prompt-too-long**：先看最后一条 assistant 是否是被 withheld 的 PTL → 先让 context collapse 把积压提交出去 → 还不够再 reactive compact。按成本和破坏性从低到高。
- **max_output_tokens**：先尝试提升 token cap；还不行再生成 meta message，让模型从被截断处继续往下做，而不是先道歉、先总结、先写空话。

恢复是运行时主路径的一部分。继续工作通常比维持表面上的礼貌更重要。

### 停止条件不能只有一个

「当前轮结束」≠「任务完成」≠「系统成功」。至少区分：stream 正常完成但有 tool_use（follow-up）；没有 tool_use（进 stop hooks）；用户中断；PTL 恢复；max-output-tokens 恢复；stop hook 阻塞导致重进循环；API 错误直接返回。stop hooks 那段还专门防止「compact 后仍然太长，再被 hook 阻塞，再继续 compact」的死循环。重试本身也是一种需要被管理的行为。

| 事件 | 下一步 |
|---|---|
| stream 结束 + 未完成 tool_use | follow-up，进工具执行 |
| stream 结束，无 tool_use | 进入 stop hooks |
| 用户中断 | 消费 remaining results，yield synthetic tool_result |
| prompt_too_long 且未试过 compact | collapse / reactive compact |
| max_output_tokens 且 cap 未到最大 | 提 cap，重跑 |
| max_output_tokens 且 cap 已到最大 | 追加 meta user msg，续写 |
| stop hook block + 已试过 reactive compact 且 PTL 再现 | 跳过 stop hooks，surface |
| API 错误 | 直接返回，不重试 |

### QueryEngine 属于会话生命周期

源码写着：*QueryEngine owns the query lifecycle and session state for a conversation.* 一个 QueryEngine 对应一个 conversation；每次 `submitMessage()` 都是同一 conversation 里的新 turn，状态持续保存。它把 messages、systemPrompt、userContext、systemContext、toolUseContext 交给 `query()`，再把 assistant / user / compact boundary 写回 transcript。UI、SDK、session persistence 都围着这个循环转。

## 关键洞察

成熟 agent 的心跳至少要同时管住：跨轮状态、输入治理、流式消费、中断账本，以及 {完成, 失败, 恢复, 继续} 的区分。缺少这些的系统也许能做出漂亮 demo，但更接近一次性表演，而不是运行时。

## 个人思考

日常体感里「它怎么知道该 compact 了 / 被 Esc 之后还能续 / 工具失败了还在往下做」，全是这一章的状态机。对照自己写 agent：如果主循环只是 `while tool_calls: execute()`，缺的就是治理输入、补账本、分层恢复和停止矩阵。下一章：循环一旦拥有工具，为什么必须学会克制。

## 相关

- [[02-Prompt是控制平面]]
- [[04-工具权限与中断]]
- [[05-上下文治理]]
- [[06-错误与恢复]]

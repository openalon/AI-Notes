---
id: n_1624f780612c
---

# 第 2 章：Prompt 不是人格，Prompt 是控制平面

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://harness-books.agentway.dev/book1-claude-code/chapter-02-prompt-is-control-plane.html">原网页</a> · 状态：已读 · PDF：<a href="./book1-claude-code.pdf"><code>book1-claude-code.pdf</code></a> p.17–22</p>
</details>

## 一句话

**Prompt 的价值，在于它是否被纳入一套清楚的控制结构。** 人设解决「它像什么」；控制平面解决「它能做什么、什么时候做、做错了怎么办、谁来兜底」。成熟代理系统里的 prompt 更像宪法，不是台词。

## 核心概念

### Prompt 从一开始就是分层的

`getSystemPrompt()` 返回的是多个 section 组成的数组，不是一段完整字符串。一旦变成多个块，系统就承认内部有一组职责不同的约束：

1. **身份和总任务**（`prompts.ts:175`）：交互式代理，用工具完成软件工程任务；同时嵌入安全约束（例如不要乱猜 URL）。
2. **系统级规则**（`:186`）：用户能看见哪些文本；工具可能触发权限审批；用户拒绝后不能机械重试；tool result / user message 里可能混入 system-reminder；上下文会被自动压缩。这些不关心「像不像聪明助手」，关心是不是守规矩的执行体。
3. **工程性指令**（`:199`）：不要随意增加需求，不要越权优化，不要隐瞒验证失败，不要不必要地制造抽象。看起来像文风，其实和工程约束绑在一起——「顺手优化一切」从产品看热情，从工程看危险。

### 真正的价值在优先级，不在文字

`buildEffectiveSystemPrompt()` 把来源排成硬编码链：

1. override system prompt
2. coordinator system prompt
3. agent system prompt
4. custom system prompt
5. default system prompt

最后统一拼接 `appendSystemPrompt`。proactive mode 下若同时有 agent prompt：agent 不再替换默认，而是附在其后——**通用制度可以叠加岗位说明书，但不能被岗位说明书直接冲掉**。

三条不变式：基线必须唯一；override 优先级高于 default，不靠「后写为准」；append 永远只能附加、不能替换。任意一条被破坏，prompt 就退化成谁后写谁说了算的涂鸦板。

### Prompt 连接记忆系统

`getClaudeMds()` 把 project / local / team memory / auto memory 整理成统一格式再拼进上下文，并标明每种来源。`buildMemoryLines()` 连「如何保存记忆」都写成 prompt：memory 是文件化持久系统；`MEMORY.md` 是索引不是正文；frontmatter 怎么写；哪些信息不该保存；plan 和 task 不该被误用成 memory。

Prompt 的职责从「约束当前行为」扩到「约束未来知识如何沉淀」。走到这一步就不再是语气问题，而是制度问题。

### 控制平面还要考虑缓存与成本

Prompt 同时也是计算成本。越复杂、变化越频繁，缓存命中越差。`systemPromptSections.ts` 把 section 分成可缓存的 `systemPromptSection` 和会打破缓存的 `DANGEROUS_uncachedSystemPromptSection`；`resolveSystemPromptSections()` 优先从缓存拿；`/clear` 或 `/compact` 后清空。`getSystemPrompt()` 用 boundary 把静态段和动态段显式分开——会话中相对稳定的和逐轮变化的不能混在一起消耗缓存。

文案追求完整表达；控制平面追求可治理、可复用、可预测的行为成本。一个系统只要开始关心「哪部分 prompt 会导致缓存失效」，它就已经不再把 prompt 当文案创作。

### 用户可以覆盖，但不能跳过结构

CLI 支持 `--system-prompt`、`--system-prompt-file`、`--append-system-prompt` 等。允许自定义，但不放弃秩序：最终仍走统一的 `buildEffectiveSystemPrompt()`。没有结构的可定制会退化成临时口头通知。

## 关键洞察

为什么说它像宪法：分层，而不是一块写到底；有优先级，而不是谁后写谁说了算；与 memory、CLAUDE.md、agent / MCP instructions 组成完整控制平面；有缓存和动态 section，不是随手拼一段；和 runtime 紧密耦合，不是游离装饰。

单独「写一个好 prompt」价值有限。更重要的是：prompt 在系统里处于什么位置，和哪些模块配合，是否参与权限、状态、上下文和长期记忆的治理。不回答这些问题，所谓好 prompt 往往只在某个顺利场景里暂时成立。

源码证据：`prompts.ts` 分段控制；`systemPrompt.ts` 优先级；`claudemd.ts` 项目级和长期记忆入装配；`memdir.ts` 用 prompt 规定记忆保存规则；`systemPromptSections.ts` 把 prompt 变成可缓存、可失效、可按段重算的运行时对象。

## 个人思考

这解释了为什么仓库里的 `CLAUDE.md`、技能、用户规则看起来「只是 markdown」，实际是控制面的一层。乱写一段「你是资深工程师」改变不了行为；改优先级链、改记忆协议、改缓存边界才会。下一章：再好的控制平面也要落到 query loop 里——prompt 规定边界，循环决定命运。

## 相关

- [[01-为什么需要HarnessEngineering]]
- [[03-QueryLoop代理系统的心跳]]
- [[05-上下文治理]]

---
id: n_3eaff8bba3a1
---

# 第 1 章：为什么需要 Harness Engineering

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://harness-books.agentway.dev/book1-claude-code/chapter-01-why-harness-engineering.html">原网页</a> · 状态：已读 · PDF：<a href="./book1-claude-code.pdf"><code>book1-claude-code.pdf</code></a> p.12–16</p>
</details>

## 一句话

**代理系统的关键能力是约束执行。** 一个会说话的概率分布一旦能碰 shell、Git、网络和本地文件，问题就从「回答得不够好」变成「执行造成实际破坏」。Harness 就是把这个不稳的核心部件约束成可管理系统的制度化控制平面。

## 核心概念

模型并不天然值得信任。忽视这一点，问题最后多半会出现在日志和事故记录里。Claude Code 从一开始就不是「裸模型接口」，而是带上下文边界、运行时状态和行为规约的会话系统。五层 harness：

### 第一层：受约束的会话系统（prompt 分层）

`prompts.ts` 把身份、工具/权限/压缩说明、工程约束分段写进 system prompt；`getSystemPrompt()` 把静态段和动态段拆开（memory、language、output style、MCP、scratchpad 按段注入）；`systemPrompt.ts` 把 default / custom / agent / append 排成优先级。

Prompt 在这里规定的是执行边界、失败行为和报告责任，不是「你是一个什么样的助手」。真正可用的代理系统不能靠一段万能提示词；控制必须拆成层，层必须有职责。否则新增提醒和禁令会互相冲突。

控制平面三条硬约束：

- 身份 ≠ 运行时：prompt 必须分层（default / project / custom / agent / append）
- 工具受调度：任何 tool_call 执行前由 scheduler 决定并发
- 错误进主路径：可恢复错误走 recover 或干净终止，不能靠 catch 打发

任意一条被越过，后面的 query loop、工具、上下文和恢复都会立刻显得可疑。

### 第二层：代理依赖持续循环（query loop）

核心不在单次 API 调用，而在 `query()` / `queryLoop()`。跨迭代状态装在一起：messages、toolUseContext、autoCompactTracking、maxOutputTokensRecoveryCount、hasAttemptedReactiveCompact、pendingToolUseSummary、turnCount、transition。上一轮留下的问题必须能进入下一轮。

真正的问题是连续多轮里行为能不能一致：有没有预算、有没有恢复、上下文膨胀后有没有自救、工具失败后能不能继续推进。缺少这些，所谓智能体只是一个不稳定的执行者。每轮调用前先做消息裁剪、tool result budget、history snip、microcompact、context collapse、autocompact——**调用发生前就把控制权收到运行时一侧**。

Harness Engineering 不是 prompt engineering 的附属品。前者关心状态机，后者关心措辞。状态机决定系统行为最终由谁负责。

### 第三层：工具调用必须服从调度

模型只能吐文本时，风险还是修辞；一旦能调工具，风险变成执行。`runTools()` 先 `partitionToolCalls()`，按 `isConcurrencySafe()` 分并发批和串行单元。并发路径里 context modifier 先缓存，再按原始 block 顺序回放——执行可以并发，语义上的上下文演化仍保持确定顺序。

工具不是模型能力的自然延伸，而是需要调度纪律的受管执行单元。并发不受约束就会扩大事故半径；在会碰到文件、终端和权限的场景里，保守通常更可靠。

### 第四层：最危险的工具配最细的规矩

Bash 几乎不受领域边界约束，能直接碰文件、进程、网络、Git，还带重定向和管道。`BashTool/prompt.ts` 写了一整段操作规约：不要乱改 git config，不要跳过 hooks，不要随手 `git add .`，不要在 pre-commit 失败后 `--amend` 把上一条也搭进去，不要没人要求就 commit，更不要默认 push。

高风险接口需要高密度约束。原则：**能力越强，控制越细。** 外部世界不会因为模型语气坚定，就自动原谅一次错误执行。

### 第五层：错误属于主路径的一部分

代理系统的失败不是偶发，是稳定存在：超 token、prompt too long、max_output_tokens、工具拒绝、用户打断、hook 阻塞、API 重试。这些如果只在最后用几个 catch 打发，系统表面上在跑，实际上只是把麻烦往后滚。

普通助手：先回答，错了再道歉。Harness：先约束，再执行；出错按恢复路径处理，不靠临场发挥。一个会道歉的系统不一定成熟；一个知道何时不该开始、何时该重试、何时该中止、何时该准确汇报失败的系统，才更接近成熟。

## 关键洞察

源码几个位置指向同一结论：

- `constants/prompts.ts`：prompt 是控制平面的一部分，不是人格装饰
- `utils/systemPrompt.ts`：系统行为必须有分层优先级
- `query.ts`：代理运行依赖持续循环状态，不是单次问答
- `toolOrchestration.ts`：工具调用必须服从调度纪律
- `BashTool/prompt.ts`：高风险工具必须伴随高密度约束

被忽视的工程常识：模型会犯错；工具会扩大错误后果；上下文会膨胀；状态会污染下一轮；用户会打断你；失败会反复出现。系统不能靠「聪明」维持秩序，只能靠结构维持秩序。结构不像聪明那样显眼，但通常更可靠。

## 个人思考

这一章把「为什么需要 harness」从口号落成五层可指认的结构。对照日常用 Claude Code：permission 弹窗、auto-compact、Bash 被拦、Esc 中断后还能续——都不是产品彩蛋，是这五层在工作。下一章专门拆最容易被误解的一层：system prompt 更像宪法，不是台词。

## 相关

- [[00-序言]]
- [[02-Prompt是控制平面]]
- [[03-QueryLoop代理系统的心跳]]
- [[04-工具权限与中断]]

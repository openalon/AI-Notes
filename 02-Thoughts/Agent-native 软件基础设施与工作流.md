---
id: n_5dce830924f9
title: Agent-native 软件基础设施与工作流
type: thought
created: 2026-08-26
tags:
  - AI
  - Agent
  - Agent-Native
  - Infrastructure
  - Workflow
  - Git
  - Collaboration
  - Harness-Engineering
related:
  - "[[Zed：Introducing Delta]]"
  - "[[Cursor：Git at any scale]]"
  - "[[Anthropic：The AI-native SDLC playbook]]"
  - "[[Warp：How Warp builds self-improving agents on Claude]]"
  - "[[Harness Engineering：当工程师不再写代码]]"
  - "[[用好AI的第一步：停止和AI聊天]]"
---

## 一句话结论

Zed、Cursor、Anthropic、Warp 从四个切面承认同一件事：**Git 仍是对外契约，但已经不是 agent 工作的内部操作系统。** Zed 补 commit 之间的语义（对话、活 worktree）；Cursor 补 commit 之上的物理（托管、弹性副本）；Anthropic 补 commit 前后的控制环（intent → spec → plan → 闸门 → 写回 intent）；Warp 补 harness 自身如何从团队判断里进化（inner skill 干活，outer 把现场反馈变成 skill PR）。未来的 agent-native 基础设施，会把「进行中的工作」和「已发布的快照」拆开，让副本、会话、验证、闸门、skill 都按机器流量而不是按人类习惯来设计；人留在闸门上，循环自己转，判断开始复利。

## 四家各自在补哪一层

| | Zed Delta / DeltaDB | Cursor Origin / Continuity | Anthropic AI-native SDLC | Warp self-improving skills |
|---|---|---|---|---|
| 痛点 | 软件在对话里成形，Git 只看见 commit | Agent 把仓库数量和 clone 频率打到人类托管假设之外 | 代码不再是瓶颈，计划/审查/发布仍按人类速度节流 | 对 agent 的纠正随 session 蒸发，prompt 改不赢 |
| 改的层 | 工作协议：thread + 活 worktree | 托管协议：WAL 为源，磁盘 Git 为缓存 | 控制协议：工件链 + hooks + 生产闸门 | 进化协议：inner skill + 现场反馈 + outer PR |
| 对 Git 的态度 | 补 Git，不替换 Git | 兼容 Git，不 fork Git | 仓库可当真理，也可和 Jira/ServiceNow 互链 | skill 就是 git 里的文件，学习就是普通 diff |
| 一等工件 | 对话、delta、未提交的树 | push、pack、可丢可建的副本 | `intent.md` / `spec.md` / `plan.md` / eval / 闸门记录 | inner `SKILL.md`、人的 why、improver 开的 PR |
| 协作单位 | 一条可分享、可续跑的 thread | 一个可被 CI / agent 狂读的 repo | 一份被接受就会点燃下一阶段的工件 | 一条落在人已经工作之处的反馈 |
| 弹性 | 人、本机、云 runner、浏览器、外部 harness 共享同一 store | 热仓上百副本，抛掷仓一份，闲置零份 | 并行 session / worktree；检测确定性，模型按档召唤 | inner 按事件触发，outer 按日程看所有覆盖 |
| 人的位置 | 在 thread 里指、问、接着干 | 把代码、PR、agent 放进同一个 host | 守闸门：接受 intent、接受 plan、批 PR、放行生产 | 在现场给 why，在 skill PR 上决定合不合 |

表面上一个像新协作产品，一个像新 GitHub，一个像企业流程手册，一个像「如何让 agent 自己变好」。底下的问题是同一个：

**人类规模的软件基础设施，是按「偶尔提交、少量克隆、评论贴在快照上、仓库是宠物、闸门是会议、纠正写进下一次 prompt」设计的。Agent 把这六条假设同时打穿。**

## 共同之处

### 1. 都不推翻 Git，都把 Git 降级为边界协议

四家都没有说「Git 死了」。

- Zed：从没打开 Delta 的同事，看到的仍是普通 Git 仓库。commit / push / CI 留下做互操作。
- Cursor：所有 Git 操作仍发生在磁盘上的普通仓库，用现成工具。Martí 明确反对「对 Git 做奇怪的事」。
- Anthropic：甚至允许 Jira / ServiceNow 继续当真理，markdown 当工作副本，最低限度用记录 ID 和 commit SHA 互链。审计师已经接受的系统不必先推翻。
- Warp：学习的产物不是改 memory、不是静默改 prompt，而是对 `SKILL.md` 的普通 git diff，走普通 PR。Git 在这里是进化日志。

这不是保守，是分层。Git 赢在：

- 已经是全球默认的发布和互操作格式
- CI、code review、权限、合规都长在它上面
- 替换成本是组织级的，不是技术级的

所以 agent-native 的第一原则会是：

**对世界仍是 Git；对内部工作流，Git 只是其中一个 adapter。**

谁先宣称「我们替代 Git」，谁就要同时替代二十年生态。谁先宣称「我们让 Git 重新够用」，谁才能把迁移摩擦压到可执行。

### 2. 都把「进行中的状态」当成必须被系统看见的东西

人类 Git 工作流默认：

- 工作副本是私有脏状态
- 只有 commit 才进入公共空间
- 公共空间的评论贴在冻结快照上

Agent 让这个默认失效：

- 大量有意义的状态发生在 uncommitted 区间（Zed）
- 大量有意义的状态发生在「刚 push、必须立刻被 100 个 runner 看见」（Cursor）
- 大量有意义的状态发生在「还没写代码、但已经被接受的 intent / spec / plan」（Anthropic）
- 大量有意义的状态发生在「人对这次 agent 产出说了什么、为什么」（Warp）
- 四种状态都不能等，也不能靠人肉同步

Zed 的句子是：软件在对话里成形，不在 commit 里。
Cursor 的句子是：push 在被完全持久化之前绝不确认，而且必须线性一致。
Anthropic 的句子是：每个阶段提交下一阶段能读的工件。
Warp 的句子是：Skills are just files；学习就是对它们做 diff。

方向不同，要求相同：**中间态必须是一等的、可寻址的、强一致或可实时收敛的；对 Anthropic 来说还包括可触发下一闸门的；对 Warp 来说还包括可被 outer skill 读到、变成下一版 inner 的。**

### 3. 都在把宠物变成牲口

Martí 说得最直白：Spokes 把仓库当 pets。Delta 没说这个词，做的是同一件事：

- 仓库 / worktree / 会话不再是「一台机器上那份珍贵的东西」
- 任何节点丢了，都能从源重建
- 数量按负载伸缩，不按「每个对象至少三份」的宗教

Cursor 的源是 S3 WAL。
Zed 的源是被复制的 delta 流（CRDT worktree + 对话）。
Anthropic 的源是被接受的工件链：session 可丢，`intent.md` / `plan.md` / eval / 闸门记录留下来。
Warp 的源是被 merge 的 skill：单次审查/分诊可丢，人对它说的 why 和合入的原则留下来。

形态不同，运维哲学相同：

**可丢、可建、可迁，才配得上 agent 的制造速度。长命的是被接受的记录，不是某一次跑。**

### 4. 都承认 Agent 制造的是双峰负载，不是「更勤快的人类」

Cursor 写得很清楚：

- 一端是企业巨仓，需要上百只读副本，push 还不能被 3PC 拖死
- 一端是海量 throwaway 小仓，三副本地板高到荒谬

Zed 面对的是同一分布的语义版：

- 一端是要完整保留的、可审查的长 thread（diff 全开、transcript 不截断）
- 一端是大量短命、可分享、可被云 runner 接着跑的会话

Anthropic 面对的是同一分布的流程版：

- 一端是必须人类签字的生产闸门、受监管路径、政策冲突
- 一端是可以 auto mode、可以无人启动、可以按控制带召唤的常规循环

Warp 面对的是同一分布的学习版：

- 一端是资深工程师几条带 why 的纠正（质量）
- 一端是开源仓上数千次审查、社区里每周一千条提及（数量）
- 两端都不是「再写一版更好的 prompt」能吃下的

如果把 agent 理解成「打字更快的同事」，你会去优化 PR 页、GitHub runner、站会和 prompt。
如果把 agent 理解成「另一种流量形状」，你会去重做存储、复制、协作原语、闸门，以及 skill 的进化路径。

四家都选了后者。

### 5. 都把「代码为什么长成这样」当成基础设施问题，而不只是文档问题

Zed 直接做：消息和编辑并排；从代码跳回对话；历史跟着代码走。
Cursor 间接做：完整 WAL 给每次 push / repack 做 provenance；副本可快进可回退；Git 自己出 bug 也能恢复。

这和 [[Harness Engineering：当工程师不再写代码]] 里的「Repo as System of Record」是同一条河的上下游：

- Harness 层：规则、测试、边界必须进仓库，让 agent 能执行
- Delta 层：产生这些改动的对话必须进仓库旁边的工作协议
- Continuity 层：这些仓库本身必须能按机器规模被复制和扔掉
- SDLC 层：意图、规格、计划、eval、闸门记录必须成为下一阶段能读的工件，循环才能自己转
- Skill 进化层：人对这次产出说的 why，必须成为下一版 inner skill 能读的 diff，harness 才能自己变好

没有后四层，前一层会在物理上先崩、在协作上先腐、在组织闸门上被节流，或停在「每次从零教同一个错」。

### 6. 都把人从「搬运工」里拿出来，放到「指认和判断」上

Zed：把 caret 放到那一行、那个 plan step、那段 thinking 上再打字。agent 看到的是精确指称，不是一段被摘要过的人类语言。
Cursor：人不再操心「这个 commit 在哪台 fileserver、有没有复制到 CI」。host 必须在降级时仍然正确。
Anthropic：人不再启动每一段。产品负责人接受 intent，工程师接受 plan，code owner 批 PR，release manager 放行生产。循环自己转，判断留在闸门上。
Warp：人不再手改 prompt。在已经工作的现场给 why，在 skill PR 上决定这条原则进不进系统。判断开始复利，而不是每次从零教。

这和 [[用好AI的第一步：停止和AI聊天]] 完全同构：

- 人不要再当反馈搬运工
- 系统要自己闭合
- 人负责方向、标准和最终判断

只是这次闭合的对象，从「一次代码生成」扩成了「存储、协作、以及整条生命周期」。

## 分歧之处：同一判断，不同切口

共同判断是「Git 不够当内部 OS」。切口不同，所以产品长得不像。

**Zed 从意义裂缝切进去。**
Commit 太粗、太晚、评论必过期。Agent 让「对话即源码」从诗意变成刚需。所以他们做 thread-centric 的新应用，甚至愿意暂时不塞进 Zed——存储和客户端必须互相塑造。

**Cursor 从物理裂缝切进去。**
副本太贵、太慢、太娇气。Agent 让「百万小仓 + 百副本巨仓」同时出现。所以他们做新 host，并且先兼容 GitHub，agent-native 功能反而放后面——先把不会丢、能扛流量的底座铺上。

**Anthropic 从控制裂缝切进去。**
构建已经塌成小时级，计划、审查、发布、运维还在按人类速度走。旧闸门从保护变成节流。所以他们不发明新存储，而是把问责从会议搬进工件和 hook：每个阶段提交下一阶段能读的东西，写代码的 agent 不能批准自己，检测保持确定性，模型只在越带之后被召唤。

**Warp 从进化裂缝切进去。**
第一版 80 分的 prompt 制造吵而且烦的 agent；人手改 prompt 跟不上；反馈在 session 结束时蒸发。判断类工作没有测试可以重试。所以他们不追求完美 prompt，而是把 inner skill、现场 why、outer improver 拆开：干活的自动跑，学习的按日程提议，合入必须是人。原则能泛化，规则表会过拟合。

一个补的是「人看不懂 agent 刚刚做了什么」。
一个补的是「机器拿不到 agent 刚刚推了什么」。
一个补的是「组织跟不上 agent 刚刚产了什么」。
一个补的是「agent 记不住人刚刚纠正了什么」。

哪个先爆，取决于团队更痛协作、规模、治理还是重复教同一个错。长期看四个都会爆。

还有一个值得盯住的差异：

- Zed 明确把 **未提交状态** 变成可协作对象（CRDT）
- Cursor 明确把 **已提交状态** 变成可弹性复制对象（WAL）
- Anthropic 明确把 **被接受的意图/计划** 变成可触发对象（工件链）
- Warp 明确把 **人对产出说的 why** 变成可进化对象（skill diff）

中间那条缝——「agent 正在写、还不能 commit、但已经需要另一台机器接着跑 / 被 CI 预检 / 被另一个 agent 读」——Zed 和 Cursor 都碰到了，都还没有完全收口。Anthropic 用 plan mode（接受前不能改文件）和 worktree 隔离绕过了一部分，但实时共享仍不是它的主题。Warp 的 outer 按日程读的是已经落下的痕迹，不是进行中的树。这会是下一层基础设施的争夺点。

## 对未来 agent-native 基础设施的判断

### 判断 1：软件栈会稳定成三层，而不是「一个超级 Git」

```text
语义层    thread / trace / intent / spec / 决策 / 失败 / 为什么 / skill 原则
工作层    活 worktree / sandbox / 运行时 / 验证回路 / eval / inner skill
发布层    Git commit / PR / CI / 权限 / 合规 / 生产闸门 / skill 的 merge
```

今天大多数工具把三层压进 Git，再把治理压进会议。Agent 会把它们撑开：

- 发布层继续用 Git，因为世界在那里；Anthropic 还允许监管已经接受的遗留系统继续当真理
- 工作层会越来越像 DeltaDB + worktree + cloud runner：实时、可挂载、可丢
- 语义层会越来越像「可寻址的对话、意图和工具轨迹」，而不是 chat 窗口的滚动条，也不是只存在于某人脑子里的计划

Harness Engineering 主要发生在工作层和语义层之间：规则、工具、验证、恢复。
Origin / Continuity 主要发生在发布层之下：让发布层的物理形状配得上 agent 流量。
Delta 主要发生在语义层和工作层之间：让审查和接手不必等发布。
AI-native SDLC 主要发生在三层的闸门上：什么东西被接受了，才允许往下流；越带了，才写回上流。
Warp 的 self-improvement 同时改语义层（原则怎么写）和工作层（inner 下次怎么干），但进化本身必须穿过发布层（skill PR）。

谁试图用一层吞掉三层，谁就会重新发明 GitHub 或重新发明瀑布，然后再被同一组裂缝撕开。谁试图让 agent 静默改自己的生产指令，谁就会失去回滚和问责。

### 判断 2：System of Record 会从「仓库」变成「仓库 + 轨迹」

「Repo as System of Record」对人类团队几乎正确，对 agent 团队不够。

Agent 下次要复用的，不只是最终文件，还包括：

- 当时的 prompt 和约束
- 中间失败和被否定的方案
- 测试为什么绿、截图为什么算过
- 哪一次 push 可见、哪一次 compaction 改写了 pack
- 哪个 runner 用的是哪份副本

Zed 把「对话」写进记录。
Cursor 把「push 的 WAL」写进记录。
Anthropic 把「被接受的意图、规格、计划、审查发现、控制带越界」写进记录。
Warp 把「这次为什么打偏、哪条原则该改」写进记录——而且写进的是下次 inner 会加载的那份文件，不只是审计日志。

下一步会汇合：一次 agent 运行的完整 trace——文件 delta、工具调用、验证、权限决策、闸门判决、人的 why——变成可查询、可分支、可回放的对象。Git commit 只是这条 trace 上偶尔打下的书签。`intent.md` 是上游书签，PR 是下游书签，被 merge 的 skill 是 harness 自己的书签。

### 判断 3：一致性模型会按受众分叉，但对外仍伪装成 Git

给人类看，最终一致常常够用。
给 agent 和 CI 看，不够。

Cursor 写过最狠的例子：一百个 runner 里三个找不到 commit，就是失败。Zed 的 CRDT 则是另一种强保证：多人和多 agent 同时改同一文件，必须收敛，而不是靠「你先 stash」。

未来默认会是：

- **对外线性一致**（push / fetch / clone 看起来像今天的 Git）
- **对内可重建**（任何副本都不是真理）
- **对工作副本可收敛**（CRDT / OT / 实时复制，处理未提交）

「正确优先于降级，健康时再求快」会从存储口号变成工作流口号。Agent 可以慢，但不能静默分叉。

### 判断 4：沙箱、会话、仓库都会变成短命对象，长命的是策略和轨迹

Agent 会制造：

- 用完即走的 repo
- 用完即走的 worktree
- 用完即走的云会话
- 用完即走的 CI clone

如果这些对象按宠物运维，成本先爆炸，正确性再爆炸。

长命下来的会是：

- 权限与策略（谁能碰世界、什么算完成；hooks / managed settings）
- 验证器（测试、lint、浏览器、类型、evals）
- 轨迹（为什么这样做：对话、intent、plan、WAL、人对产出说的 why）
- 发布契约（Git、artifact、部署、生产闸门、skill merge）
- 控制带（什么偏差算越界，越界后模型可以走哪条路由）
- 原则（如何思考这类任务，而不是这一次做什么）

这会倒逼定价、隔离、GC、调度全部按「短命对象 × 长命策略」来设计。现在的 GitHub 定价、runner 分钟、seat 许可，都还是人类团队的计量单位。Anthropic 已经开始用另一组领先/滞后指标：intent 从对话到提交的小时数、plan 一次通过率、eval 通过率、闸门等待、越带到 `intent.md` 入队的时间。这些才更像 agent-native 组织的仪表盘。

### 判断 5：审查会从「看 diff」变成「在产生 diff 的现场里指」

PR 不会立刻死。它是发布门禁，合规和外部协作者还需要它。

但团队内部的主审查会迁走：

- 评论锚在活文本上，而不是行号上
- 对象不只是代码，还包括 plan、thinking、工具输出、失败日志
- 审查者可以直接对还在跑的 agent 说话，而不是对一个已经过期的 snapshot 说话
- 接手者不需要问「你 push 了吗」

Delta 已经把这个界面做出来了。Origin 还把 PR 留在第一版，是因为迁移现实：GitHub 上的审查习惯、权限、通知，一夜搬不走。Anthropic 把 PR 明确留作发布闸门和审计记录，但把「对照 spec / plan 的合规」写成 `REVIEW.md` 的 pass，并把机械发现从人眼里拿走。

五年内更可能的稳态不是「PR 消失」，而是：

**PR 变成发布层的汇总视图；thread / trace 才是工作层的审查视图；intent / spec / plan 才是工作开始前的审查视图。**

写代码的 agent 不能批准自己——这条会从 Anthropic 的企业手册，变成所有 agent-native 发布层的默认。改 skill 的 agent 同样不能批准自己——Warp 已经把同一条用在 harness 的进化上。

### 判断 6：编辑器、终端、浏览器、云 runner 会争入口，赢的是「同一份工作状态能跟着人走」

Zed 为此做了硬决定：同一份 Rust 应用编到 WASM，浏览器不是残血网页。Claude Code 的终端 session 还能流进同一条 thread。

这意味着入口战争的胜负手不是「谁的 IDE 更强」，而是：

- 状态是否独立于客户端
- 人是否能在终端开始、在浏览器看、在云上续、在另一台电脑接手
- 外部 harness 能不能插进来（ACP 这类协议会变重要）

Cursor 走的是另一条整合：代码、PR、agent 进同一个 host。入口是 Cursor 本身。

两条路会共存一段时间。长期更稳的是 **状态可携带**，而不是 **状态锁在一个客户端**。DeltaDB 以后还要回灌 Zed，本身就说明他们也知道：第一客户端可以是新应用，源不能是新应用。

### 判断 7：Harness Engineering 会从「提示词和规则文件」升级成「控制面 + 数据面 + 闸门面 + 进化面」

现在说 harness，多半指：

- system prompt
- CLAUDE.md / AGENTS.md
- 工具、权限、hook
- 测试反馈

这是单机控制面。Zed / Cursor 逼出来的是数据面：

- 工作树如何复制
- 会话如何成为可分享对象
- 仓库如何按流量伸缩
- 中间态如何被寻址和回收

Anthropic 逼出来的是闸门面：

- 哪份工件被接受才允许下流
- 哪条政策是建议（skill），哪条是强制（hook），哪条是工程师关不掉的（managed settings）
- 写的身份和批的身份如何拆开
- 检测为何必须保持确定性，模型只在越带后出场
- 线上异常如何写回 `intent.md`，让生命周期自己喂自己

Warp 逼出来的是进化面：

- inner 干活，outer 学习，两份 skill 拆开
- 信号来自人已经工作的现场，不另做反馈产品
- 学习产物是 git diff，不是静默改 memory
- 写原则和为什么，才能泛化；规则表会把反馈收成脆的例外
- 还要教 agent「如何从一次打偏里抽出原则」，否则只会堆 if-then
- 假设反馈会错；合入必须过人

没有数据面，控制面只能管一台笔记本上的一个 agent。
没有闸门面，数据面只会让错误以机器速度进入生产。
没有进化面，闸门面只会反复拦同一个错，harness 不会自己变好。
四面齐全，才谈得上团队级、机群级、可审计、会复利的 agent 工作流。

所以未来「会做 harness」的人，会越来越像同时懂五件事的人：

1. 模型控制（prompt、工具、验证）
2. 分布式状态（复制、一致性、GC）
3. 人机审查（指认、锚点、可回放）
4. 组织闸门（工件链、职责分离、确定性检测、生产边界）
5. 进化回路（现场信号、outer 提议、原则而非规则、人 merge）

只做第 1 件的人，会停在单机魔法。
只做第 2 件的人，会做成没有人能审查的云工厂。
只做第 3 件的人，会做成漂亮但撑不住流量的协作工具。
只做第 4 件的人，会做成没有数据面的新瀑布——文件换了名字，循环转不起来。
只做第 5 件的人，会做成会自己改自己、却没有闸门和回滚的提示词生物。

### 判断 8：控制必须分层，检测必须确定性，模型不能既当裁判又当选手

Anthropic 把这件事写到了可执行的粒度，值得单独提成一条判断。

三层控制：

1. `CLAUDE.md` / skills：建议。让违规变稀有
2. hooks：强制。让违规接近不可能
3. managed settings：组织底线。工程师、项目文件、CLI flag 都关不掉

两条硬边界：

- **脚本决定「失败了没有」，模型负责诊断。** 控制带、测试是否绿、sandbox 是否起来，都不能交给同一个会编故事的模型
- **写代码的 agent 没有批准自己的路径。** 生产闸门前可以准备一切，越过去必须是被点名的人

这会成为 agent-native 基础设施的安全默认，就像 Continuity 的「降级时仍然正确」。模型越强，这两条越不能省——因为产出速度会把任何「看起来有治理、其实只是 prompt」的红线冲穿。Jason Clinton 的内部实践把它说得更白：把这些 agent 当成新型内部威胁来设计；安全工程师的工作从盯 bug，变成盯循环。

Warp 给进化面加了第三条硬边界，值得并列：

- **改生产指令的 agent，不能自己让改动生效。** inner 可以无人启动，outer 可以自己开 PR，merge 必须是人。Skill 当代码：有历史、能审查、能回滚。静默改 memory 不是进化，是失忆和中毒共用一条路。

### 判断 9：Skill 和 Memory 必须分开；进化写原则，不写例外

Warp 把一个很容易混的概念钉死了：skill 是程序性的、稳定的、故意改的；memory 是推理时自动写的、一直在变的。把现场纠正写进 memory，下次也许能用，但不能审查、不能回滚、不能在团队间共享，也很容易被一次错误反馈带跑。

另一半同样硬：学习必须抽出原则，而不是堆规则。Buzz 的反面教材是，人把「太营销」改掉，agent 学成「永远别在第一句提定价」。可迁移的是「如果对方在发泄，先共情，别先推销」。所以 outer skill 真正要做的，不是补一条 if，而是问：要达到期望输出，缺了或没写清哪条原则？

这会倒过来逼团队把原来只存在于口味里的东西写到纸上。进化面不只是让 agent 变好，也是让组织隐性知识外显。和「Claude 把同一个错犯两次就写进 `CLAUDE.md`」是同一条河，只是 Warp 把它从工作规则做成了机械循环。

## 对工作流的判断：人真正该改的不是工具订阅，是对象生命周期

如果把上面收成可执行的工作流，大概是这样：

1. **先有目标与成功标准**，写成 `intent.md`（人，含非工程师）
2. **规格和政策冲突在工程动手前处理完**（`spec.md` + skills）
3. **开一条可分享的工作 thread / 接受一份 `plan.md`**（语义层），而不是先开一个聊天窗口
4. **Agent 在隔离 worktree / sandbox 里跑**（工作层），过程全量保留，不靠摘要
5. **验证器机械闭合**（测试、lint、浏览器、类型、evals），人不当搬运工；修代码的 agent 不能改测试
6. **需要另一台机器时，迁的是 thread / WAL / 被接受的工件，不是「请你 pull 一下」**
7. **需要对外时，才盖一个 Git commit / PR**（发布层）；写的 agent 不能批
8. **生产闸门是 hook，不是群消息**；agent 做到闸门为止
9. **失败、否决、越带、为什么，写回可被下次 agent 消费的轨迹**（新的 `intent.md`，以及人对这次产出说的 why）
10. **why 变成对 inner skill 的最小 diff，走普通 PR**；合入后下一次内圈自动变好，而不是再手改一次 prompt

对应到今天能做的最小改动：

- 不要只把最终 diff 当产出。把 prompt、失败、验证命令、intent / plan、人对这次为什么打偏一起留在仓库能读到的地方
- 给 agent 短命隔离（worktree、分支、独立 repo），但给规则、成功标准、闸门和 skill 长命位置
- 审查尽量对着「它正在做的事」和「它打算做什么」，少对着「它三小时前 push 的快照」
- 纠正尽量落在人已经工作的现场（PR 评论、改标签、Slack emoji），不要另做反馈表
- 选工具时问五句：中间态能不能被别人接着用？对象能不能被扔掉再重建？下一阶段能不能只读这份工件就开工？写的身份有没有批准自己的路径？这次纠正会不会在 session 结束时蒸发？

## 我认为最值得记住的三句话

- **Git 是边界协议，不是内部操作系统。**
- **Agent 不是更快的同事，而是另一种流量形状。**
- **长命的是策略、轨迹、闸门和原则；短命的是仓库、会话、副本和某一次纠正。循环自己转，人留在闸门上，判断开始复利。**

## 来源

- [Introducing Delta](https://zed.dev/blog/introducing-delta) · Nathan Sobo · 2026-08-12
- [Software Is Made Between Commits](https://zed.dev/blog/introducing-deltadb) · Nathan Sobo · 2026-06-11
- [Git at any scale](https://cursor.com/blog/git-at-any-scale) · Vicent Martí · 2026-08-18
- [Origin changelog](https://cursor.com/changelog/origin-code-hosting) · 2026-08-17
- [The AI-native SDLC playbook](https://claude.com/blog/the-ai-native-sdlc-playbook) · Louis Claxton · 2026-08-21
- [How Anthropic secures its AI-native SDLC](https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle) · Jason Clinton · 2026-07-21
- [Running an AI-native engineering org](https://claude.com/blog/running-an-ai-native-engineering-org) · Fiona Fung · 2026-06-03
- [How Warp builds self-improving agents on Claude](https://claude.com/blog/how-warp-builds-self-improving-agents-on-claude) · Michael Segner · 2026-08-26
- [How to build a self-improvement loop for your Skills](https://www.warp.dev/blog/self-improvement-loop-for-skills) · Zach Lloyd · 2026-06-16
- [Agents Need Feedback Loops, Not Perfect Prompts](https://www.warp.dev/blog/agents-need-feedback-loops-not-perfect-prompts) · Petra Donka · 2026-05-14

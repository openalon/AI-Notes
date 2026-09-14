---
id: n_4b6cad253348
---

# 第 5 章：技能、Hook 与本地规则 — 系统如何学会守乡约

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://harness-books.agentway.dev/book2-comparing/chapter-05-skills-hooks-and-local-governance.html">原网页</a> · 状态：已读 · PDF：<a href="./book2-comparing.pdf"><code>book2-comparing.pdf</code></a> p.27–30</p>
</details>

## 一句话

**真正能落地的 agent 一定会地方化。** Claude Code 问怎样让 agent 在这里干活更像本地人，Codex 问怎样让本地规则进入一套可管理的制度框架。越贴近现场越有弹性，越制度化越易复制。

## 核心概念

任何通用 coding agent 一旦开始给团队干活，就遇到同一问题：公司有公司规矩，仓库有仓库规矩，目录有目录规矩，人还有怪脾气。系统不能吸收这些局部制度，就只能停在演示环境里。两套 harness 都给了地方化路径，走法相反。

Claude Code 把局部制度做成现场记忆。`CLAUDE.md`、skill、hook、session memory 叠在一起，贴着当前会话与执行，而不是先立一套永恒章程。地方化能力落在这组组合上，有现场经验沉淀的味道：像一个随身带笔记本的工程师，走到哪把当地规矩抄下来。好处是多仓、多目录、多约束并存时上手快；若不另做整理，知识会以现场补丁方式膨胀。

Codex 把局部制度做成结构化注入和事件系统。skill、本地规则、hook 都更像可管理资产。`skills/src/lib.rs` 把 system skills 装进 `CODEX_HOME/skills/.system` 并做 fingerprint；仅 marker 不符才覆写。`AGENTS.md` 还带作用域与 hierarchy。hook engine（`hooks/src/engine/mod.rs`）把生命周期拆成 `session_start`、`user_prompt_submit`、`pre_tool_use`、`post_tool_use`、`stop`，handler 带 `event_name`、matcher、timeout、source path、display order。另有 `preview_*` / `run_*` 双路径；Windows 因能力不全会关 `codex_hooks` 并给 warning。skill 不是临时读入的文本，而是被安装、被管理、可追踪版本的资产。hook 能不能开、为什么不开，都希望可解释。

不变式还包括：每条 thread 上 `session_start` 先于任何 tool_use；`pre` / `post_tool_use` 夹住执行；`stop` 只走一次；preview 不跑 handler；`display_order` 稳定则可重放。

一边把现场经验不断收进主循环附近，让 agent 很快学会「这儿怎么办事」；另一边把规则挂到明确控制面与生命周期上，便于分类、排序、安装、触发。前者像熟悉现场、懂看气氛的老员工，后者像制度意识极强的新项目经理。

## 关键洞察

靠现场注入的系统换仓更快、局部语境更灵，但扩到更多团队时要额外整理，否则各写各的 `CLAUDE.md`、各做各的 skill。靠结构化挂载的系统更利于统一分发、版本化与审计，学习成本更高，团队得先接受显式制度。

经典取舍：越贴近现场越有弹性，越制度化越易复制。真正决定结果的，是团队需要哪一种稳定性。Claude Code 更倾向于把局部治理做成现场记忆与运行时注入，Codex 更倾向于把局部治理做成结构化资产与生命周期事件系统。

## 个人思考

对照 Book 1 第 8 章团队落地，以及 Warp 那篇「现场反馈沉淀进 skill」：Claude Code 这条路对个人和小组极友善，组织一放大就会变成各仓各写一份乡约。Codex 对 fingerprint、事件顺序、preview 不做 handler 的强迫，看起来笨，却是跨团队复制时少不了的账。自己做的时候不要把 skill 目录当成「又一份长 prompt」。

## 相关

- [[05-工具沙箱与策略语言]]
- [[07-委派验证与持久状态]]
- [[08-团队落地]]
- [[Warp：How Warp builds self-improving agents on Claude]]

---
id: n_391ae34b5363
---

# 第 7 章：Skills

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://github.com/anthropics/claude-cookbooks/tree/main/skills">skills/</a> · 状态：已读</p>
</details>

## 一句话

**Skill 是可加载的程序性知识：指令 + 已验证的代码 + 资源，按需三级展开。** 它不是更长的 system prompt，也不是又一把 tool——tool 是动词，skill 是「做这类事时该怎么做」的专家包。

## 核心概念

### 三级 progressive disclosure

`01_skills_introduction.ipynb`：Claude 先只看见 YAML frontmatter（name ≤64 字符，description ≤1024）。相关才加载 SKILL.md 全文（目标 <5k token）。链接文件和 helper script 再按需。你只为用到的层级付钱。

目录约定：`SKILL.md` + 脚本 + 资源。Anthropic 维护的有 `xlsx` / `pptx` / `pdf` / `docx`；自定义的是品牌规范、财务模型、内部流程。

### 必须配 code execution

Skills 走 `client.beta.messages.create`，`container.skills` 声明要用的包，`tools` 里要有 `code_execution`。Claude 读技能说明，在沙箱跑技能自带的脚本，而不是从零生成一份不可靠的 Excel 代码。这是「时间节省 + 错误下降」的来源：脚本已经测过。

当时 beta：`code-execution-2025-08-25`、`files-api-2025-04-14`、`skills-2025-10-02`（以仓库为准）。

### 和 MCP / tool / CLAUDE.md 怎么分工

| 原语 | 管什么 |
|---|---|
| Tool | 一次动作的 schema 和副作用 |
| MCP | 外部系统的工具面 |
| CLAUDE.md / system | 始终在场的约束 |
| Skill | 某一类任务的流程、惯例、已验证代码 |

MCP 给「能调 GitHub」；Skill 给「按我们的月报模板出 xlsx」。Book 1 [[06-技能Hook与本地规则]]、Warp 那篇「现场反馈沉淀进 skill」是同一想法的运行时版。

### 财务场景证明 composability

`02_skills_financial_applications.ipynb`：同一批数据 → Excel 模型（公式和图表）→ 执行层 PPT → PDF 报告；再做组合分析和投委会 deck。多 skill 在一次请求里协作，不靠你把三份超长 prompt 拼进 system。

`03_skills_custom_development.ipynb`：自己写 skill 的形状——frontmatter 决定发现率，正文决定加载后的行为，脚本决定可靠性。description 写差，模型根本不会加载。

### CMA 会自动捡仓库技能

`managed_agents/CMA_use_skills_from_a_repo.ipynb`：托管会话从 repo 的 `.claude/skills` 发现技能。本地约定和云端会话是同一份文件，不是两套文档。

对照 recipe：

| 路径 | 钉的是什么 |
|---|---|
| `skills/notebooks/01_skills_introduction.ipynb` | 三级加载、和 code execution 的关系 |
| `skills/notebooks/02_skills_financial_applications.ipynb` | 财务场景：技能包比长 prompt 稳 |
| `skills/notebooks/03_skills_custom_development.ipynb` | 自己写 Skill 的形状 |
| `managed_agents/CMA_use_skills_from_a_repo.ipynb` | CMA 自动捡仓库 `.claude/skills` |

## 关键洞察

Skills 解决的是 **程序性知识的分发和计费**。全塞 system：每次请求都付钱，还和缓存打架（第 4 章）。做成 skill：元数据几乎免费，用到才加载，代码是仓库里的事实而不是模型即兴。组织知识（品牌、关账、合规清单）终于有一个不像 wiki、不像 prompt 的落点。

发现失败是静默的：description 写得不像用户任务，skill 等于不存在。

## 个人思考

第 1 章钉输出形状（xlsx 也是一种形状）；本章钉「怎么稳定地造出那种形状」。下一章 Agent SDK 会把 skill、tool、CLAUDE.md 放进同一个 query loop——skill 是控制面的一层，不是插件市场。

## 相关

- [[00-Cookbooks阅读地图]]
- [[05-上下文治理]]
- [[06-技能Hook与本地规则]]
- [[09-Managed-Agents]]
- [[Warp：How Warp builds self-improving agents on Claude]]

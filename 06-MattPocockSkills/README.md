# Matt Pocock Skills 学习笔记

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://github.com/mattpocock/skills">mattpocock/skills</a> · 开始时间：2026-09-18</p>
</details>

Matt Pocock 的 agent skills 集。本库按学习路径重排，不按上游分桶平铺。`SKILL.md` 不入库。

---

## 学习路线

**建议顺序：Part 1 先对齐，Part 2 再让代码可验、可深，Part 3 才谈规模和落地。**

### Part 1：agent 动手之前

| 进度 | 章节 | 主题 |
|------|------|------|
| [x] | 阅读导读 | 四个失败模式怎么收成 9 章；和 Cookbooks / Harness 怎么对照 |
| [x] | 第 1 章 | 四个失败模式：对齐、冗长、反馈、泥球 |
| [x] | 第 2 章 | grilling 与对齐：设计树、前沿、事实归 agent |
| [x] | 第 3 章 | 共享语言：CONTEXT.md、ADR 三道闸、给 agent 写文档 |
| [x] | 第 4 章 | 主流程：规格 → 工单 → 实现 |

### Part 2：反馈与形状

| 进度 | 章节 | 主题 |
|------|------|------|
| [x] | 第 5 章 | 反馈环：测试先行、诊断、原型 |
| [x] | 第 6 章 | 设计与深模块：接口深度、调查而不是抢救 |

### Part 3：规模与落地

| 进度 | 章节 | 主题 |
|------|------|------|
| [x] | 第 7 章 | 规模与迷雾：探路图、分拣外来请求 |
| [x] | 第 8 章 | 会话卫生：阶段边界上的五种走法 |
| [x] | 第 9 章 | 评审与落地：双轴评审、按意图解冲突、人才能做的步骤 |

---

## 学习方法建议

1. **对着 skill 跑，不对着笔记抄指令**：判断已经写进各章；步骤留在官方仓库。
2. **和 Harness / Cookbooks 对照**：Book 1 讲 Claude Code 运行时怎么约束模型；Cookbooks 讲 API 层约束按什么顺序钉；这里讲一个工程师如何把**过程纪律**拆成可组合 skill。
3. **beta 不入库**：`in-progress/`（loop-me、writing-beats、implement-spec 等）公开求反馈，不进插件，也不进这本笔记的正文。

## 在线资源

- 仓库：https://github.com/mattpocock/skills
- 文档：https://aihero.dev
- 插件：`claude plugins install mattpocock-skills`
- 本机官方仓库：skills（不入库）

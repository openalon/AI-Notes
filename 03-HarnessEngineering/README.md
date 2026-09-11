# Harness Engineering 学习笔记

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://harness-books.agentway.dev/">Harness Books</a> · 开始时间：2026-04-15</p>
</details>

两本围绕 Harness Engineering 的系列书籍，深入 Claude Code 和 Codex 的源码与设计哲学。

---

## 学习路线

**建议顺序：先读 Book 1 建立框架，再读 Book 2 做对比理解。**

### Book 1：Harness Engineering — Claude Code 设计指南

围绕 Claude Code 的运行时结构展开，重点讨论控制面、连续性、恢复路径与验证分工。适合先建立完整框架。

| 进度 | 章节 | 主题 |
|------|------|------|
| [x] | 序言 | Harness、终端与工程约束 |
| [x] | 第 1 章 | 为什么需要 Harness Engineering |
| [x] | 第 2 章 | Prompt 不是人格，Prompt 是控制平面 |
| [x] | 第 3 章 | Query Loop：代理系统的心跳 |
| [x] | 第 4 章 | 工具、权限与中断：为什么代理不能直接碰世界 |
| [x] | 第 5 章 | 上下文治理：Memory、CLAUDE.md 与 Compact 是预算制度 |
| [x] | 第 6 章 | 错误与恢复：出错后仍能继续工作的代理系统 |
| [x] | 第 7 章 | 多代理与验证：用分工和验证管理不稳定性 |
| [x] | 第 8 章 | 团队落地：把一个聪明工具变成可复用制度 |
| [x] | 第 9 章 | Harness Engineering 十条原则 |
| [x] | 附录 A | 检查清单：把原则落成能执行的约束 |
| [x] | 附录 B | 图示：把运行时结构画出来 |
| [x] | 附录 C | 源码索引：本书各章主要依据哪些文件 |

### Book 2：Claude Code 和 Codex 的 Harness 设计哲学

对比 Claude Code 与 Codex 两条 harness 路线，从控制面、状态、策略到本地治理。

| 进度 | 章节 | 主题 |
|------|------|------|
| [ ] | 阅读导读 | 如何理解第一本书与这本比较书 |
| [ ] | 序言 | 两套 Harness，不必假装是同一匹马的附件 |
| [ ] | 第 1 章 | 为什么要把 Claude Code 和 Codex 放在一起看 |
| [ ] | 第 2 章 | 两种控制面：Prompt 拼装与 Instruction Fragment |
| [ ] | 第 3 章 | 心跳放在哪：Query Loop 对照 Thread、Rollout 与 State |
| [ ] | 第 4 章 | 工具、沙箱与策略语言：谁来阻止模型动手太快 |
| [ ] | 第 5 章 | 技能、Hook 与本地规则：系统如何学会守乡约 |
| [ ] | 第 6 章 | 委派、验证与持久状态：谁来防止系统自己给自己打高分 |
| [ ] | 第 7 章 | 殊途同归，还是各表一枝 |
| [ ] | 第 8 章 | 如果你要自己做：该向谁学，先学什么 |
| [ ] | 附录 A | 源码索引：这套比较主要依据哪些文件 |
| [ ] | 附录 B | 检查清单：如何判断你的 Harness 更像 Claude Code、Codex，还是半成品 |

---

## 学习方法建议

1. **每章阅读后**：在对应的笔记文件中记录核心概念、关键洞察、个人思考
2. **关联实践**：结合自己使用 Claude Code 的体验，对照书中描述的架构设计
3. **对比阅读**：Book 2 的每一章都可以和 Book 1 的对应章节交叉阅读
4. **源码验证**：利用附录中的源码索引，直接去看相关源码加深理解

## 在线资源

- 在线阅读 Book 1：https://harness-books.agentway.dev/book1-claude-code/
- 在线阅读 Book 2：https://harness-books.agentway.dev/book2-comparing/
- GitHub 仓库：https://github.com/wquguru/harness-books
- PDF 下载 Book 1：https://harness-books.agentway.dev/book1-claude-code/exported/book1-claude-code.pdf
- 本库离线 PDF：`Book1-ClaudeCode/book1-claude-code.pdf`、`Book2-Comparing/book2-comparing.pdf`

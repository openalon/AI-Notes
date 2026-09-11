# Claude Cookbooks 学习笔记

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://github.com/anthropics/claude-cookbooks">anthropics/claude-cookbooks</a> · 对照：<code>~/workspace2/claude-cookbooks</code> · 开始时间：2026-09-12</p>
</details>

Anthropic 官方 recipe 集。本库按学习路径重排，不按上游文件夹平铺。Notebook 不入库。

---

## 学习路线

**建议顺序：Part 1 钉约束，Part 2 组工作流，Part 3 落到产品。**

### Part 1：把模型接进系统之前

| 进度 | 章节 | 主题 |
|------|------|------|
| [x] | 阅读导读 | 95 道 recipe 怎么收成 12 章；和 Harness 书怎么对照 |
| [x] | 第 1 章 | 先钉输出：JSON、引用、分类、摘要、审核 |
| [x] | 第 2 章 | 检索与 RAG：chunk、上下文检索、SQL、知识图谱 |
| [x] | 第 3 章 | 工具调用：choice、并行、PTC、工具搜索 |
| [x] | 第 4 章 | 上下文工程：缓存、compaction、memory、extended thinking |

### Part 2：从单次调用到工作流

| 进度 | 章节 | 主题 |
|------|------|------|
| [x] | 第 5 章 | Agent 工作流：pipeline、orchestrator、evaluator-optimizer |
| [x] | 第 6 章 | 多模态：图、表、文档、zoom、语音 |
| [x] | 第 7 章 | Skills：可加载的程序性知识，不是更长的 system prompt |

### Part 3：产品面

| 进度 | 章节 | 主题 |
|------|------|------|
| [x] | 第 8 章 | Claude Agent SDK：从 one-liner 到托管 |
| [x] | 第 9 章 | Managed Agents：session、预算、验证、多代理 |
| [x] | 第 10 章 | 评测与成本：evals、tool eval、Pareto |
| [x] | 第 11 章 | 生产可观测：用量 API、地理钉扎、预算封顶 |
| [x] | 第 12 章 | 集成与第三方：向量库、LlamaIndex、语音、百科 |

---

## 学习方法建议

1. **对着 notebook 跑，不对着笔记抄代码**：判断已经写进各章；实现留在对照仓库。
2. **和 Harness 对照**：Book 1 讲 Claude Code 的控制面；这里讲 Messages API / Agent SDK / CMA 把同一套约束拆成可复制的 recipe。
3. **registry 不是全书**：仓库里还有未进 `registry.yaml` 的 notebook（例如部分 CMA tutorial）。章节清单会标出来。

## 在线资源

- 仓库：https://github.com/anthropics/claude-cookbooks
- 文档：https://docs.claude.com
- API Fundamentals 课：https://github.com/anthropics/courses/tree/master/anthropic_api_fundamentals
- 本机对照：`~/workspace2/claude-cookbooks`

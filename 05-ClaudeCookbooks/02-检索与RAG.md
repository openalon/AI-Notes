---
id: n_97467eacc98d
---

# 第 2 章：检索与 RAG

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://github.com/anthropics/claude-cookbooks/tree/main/capabilities">capabilities/</a> · 状态：已读</p>
</details>

## 一句话

**检索不是「把最像的段落塞进 prompt」，而是一条可独立评测的管道：召回、排序、生成分开量，chunk 在入库前补上下文，结构化问题走 SQL / 图谱而不是硬向量。**

## 核心概念

### Naive RAG 先当基线，再拆开评

`capabilities/retrieval_augmented_generation/guide.ipynb` 用 Claude 文档当语料，Voyage 嵌入 + 内存向量库。三级：按 heading 切 → 摘要索引 → Claude rerank。合成 100 条评测（问题 / 应召回的 chunk / 金答案），**检索指标和端到端准确率必须分开算**：

| 指标 | 管什么 |
|---|---|
| Precision / Recall / F1 | 捞上来的 chunk 对不对、漏不漏 |
| MRR@k | 对的东西排得够不够前 |
| End-to-end accuracy | LLM-as-judge：最终答案对不对 |

他们的数字：e2e 71% → 81%；MRR 0.74 → 0.87。Precision 几乎不动（最低捞 3 条，分子被分母压着）。很多 RAG 系统故意偏 recall，让生成阶段再滤——前提是你真的在测生成，而不是把「看起来像」当过关。

### Contextual embeddings：chunk 自己看不见文档

`capabilities/contextual-embeddings/guide.ipynb`：传统切块会丢掉「这段属于哪份文件、解决什么」。入库前让 Claude 给每个 chunk 写一段 chunk-specific context 再 embed。官方数字：top-20 检索失败率平均 −35%；代码库评测 Pass@10 ~87% → ~95%。同一段 context 还能喂 BM25（Contextual BM25），再加 Cohere rerank。

成本靠 prompt cache：给每个 chunk 补上下文时，文档前缀反复出现，不 cache 会把账单打穿。Bedrock 侧有 Lambda 自定义 chunking 示例。citations 第 1 章的 `context` 字段，就是这条技术在引用 API 上的对口。

### Text-to-SQL 是带执行器的自改进环

`capabilities/text_to_sql/guide.ipynb` 路径：schema 进 prompt → few-shot → CoT → 复杂库对 schema 做 RAG → **跑 SQL，失败了把错误喂回去改**。自然语言能写 join / 子查询，但不保证一次对。`misc/how_to_make_sql_queries.ipynb` 是更早的工具形态，机制一样：模型生成，数据库执行，错误是信号不是终点。

### 知识图谱管多跳，向量管相似

`capabilities/knowledge_graph/guide.ipynb`：先结构化抽取实体和关系，再做实体消歧，查询走多跳。向量召回擅长「像这句话的段落」；「A 的供应商的合规官是谁」是图的问题。两者不是替代，是查询形状不同。

### PDF / 网页是语料入口，不是检索策略

`misc/pdf_upload_summarization.ipynb`、`misc/read_web_pages_with_haiku.ipynb`：把文件和页面变成可切的文本。切完仍要走上面的评测。网页当即时语料时，Haiku 适合抽，最终合成留给更强模型（第 5 章 sub-agent 同构）。

向量库和 LlamaIndex 的适配器放到 [[12-集成与第三方]]。本章只看机制：评什么、chunk 补什么、结构化查询走哪条路。

对照 recipe：

| 路径 | 钉的是什么 |
|---|---|
| `capabilities/retrieval_augmented_generation/guide.ipynb` | 摘要索引 + rerank；检索 / e2e 分测 |
| `capabilities/contextual-embeddings/guide.ipynb` | chunk 入库前补上下文；配合 prompt cache |
| `capabilities/text_to_sql/guide.ipynb` | 自然语言 → SQL，带执行和自改进 |
| `misc/how_to_make_sql_queries.ipynb` | 更早的 SQL 工具示例 |
| `capabilities/knowledge_graph/guide.ipynb` | 实体 / 关系 / 多跳，不只是向量召回 |
| `misc/pdf_upload_summarization.ipynb` | 把 PDF 当文本喂给模型 |
| `misc/read_web_pages_with_haiku.ipynb` | 网页当即时语料 |

## 关键洞察

RAG 失败通常不是「嵌入模型不够新」，是三件事没分开：召回、排序、生成。cookbook 强迫你先做 100 条带 golden chunk 的集，再谈技巧。Contextual retrieval 的洞察更狠：**模型在生成时需要的上下文，必须在嵌入时就已经在向量里**——不能指望检索后再靠 prompt 补救全部指代。

SQL 和图谱提醒：不是所有「问内部数据」都该进向量库。能执行、能报错、能回改的通道，比「语义上接近」更像工程。

## 个人思考

第 1 章钉输出形状；本章钉证据从哪来。两边合在一起才是 citations 能成立的前提：没有检索评测的引用，只是排版。下一章工具会把「取证据」从只读检索扩成可执行的边界。

## 相关

- [[00-Cookbooks阅读地图]]
- [[01-先钉输出]]
- [[04-上下文工程]]
- [[12-集成与第三方]]
- [[05-上下文治理]]

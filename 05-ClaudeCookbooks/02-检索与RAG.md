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

对照 recipe（默认折叠；机制片段来自对照仓库，全文在 GitHub）：

::: details `capabilities/retrieval_augmented_generation/guide.ipynb` — 摘要索引 + rerank；检索 / e2e 分测

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/capabilities/retrieval_augmented_generation/guide.ipynb)

```python
## setup
%pip install anthropic
%pip install voyageai
%pip install pandas
%pip install numpy
%pip install matplotlib
%pip install seaborn
%pip install -U scikit-learn

# previewing our eval dataset
import json


def preview_json(file_path, num_items=3):
    try:
        with open(file_path) as file:
            data = json.load(file)

        if isinstance(data, list):
            preview_data = data[:num_items]
        elif isinstance(data, dict):
            preview_data = dict(list(data.items())[:num_items])
        else:
            print(f"Unexpected data type: {type(data)}. Cannot preview.")
            return

        print(f"Preview of the first {num_items} items from {file_path}:")
        print(json.dumps(preview_data, indent=2))
        print(f"\nTotal number of items: {len(data)}")

    except FileNotFoundError:
        print(f"File not found: {file_path}")
    except json.JSONDecodeError:
        print(f"Invalid JSON in file: {file_path}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")


preview_json("evaluation/docs_evaluation_dataset.json")

def retrieve_level_two(query, db):
    results = db.search(query, k=3)
    context = ""
    for result in results:
        chunk = result["metadata"]
        context += f"\n <document> \n {chunk['chunk_heading']}\n\nText\n {chunk['text']} \n\nSummary: \n {chunk['summary']} \n </document> \n"  # show model all 3 items
    return results, context


def answer_query_level_two(query, db):
    documents, context = retrieve_base(query, db)
    prompt = f"""
    You have been tasked with helping us to answer the following query:
    <query>
    {query}
    </query>
    You have access to the following documents which are meant to provide context as you answer the query:
    <documents>
    {context}
    </documents>
    Please remain faithful to the underlying context, and only deviate from it if you are 100% sure that you know the answer already.
    Answer the question now, and avoid providing preamble such as 'Here is the answer', etc
    """
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return response.content[0].text
```

:::

::: details `capabilities/contextual-embeddings/guide.ipynb` — chunk 入库前补上下文；配合 prompt cache

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/capabilities/contextual-embeddings/guide.ipynb)

```python
DOCUMENT_CONTEXT_PROMPT = """
<document>
{doc_content}
</document>
"""

CHUNK_CONTEXT_PROMPT = """
Here is the chunk we want to situate within the whole document
<chunk>
{chunk_content}
</chunk>

Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk.
Answer only with the succinct context and nothing else.
"""


def situate_context(doc: str, chunk: str) -> str:
    response = client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        temperature=0.0,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": DOCUMENT_CONTEXT_PROMPT.format(doc_content=doc),
                        "cache_control": {
                            "type": "ephemeral"
                        },  # we will make use of prompt caching for the full documents
                    },
                    {
                        "type": "text",
                        "text": CHUNK_CONTEXT_PROMPT.format(chunk_content=chunk),
                    },
                ],
            }
        ],
    )
    return response


jsonl_data = load_jsonl("data/evaluation_set.jsonl")
# Example usage
doc_content = jsonl_data[0]["golden_documents"][0]["content"]
chunk_content = jsonl_data[0]["golden_chunks"][0]["content"]

response = situate_context(doc_content, chunk_content)
print(f"Situated context: {response.content[0].text}")
print("-" * 10)
# Print cache performance metrics
print(f"Input tokens: {response.usage.input_tokens}")
print(f"Output tokens: {response.usage.output_tokens}")
print(f"Cache creation input tokens: {response.usage.cache_creation_input_tokens}")
print(f"Cache read input tokens: {response.usage.cache_read_input_tokens}")
```

:::

::: details `capabilities/text_to_sql/guide.ipynb` — 自然语言 → SQL，带执行和自改进

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/capabilities/text_to_sql/guide.ipynb)

```python
def run_sql(sql):
    conn = sqlite3.connect(DATABASE_PATH)
    result = pd.read_sql_query(sql, conn)
    conn.close()
    return result


result = run_sql(sql)
print("Query result:")
display(result)

def generate_prompt_with_rag(query):
    relevant_schema = vectordb.search(query, k=10, similarity_threshold=0.3)
    schema_info = "\n".join(
        [
            f"Table: {item['metadata']['table']}, Column: {item['metadata']['column']}, Type: {item['metadata']['type']}"
            for item in relevant_schema
        ]
    )

    return generate_prompt_with_cot(schema_info, query)


# Test the RAG-based prompt
user_query = "What is the average salary of employees in each department?"
prompt = generate_prompt_with_rag(user_query)
print("Generated prompt:")
print(prompt)

# Generate and execute SQL
result = generate_sql(prompt)
print("\nGenerated result:")
print(result)

# Extract and run the SQL query
sql = result.split("<sql>")[1].split("</sql>")[0].strip()
print("\nExtracted SQL:")
print(sql)

query_result = run_sql(sql)
print("\nQuery result:")
display(query_result)
```

:::

::: details `misc/how_to_make_sql_queries.ipynb` — 更早的 SQL 工具示例

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/misc/how_to_make_sql_queries.ipynb)

```python
# Define a function to send a query to Claude and get the response
def ask_claude(query, schema):
    prompt = f"""Here is the schema for a database:

{schema}

Given this schema, can you output a SQL query to answer the following question? Only output the SQL query and nothing else.

Question: {query}
"""

    response = client.messages.create(
        model=MODEL_NAME, max_tokens=2048, messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text
```

:::

::: details `capabilities/knowledge_graph/guide.ipynb` — 实体 / 关系 / 多跳，不只是向量召回

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/capabilities/knowledge_graph/guide.ipynb)

```python
ARTICLE_TITLES = [
    "Apollo program",
    "Apollo 11",
    "Neil Armstrong",
    "Saturn V",
    "Buzz Aldrin",
    "Kennedy Space Center",
]

WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary/"
HEADERS = {"User-Agent": "claude-cookbooks/1.0 (https://github.com/anthropics/claude-cookbooks)"}


def fetch_summary(title: str) -> str:
    slug = quote(title.replace(" ", "_"), safe="")
    r = requests.get(WIKI_API + slug, headers=HEADERS, timeout=10)
    r.raise_for_status()
    return r.json()["extract"]


documents = []
for i, title in enumerate(ARTICLE_TITLES):
    try:
        documents.append({"id": i, "title": title, "text": fetch_summary(title)})
    except requests.RequestException as e:
        print(f"Skipping {title}: {e}")

if not documents:
    raise RuntimeError("No documents loaded — check network and Wikipedia API availability")
print(f"Loaded {len(documents)} documents\n")
print(f"Sample — {documents[0]['title']}:\n{documents[0]['text'][:300]}...")

def serialize_subgraph(center: str, hops: int = 2) -> str:
    nodes = {center}
    frontier = {center}
    for _ in range(hops):
        nxt = set()
        for n in frontier:
            nxt |= set(G.successors(n)) | set(G.predecessors(n))
        frontier = nxt - nodes
        nodes |= frontier
    sub = G.subgraph(nodes)
    lines = [f"({s}) --[{d['predicate']}]--> ({t})" for s, t, d in sub.edges(data=True)]
    return "\n".join(sorted(set(lines)))


def ask(question: str, graph_context: str | None = None) -> str:
    if graph_context is not None:
        prompt = f"""Answer using only the knowledge graph below. Cite the specific edges that support your answer.

<graph>
{graph_context}
</graph>

Question: {question}"""
    else:
        prompt = question
    response = client.messages.create(
        model=SYNTHESIS_MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    text_block = next((b for b in response.content if b.type == "text"), None)
    if text_block is None:
        raise ValueError(f"No text block in response (stop_reason={response.stop_reason})")
    return text_block.text
```

:::

::: details `misc/pdf_upload_summarization.ipynb` — 把 PDF 当文本喂给模型

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/misc/pdf_upload_summarization.ipynb)

```python
prompt = """
Please do the following:
1. Summarize the abstract at a kindergarten reading level. (In <kindergarten_abstract> tags.)
2. Write the Methods section as a recipe from the Moosewood Cookbook. (In <moosewood_methods> tags.)
3. Compose a short poem epistolizing the results in the style of Homer. (In <homer_results> tags.)
"""
messages = [
    {
        "role": 'user',
        "content": [
            {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": base64_string}},
            {"type": "text", "text": prompt}
        ]
    }
]

def get_completion(client, messages):
    return client.messages.create(
        model=MODEL_NAME,
        max_tokens=2048,
        messages=messages
    ).content[0].text
```

:::

::: details `misc/read_web_pages_with_haiku.ipynb` — 网页当即时语料

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/misc/read_web_pages_with_haiku.ipynb)

```python
response = client.messages.create(model="claude-haiku-4-5", max_tokens=1024, messages=messages)

summary = response.content[0].text
print(summary)
```

:::



## 关键洞察

RAG 失败通常不是「嵌入模型不够新」，是三件事没分开：召回、排序、生成。cookbook 强迫你先做 100 条带 golden chunk 的集，再谈技巧。Contextual retrieval 的洞察更狠：**模型在生成时需要的上下文，必须在嵌入时就已经在向量里**——不能指望检索后再靠 prompt 补救全部指代。

SQL 和图谱提醒：不是所有「问内部数据」都该进向量库。能执行、能报错、能回改的通道，比「语义上接近」更像工程。

## 个人思考

第 1 章钉输出形状；本章钉证据从哪来。两边合在一起才是 citations 能成立的前提：没有检索评测的引用，只是排版。下一章工具会把「取证据」从只读检索扩成可执行的边界。

## 相关

- [[00-Cookbooks阅读导读]]
- [[01-先钉输出]]
- [[04-上下文工程]]
- [[12-集成与第三方]]
- [[05-上下文治理]]

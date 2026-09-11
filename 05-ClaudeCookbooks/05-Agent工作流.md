---
id: n_ec2b8f15bf11
---

# 第 5 章：Agent 工作流

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://github.com/anthropics/claude-cookbooks/tree/main/patterns/agents">patterns/agents/</a> · 状态：已读</p>
</details>

## 一句话

**工作流是把单次调用收成可画出来的图，不是把模型叫成 agent。** 子任务能预先钉死就 chain / parallel / router；钉不死才上 orchestrator；生成和打分必须拆开；异步多代理先把邮箱和生命周期做对，再塞领域工具。

## 核心概念

### 三种还没到「agent」的图

`patterns/agents/basic_workflows.ipynb` 自己说了：示例不是生产代码。三张图：

| 图 | 做什么 | 例子 |
|---|---|---|
| Prompt-chaining | 顺序拆步，后一步吃前一步 | 抽结构再格式化 |
| Parallelization | 独立子任务同时跑 | 多利益相关方影响分析 |
| Routing | 按输入特征选专家路径 | 客服工单分流 |

贵或慢，换的是任务表现。子任务形状稳定时，不要上 orchestrator。

### Orchestrator-workers：运行时才决定拆什么

`orchestrator_workers.ipynb`：中心模型看任务，动态生成 2–3 个 XML 子任务，工人各自生成，编排者不当工人。营销文案变体是好例子——不同产品需要的角度事先不知道。

**用：** 最优拆法依赖这一次输入；要多视角对照。
**不用：** 单输出、延迟敏感、子任务每次都一样（直接 parallel）。

代价写死了：N+1 次调用；示例里工人还是串行，生产应用 `asyncio`。失败模式：编排者拆得烂（prompt 工程）、工人空响应、XML 解析碎（可改 JSON）。和 Book 1 [[07-多代理与验证]] 同一句：多代理解决职责分区，不是人海。

### Evaluator-optimizer：有尺子才配闭环

`evaluator_optimizer.ipynb` 两个适配信号：反馈能明确改进输出；模型自己能给出有意义的反馈。例子是迭代写代码。没有清晰标准就不要上这个环——你会得到一对互相吹捧的模型。第 9 章托管 Agents 的结果评分器、第 10 章评测，是同一原则的产品化和评测化。

### 异步多代理：先看消息路径

`async_multi_agent_orchestration.ipynb` 复现 Opus 4.8 系统卡里的两种形状，**没有领域任务**，故意只暴露工具开火顺序：

1. **固定 N 人团队**：inbox + `asyncio.Event`；`send_message` / `wait_for_message`；消息附加在最近一次 tool result 上，禁止轮询。
2. **动态 spawn**：lead 有 subagent 工具；spawn 立即返回；`get_status` / `wait_for_message` 收报告；`kill_subagents` 解散。

领域工具后来才挂到 `extra_dispatch`。先把邮箱、阻塞等待、生命周期做对，再谈「多智能体研究」。

### Haiku 前线，Opus 收口

`multimodal/using_sub_agents.ipynb`：Apple 2023 财报 PDF 表多，传统解析吃力，转成图给 Haiku 抽，Opus 写回答和 matplotlib。编排者（Opus）先为每个 Haiku 写专用 prompt。演示里 `exec` 模型代码——注释自己说了，沙箱外不要这样。模型分层：便宜模型读量大的模态，贵模型做合成和作图。第 9 章 plan-big/execute-small 是托管版。

对照 recipe（默认折叠；机制片段摘自官方 notebook，全文在 GitHub）：

::: details `patterns/agents/basic_workflows.ipynb` — 链式 / 路由 / 并行，还没到「agent」神话

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/patterns/agents/basic_workflows.ipynb)

```python
def chain(input: str, prompts: list[str]) -> str:
    """Chain multiple LLM calls sequentially, passing results between steps."""
    result = input
    for i, prompt in enumerate(prompts, 1):
        print(f"\nStep {i}:")
        result = llm_call(f"{prompt}\nInput: {result}")
        print(result)
    return result


def parallel(prompt: str, inputs: list[str], n_workers: int = 3) -> list[str]:
    """Process multiple inputs concurrently with the same prompt."""
    with ThreadPoolExecutor(max_workers=n_workers) as executor:
        futures = [executor.submit(llm_call, f"{prompt}\nInput: {x}") for x in inputs]
        return [f.result() for f in futures]


def route(input: str, routes: dict[str, str]) -> str:
    """Route input to specialized prompt using content classification."""
    # First determine appropriate route using LLM with chain-of-thought
    print(f"\nAvailable routes: {list(routes.keys())}")
    selector_prompt = f"""
    Analyze the input and select the most appropriate support team from these options: {list(routes.keys())}
    First explain your reasoning, then provide your selection in this XML format:

    <reasoning>
    Brief explanation of why this ticket should be routed to a specific team.
    Consider key terms, user intent, and urgency level.
    </reasoning>

    <selection>
    The chosen team name
    </selection>

    Input: {input}""".strip()

    route_response = llm_call(selector_prompt)
    reasoning = extract_xml(route_response, "reasoning")
    route_key = extract_xml(route_response, "selection").strip().lower()

    print("Routing Analysis:")
    print(reasoning)
    print(f"\nSelected route: {route_key}")

    # Process input with selected specialized prompt
    selected_prompt = routes[route_key]
    return llm_call(f"{selected_prompt}\nInput: {input}")
```

:::

::: details `patterns/agents/orchestrator_workers.ipynb` — 拆活给工人，编排者不当工人

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/patterns/agents/orchestrator_workers.ipynb)

```python
from util import extract_xml, llm_call

# Model configuration
MODEL = "claude-sonnet-4-6"  # Fast, capable model for both orchestrator and workers


def parse_tasks(tasks_xml: str) -> list[dict]:
    """Parse XML tasks into a list of task dictionaries."""
    tasks = []
    current_task = {}

    for line in tasks_xml.split("\n"):
        line = line.strip()
        if not line:
            continue

        if line.startswith("<task>"):
            current_task = {}
        elif line.startswith("<type>"):
            current_task["type"] = line[6:-7].strip()
        elif line.startswith("<description>"):
            current_task["description"] = line[12:-13].strip()
        elif line.startswith("</task>"):
            if "description" in current_task:
                if "type" not in current_task:
                    current_task["type"] = "default"
                tasks.append(current_task)

    return tasks


class FlexibleOrchestrator:
    """Break down tasks and run them in parallel using worker LLMs."""

    def __init__(
        self,
        orchestrator_prompt: str,
        worker_prompt: str,
        model: str = MODEL,
    ):
        """Initialize with prompt templates and model selection."""
        self.orchestrator_prompt = orchestrator_prompt
        self.worker_prompt = worker_prompt
        self.model = model

    def _format_prompt(self, template: str, **kwargs) -> str:
        """Format a prompt template with variables."""
        try:
            return template.format(**kwargs)
        except KeyError as e:
            raise ValueError(f"Missing required prompt variable: {e}") from e

    def process(self, task: str, context: dict | None = None) -> dict:
        """Process task by breaking it down and running subtasks in parallel."""
        context = context or {}

        # Step 1: Get orchestrator response
        orchestrator_input = self._format_prompt(self.orchestrator_prompt, task=task, **context)
        orchestrator_response = llm_call(orchestrator_input, model=self.model)

        # Parse orchestrator response
        analysis = extract_xml(orchestrator_response, "analysis")
        tasks_xml = extract_xml(orchestrator_response, "tasks")
        tasks = parse_tasks(tasks_xml)

        print("\n" + "=" * 80)
        print("ORCHESTRATOR ANALYSIS")
        print("=" * 80)
        print(f"\n{analysis}\n")

        print("\n" + "=" * 80)
        print(f"IDENTIFIED {len(tasks)} APPROACHES")
        print("=" * 80)
        for i, task_info in enumerate(tasks, 1):
            print(f"\n{i}. {task_info['type'].upper()}")
            print(f"   {task_info['description']}")

        print("\n" + "=" * 80)
        print("GENERATING CONTENT")
        print("=" * 80 + "\n")

        # Step 2: Process each task
        worker_results = []
        for i, task_info in enumerate(tasks, 1):
            print(f"[{i}/{len(tasks)}] Processing: {task_info['type']}...")

            worker_input = self._format_prompt(
                self.worker_prompt,
                original_task=task,
                task_type=task_info["type"],
                task_description=task_info["description"],
                **context,
            )

            worker_response = llm_call(worker_input, model=self.model)
            worker_content = extract_xml(worker_response, "response")

            # Validate worker response - handle empty outputs
            if not worker_content or not worker_content.strip():
                print(f"⚠️  Warning: Worker '{task_info['type']}' returned no content")
                worker_content = f"[Error: Worker '{task_info['type']}' failed to generate content]"

            worker_results.append(
                {
                    "type": task_info["type"],
                    "description": task_info["description"],
                    "result": worker_content,
                }
            )

        # Display results
        print("\n" + "=" * 80)
        print("RESULTS")
        print("=" * 80)
        for i, result in enumerate(worker_results, 1):
            print(f"\n{'-' * 80}")
            print(f"Approach {i}: {result['type'].upper()}")
            print(f"{'-' * 80}")
            print(f"\n{result['result']}\n")

        return {
            "analysis": analysis,
            "worker_results": worker_results,
        }
```

:::

::: details `patterns/agents/evaluator_optimizer.ipynb` — 生成和打分必须拆开

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/patterns/agents/evaluator_optimizer.ipynb)

```python
from util import extract_xml, llm_call


def generate(prompt: str, task: str, context: str = "") -> tuple[str, str]:
    """Generate and improve a solution based on feedback."""
    full_prompt = f"{prompt}\n{context}\nTask: {task}" if context else f"{prompt}\nTask: {task}"
    response = llm_call(full_prompt)
    thoughts = extract_xml(response, "thoughts")
    result = extract_xml(response, "response")

    print("\n=== GENERATION START ===")
    print(f"Thoughts:\n{thoughts}\n")
    print(f"Generated:\n{result}")
    print("=== GENERATION END ===\n")

    return thoughts, result


def evaluate(prompt: str, content: str, task: str) -> tuple[str, str]:
    """Evaluate if a solution meets requirements."""
    full_prompt = f"{prompt}\nOriginal task: {task}\nContent to evaluate: {content}"
    response = llm_call(full_prompt)
    evaluation = extract_xml(response, "evaluation")
    feedback = extract_xml(response, "feedback")

    print("=== EVALUATION START ===")
    print(f"Status: {evaluation}")
    print(f"Feedback: {feedback}")
    print("=== EVALUATION END ===\n")

    return evaluation, feedback


def loop(task: str, evaluator_prompt: str, generator_prompt: str) -> tuple[str, list[dict]]:
    """Keep generating and evaluating until requirements are met."""
    memory = []
    chain_of_thought = []

    thoughts, result = generate(generator_prompt, task)
    memory.append(result)
    chain_of_thought.append({"thoughts": thoughts, "result": result})

    while True:
        evaluation, feedback = evaluate(evaluator_prompt, result, task)
        if evaluation == "PASS":
            return result, chain_of_thought

        context = "\n".join(
            ["Previous attempts:", *[f"- {m}" for m in memory], f"\nFeedback: {feedback}"]
        )

        thoughts, result = generate(generator_prompt, task, context)
        memory.append(result)
        chain_of_thought.append({"thoughts": thoughts, "result": result})
```

:::

::: details `patterns/agents/async_multi_agent_orchestration.ipynb` — 先把邮箱和 spawn/kill 做对

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/patterns/agents/async_multi_agent_orchestration.ipynb)

```python
TRACE: dict[str, list[str]] = defaultdict(list)


def _snip(s, n=60):
    s = str(s).replace("\n", " ")
    return s if len(s) <= n else s[:n] + "…"


async def run_agent(
    hub: Hub,
    name: str,
    system: str,
    first_user_turn: str,
    tools: list = None,
    extra_dispatch=None,
    max_turns: int = 20,
) -> str:
    tools = tools or BASE_TOOLS
    extra_dispatch = extra_dispatch or {}
    messages = [{"role": "user", "content": first_user_turn}]

    try:
        for _ in range(max_turns):
            resp = await client.messages.create(
                model=MODEL,
                max_tokens=2048,
                system=system,
                tools=tools,
                messages=messages,
            )
            messages.append({"role": "assistant", "content": resp.content})

            if resp.stop_reason == "end_turn":
                hub.status[name] = "done"
                return "".join(getattr(b, "text", "") for b in resp.content)
            if resp.stop_reason != "tool_use":
                raise RuntimeError(f"unexpected stop_reason: {resp.stop_reason}")

            results = []
            for block in resp.content:
                if block.type != "tool_use":
                    continue
                TRACE[name].append(block.name)
                if block.name == "send_message":
                    rids = block.input["recipient_ids"]
                    delivered = hub.post(name, rids, block.input["content"])
                    unknown = [r for r in rids if r not in delivered]
                    out = f"delivered to {delivered}" + (f"; unknown: {unknown}" if unknown else "")
                elif block.name == "wait_for_message":
                    hub.status[name] = "idling"
                    try:
                        await asyncio.wait_for(hub.event[name].wait(), timeout=60)
                        out = "woke: new messages"
                    except TimeoutError:
                        out = "woke: 60s timeout"
                    hub.status[name] = "active"
                elif block.name in extra_dispatch:
                    out = await extra_dispatch[block.name](block)
                else:
                    out = f"error: no dispatch for {block.name}"
                print(f"  [{name}] {block.name}({_snip(block.input)}) → {_snip(out)}")
                results.append({"type": "tool_result", "tool_use_id": block.id, "content": out})

            inbox = hub.drain(name)
            for m in inbox:
                print(f"  [{name}] ← received from {m['from']}: {_snip(m['content'])}")
            if results:
                results[-1]["content"] += hub.render(inbox)  # ← the key line
            messages.append({"role": "user", "content": results})

        hub.status[name] = "done"
        return f"[{name} hit max_turns={max_turns}]"
    except Exception:
        hub.status[name] = "crashed"
        raise


def print_trace():
    for agent in sorted(TRACE):
        counts = Counter(TRACE[agent])
        print(f"  {agent}: " + ", ".join(f"{n}×{t}" for t, n in counts.most_common()))
    TRACE.clear()
```

:::

::: details `multimodal/using_sub_agents.ipynb` — Haiku 当前线，Opus 收口

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/multimodal/using_sub_agents.ipynb)

```python
def extract_info(pdf_path, haiku_prompt):
    base64_encoded_pngs = pdf_to_base64_pngs(pdf_path)

    messages = [
        {
            "role": "user",
            "content": [
                *[
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": base64_encoded_png,
                        },
                    }
                    for base64_encoded_png in base64_encoded_pngs
                ],
                {"type": "text", "text": haiku_prompt},
            ],
        }
    ]

    response = client.messages.create(model="claude-haiku-4-5", max_tokens=2048, messages=messages)

    return response.content[0].text, pdf_path


def process_pdf(pdf_path):
    return extract_info(pdf_path, haiku_prompt)


# Process the PDFs concurrently with Haiku sub-agent models
with ThreadPoolExecutor() as executor:
    extracted_info_list = list(executor.map(process_pdf, pdf_paths))

extracted_info = ""
# Display the extracted information from each model call
for info in extracted_info_list:
    extracted_info += (
        '<info quarter="' + info[1].split("/")[-1].split("_")[1] + '">' + info[0] + "</info>\n"
    )
print(extracted_info)
```

:::



## 关键洞察

工作流选型是一张短表：形状稳定 → 三种基本图；形状依赖输入 → orchestrator；需要迭代质量 → evaluator；需要并行探索 → async spawn。每一档都多付 N 次调用。没有 evaluator 的 orchestrator，只是把错误复制成 N 份。

和 Game Design Workshop 的试玩循环是同一类判断：先写下「怎样算过」，再让系统跑。工作流图是机制，尺子在第 1 章和第 10 章。

## 个人思考

第 8 章 SDK、第 9 章托管 Agents 会把这些图收成产品原语（子代理、多代理名册、顾问）。先在 Messages API 上把图画对，再搬运行时，否则你会把框架当能力。

## 相关

- [[00-Cookbooks阅读导读]]
- [[07-多代理与验证]]
- [[08-Claude-Agent-SDK]]
- [[09-Managed-Agents]]
- [[10-评测与成本]]

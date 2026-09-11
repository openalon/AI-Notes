---
id: n_c7c798a1443d
---

# 第 8 章：Claude Agent SDK

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://github.com/anthropics/claude-cookbooks/tree/main/claude_agent_sdk">claude_agent_sdk/</a> · 状态：已读</p>
</details>

## 一句话

**Agent SDK 把 query loop 收成你进程里的运行时：同一套 Read / Edit / Bash / 权限 / 缓存，从 one-liner 到可托管。** `query()` 无状态；生产多轮用 `ClaudeSDKClient`。SDK 把循环放在你这边，下一章 CMA 把循环收到服务端——对照着读，不是升级关系。

## 核心概念

### `query()`：无状态 one-liner

`00_The_one_liner_research_agent.ipynb`：研究任务的路径事先不知道，所以适合 agent 而不是固定 workflow。几行：`query()` + `allowed_tools=["WebSearch"]`。模型自己决定搜什么、何时停。

权限模型：`allowed_tools` 可自由用；其它工具要批准；只读默认开；`disallowed_tools` 从上下文里拿掉。无状态适合一次性、可并行的独立问题；多轮调查、基于上次发现再搜，要换 client。

生产向的三步：`ClaudeSDKClient` 保记忆；system prompt 写研究标准；`Read` 吃图表和截图。

### Chief of Staff：CLAUDE.md 是上下文不是枷锁

`01_The_chief_of_staff_agent.ipynb` 往上叠：memory、output styles、plan mode、subagents、hooks、自定义命令。和 Claude Code 同运行时——仓库里的 `CLAUDE.md` 进上下文，**约束仍靠权限和 hook**，不是靠模型「答应遵守」。Bash 脚本当工具，output style 管交卷格式（第 1 章契约在 SDK 里的位置）。

### Observability → SRE：MCP 从读到写

`02_The_observability_agent.ipynb`：Git MCP（约 13 个本地 git 工具）→ GitHub MCP（100+，Docker + PAT）。agent 从看仓库变成看 Actions、分辨真失败和安全限制。模块化成 `send_query`，`continue_conversation=True` 接多轮。

`03_The_site_reliability_agent.ipynb` 再进一步：**能改配置、能重启**。本地 Docker 模拟 PG + FastAPI + Prometheus。MCP 12 个工具分四类（指标 / 日志 / 配置 / 控制）。要点：

- 写权限靠目录限制、命令 allowlist、validation hook，不靠「请小心」
- **工具 description 比长 prompt 更能驱动自主行为**
- HITL：调查和修复拆开，你决定何时放行

### 从 OpenAI Agents SDK 搬家

`04_migrating_from_openai_agents_sdk.ipynb` 用报销审批当单一例子。你继承 Claude Code 的内置工具、分层权限、自动 cache、事件流。工具要显式 schema，循环你来开。多数 port：**每个工具更啰嗦，别处更少样板**。

| OpenAI | Claude |
|---|---|
| `Agent(...)` + `Runner.run` | `ClaudeAgentOptions` + `ClaudeSDKClient` |
| `@function_tool` | `@tool` + `create_sdk_mcp_server`（进程内 MCP，无网络） |
| input/output guardrail | 循环前后的普通函数（或 `UserPromptSubmit` hook） |
| Sessions / `conversation_id` | 同一 client；`resume=session_id` 落盘 |
| 内置 tracing | OTel → 你已有的 Grafana/Datadog |
| `handoffs` | `AgentDefinition` + Agent tool |

`allowed_tools` 里自定义工具名是 `mcp__{server}__{tool}`。只读自定义工具默认直接跑；写文件 / shell 要 `permission_mode`。

### Session 是产品对象

`05_Building_a_session_browser.ipynb`：SDK 把对话写成 JSONL，并提供列表 / 读消息 / 重命名 / 打标签 / **在任意点 fork 再 `query()`**。agent 循环是产品一半，另一半是侧边栏。Claude Code Desktop / VS Code 就是这些原语。

其余：`06` 安全向检测；`07` 进程外托管；`08` 运行时编排 subagent；`scheduled_repository_reviewer` 定时审仓库。编号顺序就是复杂度顺序。

对照 recipe（默认折叠；机制片段来自对照仓库，全文在 GitHub）：

::: details `claude_agent_sdk/00_The_one_liner_research_agent.ipynb` — 最小可运行 agent

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/claude_agent_sdk/00_The_one_liner_research_agent.ipynb)

```python
from utils.agent_visualizer import (
    display_agent_response,
    print_activity,
)

from claude_agent_sdk import ClaudeAgentOptions, query

messages = []
async for msg in query(
    prompt="Research the latest trends in AI agents and give me a brief summary and relevant citiations links.",
    options=ClaudeAgentOptions(model=MODEL, allowed_tools=["WebSearch"]),
):
    print_activity(msg)
    messages.append(msg)

from claude_agent_sdk import ClaudeSDKClient

# System prompt with citation requirements for research quality
RESEARCH_SYSTEM_PROMPT = """You are a research agent specialized in AI.

When providing research findings:
- Always include source URLs as citations
- Format citations as markdown links: [Source Title](URL)
- Group sources in a "Sources:" section at the end of your response"""

messages = []
async with ClaudeSDKClient(
    options=ClaudeAgentOptions(
        model=MODEL,
        cwd="research_agent",
        system_prompt=RESEARCH_SYSTEM_PROMPT,
        allowed_tools=["WebSearch", "Read"],
        max_buffer_size=10 * 1024 * 1024,  # Increase to 10MB for image handling
    )
) as research_agent:
    # First query: Analyze the chart image
    await research_agent.query("Analyze the chart in research_agent/projects_claude.png")
    async for msg in research_agent.receive_response():
        print_activity(msg)
        messages.append(msg)

    # Second query: Use web search to validate/contextualize the chart findings
    await research_agent.query(
        "Based on the chart analysis, search for recent news or data that validates or provides context for these findings. Include source URLs."
    )
    async for msg in research_agent.receive_response():
        print_activity(msg)
        messages.append(msg)
```

:::

::: details `claude_agent_sdk/01_The_chief_of_staff_agent.ipynb` — 记忆、style、subagent、hook

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/claude_agent_sdk/01_The_chief_of_staff_agent.ipynb)

```python
from dotenv import load_dotenv
from utils.agent_visualizer import (
    display_agent_response,
    print_activity,
    reset_activity_context,
    visualize_conversation,
)

from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient

load_dotenv()

# Define the model to use throughout this notebook
# Using Opus 4.6 for its superior planning and reasoning capabilities
MODEL = "claude-opus-4-6"
print(f"📋 Notebook configured to use: {MODEL}")

messages = []
async with ClaudeSDKClient(
    options=ClaudeAgentOptions(
        model=MODEL,
        cwd="chief_of_staff_agent",  # Points to subdirectory with our CLAUDE.md
        setting_sources=["project"],
    )
) as agent:
    await agent.query("What's our current runway?")
    async for msg in agent.receive_response():
        print_activity(msg)
        messages.append(msg)

# Display the response with HTML rendering
display_agent_response(messages)
# With this prompt, the agent should use CLAUDE.md values: ~$500K burn, 20 months runway

from chief_of_staff_agent.agent import send_query

reset_activity_context()

result, messages = await send_query(
    "/budget-impact hiring 3 senior engineers. Save your insights by updating the 'hiring_decision.md' file in /output_reports or creating a new file there",
    # permission_mode="plan", # Enable this to use planning mode
    output_style="executive",
)
```

:::

::: details `claude_agent_sdk/02_The_observability_agent.ipynb` — MCP 读外部系统

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/claude_agent_sdk/02_The_observability_agent.ipynb)

```python
import os
import shutil
import subprocess
from typing import Any

from dotenv import load_dotenv
from IPython.display import Markdown, display
from utils.agent_visualizer import (
    display_agent_response,
    print_activity,
    reset_activity_context,
    visualize_conversation,
)

from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient

messages = []
async with ClaudeSDKClient(
    options=ClaudeAgentOptions(
        model="claude-opus-4-6",
        mcp_servers=git_mcp,
        allowed_tools=["mcp__git"],
        # disallowed_tools ensures the agent ONLY uses MCP tools, not Bash with git commands
        disallowed_tools=["Bash", "Task", "WebSearch", "WebFetch"],
        permission_mode="acceptEdits",
    )
) as agent:
    await agent.query(
        "Explore this repo's git history and provide a brief summary of recent activity."
    )
    async for msg in agent.receive_response():
        print_activity(msg)
        messages.append(msg)

# run our agent
messages = []
async with ClaudeSDKClient(
    options=ClaudeAgentOptions(
        model="claude-opus-4-6",
        mcp_servers=github_mcp,
        allowed_tools=["mcp__github"],
        # disallowed_tools ensures the agent ONLY uses MCP tools, not Bash with gh CLI
        disallowed_tools=["Bash", "Task", "WebSearch", "WebFetch"],
        permission_mode="acceptEdits",
    )
) as agent:
    await agent.query(
        "Search for the anthropics/claude-agent-sdk-python repository and give me a few key facts about it."
    )
    async for msg in agent.receive_response():
        print_activity(msg)
        messages.append(msg)
```

:::

::: details `claude_agent_sdk/03_The_site_reliability_agent.ipynb` — 作用域内的写和 HITL

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/claude_agent_sdk/03_The_site_reliability_agent.ipynb)

```python
messages = []
async for message in query(prompt=incident_report, options=options):
    if isinstance(message, AssistantMessage):
        for block in message.content:
            if isinstance(block, TextBlock) and block.text.strip():
                print(f"\n{block.text.strip()}")
            elif isinstance(block, ToolUseBlock):
                tool_name = block.name.replace("mcp__sre__", "")
                print(f"\n[Tool] {tool_name}")
    elif isinstance(message, ResultMessage):
        if message.is_error:
            print(f"\nERROR: {message.result}")
    messages.append(message)

investigation_messages = []
async for message in query(prompt=incident_report, options=options):
    if isinstance(message, AssistantMessage):
        for block in message.content:
            if isinstance(block, TextBlock) and block.text.strip():
                print(f"\n{block.text.strip()}")
            elif isinstance(block, ToolUseBlock):
                tool_name = block.name.replace("mcp__sre__", "")
                print(f"\n[Tool] {tool_name}")
    elif isinstance(message, ResultMessage):
        if message.is_error:
            print(f"\nERROR: {message.result}")
    investigation_messages.append(message)

remediation_messages = []
async for message in query(prompt=fix_prompt, options=options):
    if isinstance(message, AssistantMessage):
        for block in message.content:
            if isinstance(block, TextBlock) and block.text.strip():
                print(f"\n{block.text.strip()}")
            elif isinstance(block, ToolUseBlock):
                tool_name = block.name.replace("mcp__sre__", "")
                print(f"\n[Tool] {tool_name}")
    elif isinstance(message, ResultMessage):
        if message.is_error:
            print(f"\nERROR: {message.result}")
    remediation_messages.append(message)
```

:::

::: details `claude_agent_sdk/04_migrating_from_openai_agents_sdk.ipynb` — 控制面怎么搬家

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/claude_agent_sdk/04_migrating_from_openai_agents_sdk.ipynb)

```python
import json

from claude_agent_sdk import create_sdk_mcp_server, tool


@tool(
    "check_policy",
    "Look up the expense policy for a category. Returns the approval limit. Valid categories: meals, travel, software, other.",
    {"category": str, "amount": float},
)
async def check_policy_claude(args):
    limits = {"meals": 75.0, "travel": 500.0, "software": 200.0, "other": 50.0}
    category, amount = args["category"], args["amount"]
    result = {
        "category": category,
        "limit": limits.get(category.lower(), 50.0),
        "requires_receipt": amount > 25.0,
    }
    return {"content": [{"type": "text", "text": json.dumps(result)}]}


policy_server = create_sdk_mcp_server(name="expense", tools=[check_policy_claude])

from claude_agent_sdk import HookMatcher


async def has_dollar_amount_hook(input_data, tool_use_id, context):
    # tool_use_id is None for UserPromptSubmit — it's a uniform signature across all hook types.
    if re.search(r"\$\d+", input_data["prompt"]):
        return {}
    return {"decision": "block", "reason": "I need a dollar amount to process this."}


hooked_options = ClaudeAgentOptions(
    model=CLAUDE_MODEL,
    system_prompt=expense_system_prompt,
    mcp_servers={"expense": policy_server},
    allowed_tools=["mcp__expense__check_policy"],
    hooks={"UserPromptSubmit": [HookMatcher(hooks=[has_dollar_amount_hook])]},
)

# --- In-memory: reuse the same client ---
async def run_claude_multiturn():
    async with ClaudeSDKClient(options=expense_options) as client:
        await client.query("Lunch with Acme, $47")
        async for _ in client.receive_response():
            pass  # consume the stream

        # Same client — remembers turn 1
        await client.query("What about $90?")
        turn2 = [m async for m in client.receive_response()]
        # receive_response() guarantees ResultMessage is the last event yielded
        return turn2[-1].result


print(await run_claude_multiturn())
```

:::

::: details `claude_agent_sdk/05_Building_a_session_browser.ipynb` — session 是一等对象

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/claude_agent_sdk/05_Building_a_session_browser.ipynb)

```python
from claude_agent_sdk import ClaudeAgentOptions, ResultMessage, query


async def run_one_turn(prompt: str) -> str:
    """Run a single-turn conversation and return its session_id."""
    opts = ClaudeAgentOptions(
        model=MODEL,
        cwd=DEMO_DIR,
        max_turns=1,
        allowed_tools=[],  # text-only, no tool loop
    )
    session_id = None
    async for msg in query(prompt=prompt, options=opts):
        if isinstance(msg, ResultMessage):
            session_id = msg.session_id
            preview = (msg.result or "")[:80]
            print(f"[{session_id[:8]}] {preview}...")
    if session_id is None:
        raise RuntimeError("No ResultMessage received; check API key and SDK version.")
    return session_id

from claude_agent_sdk import tag_session

# Mark two sessions as favorites, hide the other
tag_session(demo_session_ids[0], "favorite", directory=DEMO_DIR)
tag_session(demo_session_ids[2], "favorite", directory=DEMO_DIR)
tag_session(demo_session_ids[1], "__hidden", directory=DEMO_DIR)


def visible_sessions(directory: str, tag_filter: str | None = None) -> list[SDKSessionInfo]:
    """List sessions, hiding soft-deletes and optionally filtering by tag."""
    results = []
    for s in list_sessions(directory=directory):
        if s.tag == "__hidden":
            continue
        if tag_filter is not None and s.tag != tag_filter:
            continue
        results.append(s)
    return results


favorites = visible_sessions(DEMO_DIR, tag_filter="favorite")
print(f"Visible favorites: {len(favorites)}")
for s in favorites:
    print(f"  {s.session_id[:8]}  [{s.tag}]  {s.custom_title or s.summary}")

resume_opts = ClaudeAgentOptions(
    model=MODEL,
    cwd=DEMO_DIR,
    max_turns=1,
    allowed_tools=[],
    resume=fork.session_id,
)

async for msg in query(
    prompt="Those were okay. Give me three more names, but punnier.",
    options=resume_opts,
):
    if isinstance(msg, ResultMessage):
        print(f"[fork {fork.session_id[:8]} resumed]")
        print(msg.result)
```

:::

::: details `claude_agent_sdk/06_The_vulnerability_detection_agent.ipynb` — 安全向 agent

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/claude_agent_sdk/06_The_vulnerability_detection_agent.ipynb)

```python
import json
from collections.abc import AsyncIterator
from pathlib import Path

from dotenv import load_dotenv

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    Message,
    ResultMessage,
    TextBlock,
    ToolUseBlock,
    query,
)

load_dotenv()

MODEL_NAME = "claude-opus-4-7"
# This notebook expects to be run from the claude_agent_sdk/ directory
# (Jupyter's default when you open the file from there). The assert makes
# the failure explicit if the kernel was started elsewhere.
TARGET_DIR = Path("vulnerability_detection_agent/canary").resolve()
assert TARGET_DIR.is_dir(), f"run this notebook from claude_agent_sdk/ (got cwd={Path.cwd()})"

ENGAGEMENT_CONTEXT = """\
## Engagement context

This is authorized security research conducted as a defensive security
assessment on a self-contained canary target vendored in this notebook. The
target is read-only source (no execution). Findings are collected for
demonstration and responsible-disclosure workflow testing.
"""


async def collect(stream: AsyncIterator[Message]) -> str:
    """Consume an Agent SDK message stream; print tool calls; return final text.

    Both ``query()`` and ``ClaudeSDKClient.receive_response()`` return an
    ``AsyncIterator[Message]`` that terminates after a ``ResultMessage``.
    This is the same ``async for msg in ...`` loop the other notebooks in this
    series write inline; it is factored out here because this notebook runs
    the loop four times (TM bootstrap, TM interview, find, triage) and the
    ``isinstance`` ladder would otherwise repeat verbatim.
    """
    final = ""
    async for msg in stream:
        if isinstance(msg, AssistantMessage):
            for block in msg.content:
                if isinstance(block, ToolUseBlock):
                    args = str(block.input)
                    args = args if len(args) <= 120 else args[:120] + "...}"
                    print(f"  [tool] {block.name} {args}")
                elif isinstance(block, TextBlock) and block.text.strip():
                    final += block.text
        elif isinstance(msg, ResultMessage) and msg.is_error:
            raise RuntimeError(msg.result)
    return final


print(f"Model: {MODEL_NAME}")
```

:::

::: details `claude_agent_sdk/07_Hosting_the_agent.ipynb` — 进程外托管

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/claude_agent_sdk/07_Hosting_the_agent.ipynb)

```python
from research_agent.agent import DEFAULT_MODEL, RESEARCH_SYSTEM_PROMPT

print(f"model: {DEFAULT_MODEL}")
print(RESEARCH_SYSTEM_PROMPT)
```

:::

::: details `claude_agent_sdk/08_Dynamic_workflows.ipynb` — 运行时编排 subagent

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/claude_agent_sdk/08_Dynamic_workflows.ipynb)

```python
FACT_CHECK_PROMPT = """\
Use a workflow to fact-check the draft investor update at investor_update.md against
the source documents in sources/.

Structure the workflow exactly like this:

1. EXTRACT: one agent reads investor_update.md and extracts its ten numbered
   highlights as structured output (claim number, claim text). Keep the draft's own
   numbering 1-10 and treat each numbered highlight as exactly one claim, even when it
   bundles two figures.

2. VERIFY: one agent per claim, running in parallel. Each verifier reads the source
   documents in sources/ and returns a verdict as structured output:
   - "confirmed" if a source directly supports the claim (quote the supporting line)
   - "contradicted" if a source conflicts with it (quote the conflicting line and
     state the correct figure)
   - "unverifiable" if no source covers it
   Verifiers must quote the exact lines they relied on. Pay attention to subtle
   differences between what a source says and what the draft claims it says.

3. SKEPTIC: for every "confirmed" verdict, one skeptic agent re-reads the cited
   source and tries to refute the confirmation. If the skeptic finds the citation
   does not actually support the claim, the verdict changes to "contradicted".

4. REPORT: one final agent compiles a markdown fact-check report: a table of every
   claim with its verdict and evidence, then a summary of what must be fixed before
   the update can be sent. Return this report as the workflow result.

The working directory is already set to the folder containing these files. Refer to
every file by relative path (e.g. investor_update.md, sources/monthly_sales.csv) in
the script and in agent prompts; do not embed absolute paths.
"""

factcheck_info = await run_agent(FACT_CHECK_PROMPT, workflow_options())
```

:::

::: details `claude_agent_sdk/scheduled_repository_reviewer/scheduled_repository_reviewer.ipynb` — 定时仓库审查

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/claude_agent_sdk/scheduled_repository_reviewer/scheduled_repository_reviewer.ipynb)

```python
async def run_review(
    *,
    repo: Path,
    label: str,
    prompt: str,
    schema: dict[str, Any],
    max_turns: int,
    resume_session_id: str | None = None,
    service_dir: Path | None = None,
) -> RunOutcome:
    """Run one review pass and return its structured result."""
    options = review_options(repo, schema, max_turns, resume_session_id, service_dir)
    outcome = RunOutcome()
    async for message in query(prompt=prompt, options=options):
        match message:
            case AssistantMessage(content=blocks):
                for block in blocks:
                    match block:
                        case TextBlock(text=text):
                            line = text.strip()
                            if line:
                                # Cap what a scheduled log absorbs per block.
                                print(f"[{label}] {clip(line)}")
                        case ToolUseBlock(name=tool_name):
                            outcome.tools_attempted.append(tool_name)
            case ResultMessage() as result:
                outcome.session_id = result.session_id
                outcome.subtype = result.subtype
                outcome.num_turns = result.num_turns
                outcome.total_cost_usd = result.total_cost_usd
                outcome.denials = len(result.permission_denials or [])
                if isinstance(result.structured_output, dict):
                    outcome.payload = result.structured_output
    return outcome


def report(label: str, outcome: RunOutcome) -> Verdict:
    """Print the scheduler-shaped lines for one run and return its verdict."""
    cost = f"{outcome.total_cost_usd:.4f}" if outcome.total_cost_usd is not None else "n/a"
    print(
        f"{label} session={outcome.session_id} subtype={outcome.subtype} "
        f"turns={outcome.num_turns} denials={outcome.denials} "
        f"cost_usd={cost} "
        f"tools_attempted={','.join(dict.fromkeys(outcome.tools_attempted)) or 'none'}"
    )
    verdict = verdict_of(outcome.payload)
    print(f"VERDICT: {verdict}")
    for finding in sequence_of(outcome.payload.get("findings")):
        match finding:
            case {"id": str(finding_id), "file": str(file_path), "summary": str(summary)}:
                print(f"  {clip(finding_id)} {clip(file_path)}: {clip(summary)}")
    return verdict
```

:::



## 关键洞察

SDK 的价值不是「比 Messages API 更能写代码」，是 **把 Claude Code 已经打磨过的循环、权限、工具、session 文件交给你的产品**。`query()` 演示智能；`ClaudeSDKClient` + `allowed_tools` + hook 才是控制面。SRE notebook 把第 3 章的权限课上到基础设施：description 驱动行为，allowlist 驱动安全。

Guardrail 从框架装饰器变回普通函数——拒绝逻辑留在你的代码里，而不是藏进 SDK 对象。这和 moderation 第 1 章「模型不判刑」是亲戚。

## 个人思考

读完 00–05 已经够用。06–08 和定时审查是同一运行时的领域皮肤。若你的问题是「不想运维循环」，下一章 CMA；若你要 IDE / 桌面 / 自建权限，留在 SDK。

## 相关

- [[00-Cookbooks阅读导读]]
- [[03-QueryLoop代理系统的心跳]]
- [[05-Agent工作流]]
- [[09-Managed-Agents]]
- [[04-工具权限与中断]]

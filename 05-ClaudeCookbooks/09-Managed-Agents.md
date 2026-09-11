---
id: n_f0faadb3c817
---

# 第 9 章：Managed Agents

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://github.com/anthropics/claude-cookbooks/tree/main/managed_agents">managed_agents/</a> · 状态：已读</p>
</details>

## 一句话

**托管 Agents（Claude Managed Agents，CMA）把 agent / environment / session 收成服务端资源：循环、沙箱、文件挂载、多代理和预算由平台跑，你负责事件、版本和闸门。** 入门是「修测试直到绿」；生产是凭证库、webhook、prompt 版本、结果评分器。

## 核心概念

### 三个资源和一次 iterate

`CMA_iterate_fix_failing_tests.ipynb` 是入口。Agent = 可复用配置（模型、prompt、工具）；Environment = 容器模板（包、网络）；Session = 绑定二者、挂文件、出事件流。agent / env 创建一次，session 是一次自包含运行。

`agent_toolset_20260401` 是内置工具集（bash/read/write/edit/glob/grep/web_*），不是模型别名。`permission_policy: always_allow` 才不每步审批。`type: cloud` + `networking: limited` 默认锁出站。

文件：上传只读挂在 `/mnt/session/uploads/`；要改先拷到 `/mnt/user` 或 `/tmp`；你要取回的放 `/mnt/session/outputs/`。两个流模式：**先开 SSE 再 send**（不然丢事件）；退出看 `session.status_idle` 且 `stop_reason.type == "end_turn"`（idle 也可能是 `requires_action`）。archive 前 `wait_for_idle_status`——流已经 idle，记录上可能仍 `running`，立刻 archive 会 400。

种 bug 的 `mean()` 依赖 `add`/`divide`：修好后两个，第三个自己绿。教 agent 不要 over-fix。

### 生产面：vault、MCP、webhook

`CMA_operate_in_production.ipynb`：公网 SaaS + bearer → MCP toolset（平台代理，不回你的应用）；只内网 → 自定义工具（gate notebook）。Vault 是 per-user 凭证容器，session 带 `vault_ids`，agent 看不见 token。Webhook 做 HITL，避免为等人一直占 HTTP。CRUD：list/retrieve/update/archive/delete。`inference_geo` 钉推理地域。

### Prompt 是不可变版本

`CMA_prompt_versioning_and_rollback.ipynb`：每次 `agents.update` 出新版本。生产 pin 版本号，回归就改配置指回 v1，不必发版。改 prompt 仍要评审，但审的是版本号。

### 记忆、团队、成本结构

- `CMA_remember_user_preferences.ipynb`：memory store 挂 `/mnt/memory/{name}`；`description` 进 system；应用可读文件做「我们了解你」页。一用户一 store，映射表你自己存。
- `CMA_coordinate_specialist_team.ipynb`：研究员（web）/ 图书馆员（只读案例库）/ 定价（只看规则文件）。工具按角色收口，定价员不能上网抄竞品价。roster 里可放 `{"type":"advisor", model}`——更强模型、无工具、不能 spawn，coordinator 中途咨询。
- `CMA_plan_big_execute_small.ipynb`：前沿模型规划且 **不碰原网页**；便宜 worker 在自己窗口读。作者实验：阅读量接近，84–98% input 走 worker 单价。roster 在 coordinator 创建时快照；**coordinator 看不见 worker 的 prompt**，全靠自己 system 里的描述，平台不强制一致。
- `CMA_verify_with_outcome_grader.ipynb`：第二个 agent 只负责检查。rubric 必须可执行（「打开 10-K 核对 verbatim」），否则 grader 会见段落就过。grader 看不见 writer 推理。示例抓住「用新闻稿冒充 10-K」。
- `CMA_watch_subagents_live.ipynb`：子线程 `event_deltas` 才能直播；否则子 agent 整轮缓冲完你才看见。`initial_events` 创建即开工。`model.effort` 按角色设，session override 无效。
- `CMA_consult_an_advisor.ipynb`：roster 最多一个 advisor，名占 `anthropic.advisor`。工具无入参——顾问看截至呼叫的整段对话。咨询是短命线程，费用可单算。无单次 cap，靠 session budget。
- `CMA_cap_session_spend.ipynb` / `CMA_pin_inference_geo.ipynb`：账单和合规闸门，细节交叉 [[11-生产可观测]]。

### 领域皮肤和未登记

`data_analyst_agent`（CSV→HTML）、`slack_data_bot`（Slack 多轮同一 session）、`sre_incident_responder`（告警→根因→PR→人批）、`CMA_with_mongodb_atlas`。未进 registry：`CMA_gate_human_in_the_loop`、`CMA_explore_unfamiliar_codebase`、`CMA_orchestrate_issue_to_pr`——机制在仓库里，章节表标「未登记」即可。

对照 recipe（默认折叠；机制片段摘自官方 notebook，全文在 GitHub）：

::: details `managed_agents/CMA_iterate_fix_failing_tests.ipynb` — agent / env / session、挂载、SSE、archive

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_iterate_fix_failing_tests.ipynb)

```python
agent = client.beta.agents.create(
    name="cookbook-iterate",
    model=MODEL,
    system=(
        "You are a debugging agent. Your job is to make failing tests pass. "
        "Run the tests, read the failures, fix the code, repeat until green. "
        "Stop when every assertion passes."
    ),
    tools=[
        {
            "type": "agent_toolset_20260401",
            "default_config": {
                "enabled": True,
                "permission_policy": {"type": "always_allow"},
            },
        }
    ],
)

session = client.beta.sessions.create(
    environment_id=env.id,
    agent={"type": "agent", "id": agent.id, "version": agent.version},
    resources=[
        {"type": "file", "file_id": calc_file.id, "mount_path": "calc.py"},
        {"type": "file", "file_id": test_file.id, "mount_path": "test_calc.py"},
    ],
    title="Get the tests green",
)
print(f"session: {session.id}")

client.beta.sessions.events.send(
    session_id=session.id,
    events=[
        {
            "type": "user.message",
            "content": [
                {
                    "type": "text",
                    "text": (
                        "Re-run every assertion from "
                        "/mnt/session/uploads/test_calc.py one more time "
                        "against your final calc.py with `python3 -c ...` "
                        "to confirm they all pass, then cat the final "
                        "/mnt/session/outputs/calc.py."
                    ),
                }
            ],
        }
    ],
)
stream_until_end_turn(client, session.id)
```

:::

::: details `managed_agents/CMA_operate_in_production.ipynb` — vault、MCP、webhook、CRUD、地理

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_operate_in_production.ipynb)

```python
credential = client.beta.vaults.credentials.create(
    vault_id=vault.id,
    display_name="GitHub Copilot",
    auth={
        "type": "static_bearer",
        "mcp_server_url": "https://api.githubcopilot.com/mcp/",
        "token": GH_TOKEN,
    },
)
print(f"credential: {credential.id}")

agent = client.beta.agents.create(
    name="cookbook-operate",
    model=MODEL,
    system="You navigate GitHub repositories on behalf of the logged-in user.",
    mcp_servers=[
        {
            "type": "url",
            "name": "github",
            "url": "https://api.githubcopilot.com/mcp/",
        }
    ],
    tools=[
        {
            "type": "mcp_toolset",
            "mcp_server_name": "github",
            "default_config": {
                "enabled": True,
                "permission_policy": {"type": "always_allow"},
            },
        }
    ],
)

env = client.beta.environments.create(
    name="cookbook-operate-env",
    config={"type": "cloud", "networking": {"type": "unrestricted"}},
)

session = client.beta.sessions.create(
    environment_id=env.id,
    agent={"type": "agent", "id": agent.id, "version": agent.version},
    vault_ids=[vault.id],
    title="Operate demo",
)
print(f"session: {session.id}")
```

:::

::: details `managed_agents/CMA_prompt_versioning_and_rollback.ipynb` — prompt 当版本化工件

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_prompt_versioning_and_rollback.ipynb)

```python
def triage(version: int, ticket: dict) -> dict:
    """Run one ticket through a pinned agent version and return its verdict."""
    session = client.beta.sessions.create(
        agent={"type": "agent", "id": AGENT_ID, "version": version},
        environment_id=ENV_ID,
    )
    try:
        prompt = "Subject: " + ticket["subject"] + "\n\n" + ticket["body"]
        client.beta.sessions.events.send(
            session.id,
            events=[{"type": "user.message", "content": [{"type": "text", "text": prompt}]}],
        )
        deadline = time.time() + 60
        while time.time() < deadline:
            events = client.beta.sessions.events.list(session.id).data
            if events and events[-1].type == "session.status_idle":
                break
            time.sleep(1)
        else:
            raise TimeoutError(f"session {session.id} did not idle within 60s")
        agent_events = [e for e in events if e.type == "agent.message"]
        reply = "".join(b.text for e in agent_events for b in e.content)
        return json.loads(reply)
    finally:
        try:
            client.beta.sessions.archive(session.id)
        except Exception:  # noqa: S110
            pass


def score(version: int) -> dict:
    """Evaluate all tickets against the given version and return per-team accuracy."""
    hits = defaultdict(lambda: [0, 0])
    for t in tickets:
        pred = triage(version, t)
        hits[t["team"]][1] += 1
        if pred.get("team") == t["team"]:
            hits[t["team"]][0] += 1
    return dict(hits)


v1_scores = score(version=1)
print("v1 results:")
for team, (correct, total) in sorted(v1_scores.items()):
    print(f"  {team:14s} {correct}/{total}")
```

:::

::: details `managed_agents/CMA_remember_user_preferences.ipynb` — 跨 session 的 memory store

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_remember_user_preferences.ipynb)

```python
store = client.beta.memory_stores.create(
    name="Shopper Preferences",
    description=(
        "Personal shopping preferences for a single customer: "
        "sizes, style, budget, favorite brands, and materials to avoid."
    ),
)

print(store.id)  # memstore_01...

session_two = client.beta.sessions.create(
    agent={"type": "agent", "id": agent.id, "version": agent.version},
    environment_id=environment.id,
    resources=[memory_resource],  # same store, new session
)

run_turn(
    session_two.id,
    "Hey, I'm back! I need a bag for work. Any recommendations?",
)

wait_for_idle_status(client, session_one.id)
wait_for_idle_status(client, session_two.id)

client.beta.sessions.archive(session_one.id)
client.beta.sessions.archive(session_two.id)
client.beta.memory_stores.delete(store.id)
client.beta.agents.archive(agent.id)
client.beta.environments.archive(environment.id)
```

:::

::: details `managed_agents/CMA_coordinate_specialist_team.ipynb` — 专家团队 + advisor

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_coordinate_specialist_team.ipynb)

```python
def make_agent(name, description, system, tools):
    a = client.beta.agents.create(
        name=name,
        description=description,
        model=MODEL,
        system=system,
        tools=tools,
        betas=BETAS,
    )
    print(f"{name}: {a.id}")
    return a.id


prospect_researcher = make_agent(
    "prospect_researcher",
    "Researches what companies in a given industry segment and size tier typically prioritize.",
    """Given a prospect's industry and size, use web search to find:
- What companies in that segment typically list as strategic priorities
- Recent trends or pressures in that industry
- Common operational pain points at that scale
Return via send_to_parent: {"priorities": [...], "recent_moves": [...], "pain_points": [...], "sources": [...]}""",
    [
        {
            "type": "agent_toolset_20260401",
            "configs": [{"name": "web_search"}, {"name": "web_fetch"}],
        }
    ],
)

case_study_picker = make_agent(
    "case_study_picker",
    "Selects the two most relevant case studies from the library for a given prospect profile.",
    """The case study library is in /mnt/user-data/case_studies/. Each file is one customer story.
You will be given a prospect's industry, size, and top priorities. Read the library, score each study on relevance, and pick the two best matches.
Return via send_to_parent: {"picks": [{"file": ..., "customer": ..., "why_relevant": ...}, ...]}""",
    [{"type": "agent_toolset_20260401"}],
)

pricing_modeler = make_agent(
    "pricing_modeler",
    "Builds two or three pricing options for a prospect based on seat count and expected usage.",
    """Pricing rules are in /mnt/user-data/pricing_rules.md. Given a prospect's estimated seat count and usage tier, build:
- a conservative option (annual commit, lower per-seat)
- a flexible option (monthly, higher per-seat)
- if seat count > 500, an enterprise option with a platform fee
Show the first-year total for each. Return via send_to_parent: {"options": [{"name": ..., "structure": ..., "year_one_total": ...}, ...]}""",
    [{"type": "agent_toolset_20260401"}],
)
```

:::

::: details `managed_agents/CMA_plan_big_execute_small.ipynb` — 大模型规划、小模型读

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_plan_big_execute_small.ipynb)

```python
env = client.beta.environments.create(
    name="research-fanout",
    config={"type": "anthropic_cloud", "networking": {"type": "unrestricted"}},
)

session = client.beta.sessions.create(
    agent=coordinator.id,
    environment_id=env.id,
    # guardrail on data-dependent fan-out: cap the whole team's list cost
    budget={"type": "limit", "max_list_cost": {"currency": "USD", "amount": "1000"}},
    betas=BETAS,
)

QUESTION = (
    "For each of the ten largest national parks in the contiguous United "
    "States by area, find: the current standard private-vehicle entrance "
    "fee, and whether the park currently requires a timed-entry or "
    "day-use reservation for peak season. Each fact must be verified "
    "against that park's official nps.gov pages (fees page and alerts/"
    "reservations page) - not from third-party summaries. Give park, fee, "
    "reservation requirement, and the nps.gov URLs you used."
)

t_start = time.monotonic()

client.beta.sessions.events.send(
    session.id,
    betas=BETAS,
    events=[{"type": "user.message", "content": [{"type": "text", "text": QUESTION}]}],
)


def text_of(content):
    return "".join(b.text for b in content or [] if b.type == "text")


def clip(s, n=160):
    return s[:n] + ("..." if len(s) > n else "")


final_answer = ""
with client.beta.sessions.events.stream(session.id, betas=BETAS) as stream:
    for ev in stream:
        match ev.type:
            case "agent.message":
                if text := text_of(ev.content).strip():
                    final_answer = text
                    print(f"[coordinator] {clip(text, 200)}")
            case "session.thread_created":
                print(f"[spawn] {ev.agent_name} ({ev.session_thread_id})")
            case "agent.thread_message_sent":
                print(f"[delegate -> {ev.to_agent_name}] {clip(text_of(ev.content))}")
            case "agent.thread_message_received":
                print(f"[report <- {ev.from_agent_name}] {clip(text_of(ev.content))}")
            case "session.status_idle":
                break

print(f"\n[team finished in {time.monotonic() - t_start:.0f}s]")
print("=" * 70)
print(final_answer)
```

:::

::: details `managed_agents/CMA_verify_with_outcome_grader.ipynb` — 用结果打分，不自我背书

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_verify_with_outcome_grader.ipynb)

```python
env = client.beta.environments.create(
    name="research-brief",
    config={"type": "anthropic_cloud", "networking": {"type": "unrestricted"}},
)

writer = client.beta.agents.create(
    name="Research Analyst",
    model=MODEL,
    system="""You are a research analyst. You write one-page business briefs.

Cite every factual claim with an inline footnote [n]. End the brief with a Sources section in this exact format, one entry per line:

[n] "verbatim quote from the page, 25 words or fewer" - Title - URL

Only cite pages you actually fetched and read. The quote must be copied character-for-character from the page. Cite no more than 6 sources total. Pick the strongest; do not pad. Save the brief to /mnt/session/outputs/brief.md.""",
    tools=[
        {
            "type": "agent_toolset_20260401",
            "configs": [
                {"name": "web_search"},
                {"name": "web_fetch"},
                {"name": "read"},
                {"name": "write"},
            ],
        }
    ],
    betas=BETAS,
)

session = client.beta.sessions.create(
    agent={"type": "agent", "id": writer.id, "version": writer.version},
    environment_id=env.id,
    title="Brief: EV fast-charging unit economics",
    betas=BETAS,
)
print(f"Session {session.id}")

# Reconstruct the final brief from the event log: full content on `write`,
# then apply each `edit` (old_string -> new_string) in order.
content = ""
for ev in client.beta.sessions.events.list(session.id, limit=1000, betas=BETAS):
    if ev.type != "agent.tool_use" or "brief.md" not in str(ev.input.get("file_path", "")):
        continue
    if ev.name == "write":
        content = ev.input["content"]
    elif ev.name == "edit":
        content = content.replace(ev.input["old_string"], ev.input["new_string"], 1)

# Show the structure and sources rather than the full prose.
for line in content.splitlines():
    if line.startswith(("#", "[")):
        print(line)
```

:::

::: details `managed_agents/CMA_watch_subagents_live.ipynb` — 子线程直播、effort、initial_events

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_watch_subagents_live.ipynb)

```python
RESEARCHER_SYSTEM = """You research US middle school science standards.
Given a unit topic and grade level, use web search to find:
- The two or three NGSS performance expectations the unit should target
- What students are expected to already know, and where the topic leads next
- Two or three documented student misconceptions for the topic
Return via send_to_parent:
{"standards": [...], "prior_knowledge": ..., "leads_to": ...,
 "misconceptions": [...], "sources": [...]}"""

standards_researcher = client.beta.agents.create(
    name="standards_researcher",
    description="Finds the NGSS standards and documented misconceptions for a science topic.",
    model={"id": MODEL, "effort": "high"},
    system=RESEARCHER_SYSTEM,
    tools=[
        {
            "type": "agent_toolset_20260401",
            "configs": [{"name": "web_search"}, {"name": "web_fetch"}],
        }
    ],
    betas=BETAS,
)

COORDINATOR_SYSTEM = """You plan one-week teaching units.
Given a topic and grade level:
1. Send the topic and grade to standards_researcher.
2. When the researcher reports back, send the topic, grade, target standards, and
misconceptions to lesson_writer.
3. Write /mnt/session/outputs/unit_plan.md with sections: Overview, Standards alignment,
Day-by-day plan (from the writer), Misconceptions to watch for, Materials.
Keep it under three pages. To revise the plan, rewrite the whole file with the write
tool rather than patching it with edit. While a subagent is working, wait silently: no
status commentary until its report arrives."""

coordinator = client.beta.agents.create(
    name="unit_planner",
    description="Plans one-week teaching units by delegating research and drafting.",
    model={"id": MODEL},
    system=COORDINATOR_SYSTEM,
    tools=[{"type": "agent_toolset_20260401"}],
    multiagent={
        "type": "coordinator",
        "agents": [standards_researcher.id, lesson_writer.id],
    },
    betas=BETAS,
)
print(f"{coordinator.name}: {coordinator.id} v{coordinator.version}")
```

:::

::: details `managed_agents/CMA_consult_an_advisor.ipynb` — 回合中咨询更强模型

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_consult_an_advisor.ipynb)

```python
SYSTEM = """You are a backend engineer designing HTTP APIs.
You have an advisor: a more capable model that can review your conversation so far and
send back guidance. Consult it with the advisor tool before you commit to any decision
that would be expensive to reverse once clients depend on it: identifier and idempotency
schemes, pagination contracts, error semantics, versioning. Do routine drafting yourself.
When you consult, act on the guidance you get back and say what you changed.
Write your final design to /mnt/session/outputs/design.md."""

designer = client.beta.agents.create(
    name="api_designer",
    description="Designs HTTP APIs, escalating irreversible decisions to an advisor.",
    model={"id": WORKER_MODEL},
    system=SYSTEM,
    tools=[{"type": "agent_toolset_20260401"}],
    multiagent={
        "type": "coordinator",
        "agents": [
            {"type": "advisor", "model": ADVISOR_MODEL},
        ],
    },
    betas=BETAS,
)
print(f"{designer.name}: {designer.id} v{designer.version}")
print("roster:", [entry.to_dict() for entry in designer.multiagent.agents])

env = client.beta.environments.create(
    name="advisor-demo",
    config={"type": "anthropic_cloud", "networking": {"type": "unrestricted"}},
    betas=BETAS,
)

session = client.beta.sessions.create(
    agent=designer.id,
    environment_id=env.id,
    title="Design: refunds API",
    budget={"type": "limit", "max_list_cost": {"currency": "USD", "amount": "500"}},
    initial_events=[
        {
            "type": "user.message",
            "content": [
                {
                    "type": "text",
                    "text": "Design the REST surface for a refunds resource on a payments "
                    "API: create, retrieve, list. Refund creation is retried by mobile "
                    "clients on flaky networks, and a double refund costs real money. "
                    "Cover the request/response shapes, idempotency, pagination on list, "
                    "and error codes.",
                }
            ],
        }
    ],
    betas=BETAS,
)
print(session.id, session.status)
```

:::

::: details `managed_agents/CMA_cap_session_spend.ipynb` — session 花费封顶

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_cap_session_spend.ipynb)

```python
env = client.beta.environments.create(
    name="budget-demo",
    config={"type": "anthropic_cloud", "networking": {"type": "unrestricted"}},
    betas=BETAS,
)

analyst = client.beta.agents.create(
    name="market_analyst",
    description="Writes sourced competitive landscape briefs.",
    model={"id": MODEL},
    system="""You write competitive landscape briefs for product teams.
Given a market, use web search and web fetch to find the notable vendors, their
positioning, and recent moves. Read primary sources rather than aggregators.
Write the brief to /mnt/session/outputs/brief.md with a Sources section listing every
URL you relied on. Keep researching until you are confident the brief is complete.""",
    tools=[
        {
            "type": "agent_toolset_20260401",
            "configs": [{"name": "web_search"}, {"name": "web_fetch"}],
        }
    ],
    betas=BETAS,
)
print(f"{analyst.name}: {analyst.id} v{analyst.version}")

from decimal import Decimal


def usd(money) -> str:
    """Render an integer minor-unit amount ("50" = fifty cents) as dollars."""
    return f"${Decimal(money.amount) / 100:.2f}"


session = client.beta.sessions.create(
    agent=analyst.id,
    environment_id=env.id,
    title="Landscape brief: observability platforms",
    budget={
        "type": "limit",
        "max_list_cost": {"currency": "USD", "amount": "10"},
    },
    initial_events=[
        {
            "type": "user.message",
            "content": [
                {
                    "type": "text",
                    "text": "Write a competitive landscape brief on the observability "
                    "platform market: the main vendors, how each positions itself, "
                    "and any notable moves in the last year.",
                }
            ],
        }
    ],
    betas=BETAS,
)
print(session.id, session.status)
print("budget:", usd(session.budget.max_list_cost))
```

:::

::: details `managed_agents/CMA_use_skills_from_a_repo.ipynb` — 自动发现仓库 skills

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_use_skills_from_a_repo.ipynb)

```python
env = client.beta.environments.create(
    name="repo-skills-demo",
    config={"type": "anthropic_cloud", "networking": {"type": "unrestricted"}},
    betas=BETAS,
)

reviewer = client.beta.agents.create(
    name="cookbook_reviewer",
    description="Reviews notebooks in a mounted cookbook repository.",
    model={"id": MODEL},
    system="You review notebooks in the repository mounted under /workspace. "
    "When the repository provides a process for a task, follow it.",
    tools=[{"type": "agent_toolset_20260401"}],
    betas=BETAS,
)
print(f"{reviewer.name}: {reviewer.id} v{reviewer.version}")

session = client.beta.sessions.create(
    agent=reviewer.id,
    environment_id=env.id,
    title="Cookbook audit",
    resources=[
        {
            "type": "github_repository",
            "url": "https://github.com/anthropics/claude-cookbooks",
            "authorization_token": GH_TOKEN,
            "checkout": {"type": "branch", "name": "main"},
            # mount_path defaults to /workspace/claude-cookbooks
        }
    ],
    betas=BETAS,
)
print(session.id, session.status)

from utilities import stream_until_end_turn

client.beta.sessions.events.send(
    session.id,
    events=[
        {
            "type": "user.message",
            "content": [{"type": "text", "text": "What skills are available to you in this repo?"}],
        }
    ],
    betas=BETAS,
)
stream_until_end_turn(client, session.id)
```

:::

::: details `managed_agents/CMA_pin_inference_geo.ipynb` — 推理地理钉扎

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/managed_agents/CMA_pin_inference_geo.ipynb)

```python
researcher = client.beta.agents.create(
    name="us_records_analyst",
    description="Answers questions about internal records, pinned to US inference.",
    model={"id": MODEL, "inference_geo": "us"},
    system="You answer questions about the records you are given, concisely.",
    tools=[{"type": "agent_toolset_20260401"}],
    betas=BETAS,
)
print(f"{researcher.name}: {researcher.id} v{researcher.version}")
print("inference_geo:", researcher.model.inference_geo)

env = client.beta.environments.create(
    name="residency-demo",
    config={"type": "anthropic_cloud", "networking": {"type": "unrestricted"}},
    betas=BETAS,
)

session = client.beta.sessions.create(
    agent=researcher.id,
    environment_id=env.id,
    title="Records question, US-pinned",
    initial_events=[
        {
            "type": "user.message",
            "content": [
                {"type": "text", "text": "In one sentence: what is a data residency policy?"}
            ],
        }
    ],
    betas=BETAS,
)
print("session pin:", session.agent.model.inference_geo)

with client.beta.sessions.events.stream(session.id, betas=BETAS) as stream:
    for ev in stream:
        if ev.type == "agent.message":
            print("".join(b.text for b in ev.content if b.type == "text"), end="")
        elif ev.type == "session.status_idle":
            print(f"\n[idle] stop_reason={ev.stop_reason.type}")
            break

override = client.beta.sessions.create(
    agent={
        "type": "agent_with_overrides",
        "id": researcher.id,
        "model": {"id": MODEL, "inference_geo": "global"},  # this session only
    },
    environment_id=env.id,
    title="One-off, global geography",
    betas=BETAS,
)
print("override session pin:", override.agent.model.inference_geo)
print(
    "agent still pinned to:",
    client.beta.agents.retrieve(researcher.id, betas=BETAS).model.inference_geo,
)
```

:::



## 关键洞察

托管 Agents 把第 5 章的图变成平台原语：名册 = 编排与工人；结果 = 评测再改；顾问 = 中途升级；effort = 按角色买深度。你买的是沙箱和事件，不是「更聪明的 Claude」。

三条不变式值得当制度：上传只读；先 stream 再 send；idle ≠ 结束（看 `stop_reason`）。prompt 版本化把「改一句人设」从发版问题变成配置问题——前提是 session pin 版本，否则一次 update 扫过所有在跑会话。

grader 的 rubric 比 writer 的任务更具体，否则闭环是假的。plan-big 的 coordinator 看不见 worker prompt：文档漂移是静默故障。

## 个人思考

SDK 和托管 Agents 不是新替旧。要本地文件系统、自定义权限 UI、IDE 嵌入 → SDK。要按用户隔离凭证、按 session 封顶、按版本回滚、不想运维容器 → 托管。两者都还需要第 10 章的尺子和第 11 章的账单。

## 相关

- [[00-Cookbooks阅读导读]]
- [[08-Claude-Agent-SDK]]
- [[08-团队落地]]
- [[Anthropic：The AI-native SDLC playbook]]
- [[07-多代理与验证]]

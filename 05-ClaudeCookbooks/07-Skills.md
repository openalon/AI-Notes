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

对照 recipe（默认折叠；机制片段来自对照仓库，全文在 GitHub）：

::: details `skills/notebooks/01_skills_introduction.ipynb` — 三级加载、和 code execution 的关系

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/skills/notebooks/01_skills_introduction.ipynb)

```python
# Simple test to verify API connection
test_response = client.messages.create(
    model=MODEL,
    max_tokens=100,
    messages=[
        {
            "role": "user",
            "content": "Say 'Connection successful!' if you can read this.",
        }
    ],
)

print("API Test Response:")
print(test_response.content[0].text)
print(
    f"\n✓ Token usage: {test_response.usage.input_tokens} in, {test_response.usage.output_tokens} out"
)

# Create a PowerPoint presentation
pptx_response = client.beta.messages.create(
    model=MODEL,
    max_tokens=4096,
    container={"skills": [{"type": "anthropic", "skill_id": "pptx", "version": "latest"}]},
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
    messages=[
        {
            "role": "user",
            "content": """Create a simple 2-slide PowerPoint presentation:

Slide 1: Title slide
- Title: "Q3 2025 Results"
- Subtitle: "Acme Corporation"

Slide 2: Revenue Overview
- Title: "Quarterly Revenue"
- Add a simple column chart showing:
  - Q1: $12M
  - Q2: $13M
  - Q3: $14M

Use clean, professional formatting.
""",
        }
    ],
    betas=["code-execution-2025-08-25", "files-api-2025-04-14", "skills-2025-10-02"],
)

print("PowerPoint Response:")
print("=" * 80)
for content in pptx_response.content:
    if content.type == "text":
        print(content.text)

print("\n\n📊 Token Usage:")
print(f"   Input: {pptx_response.usage.input_tokens}")
print(f"   Output: {pptx_response.usage.output_tokens}")
```

:::

::: details `skills/notebooks/02_skills_financial_applications.ipynb` — 财务场景：技能包比长 prompt 稳

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/skills/notebooks/02_skills_financial_applications.ipynb)

```python
def create_skills_message(client, prompt, skills, prefix="", show_token_usage=True):
    """
    Helper function to create messages with Skills.

    Args:
        client: Anthropic client
        prompt: User prompt
        skills: List of skill dicts [{"type": "anthropic", "skill_id": "xlsx", "version": "latest"}]
        prefix: Prefix for downloaded files
        show_token_usage: Whether to print token usage

    Returns:
        Tuple of (response, download_results)
    """
    response = client.beta.messages.create(
        model=MODEL,
        max_tokens=4096,
        container={"skills": skills},
        tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
        messages=[{"role": "user", "content": prompt}],
        betas=[
            "code-execution-2025-08-25",
            "files-api-2025-04-14",
            "skills-2025-10-02",
        ],
    )

    if show_token_usage:
        print(
            f"\n📊 Token Usage: {response.usage.input_tokens} in, {response.usage.output_tokens} out"
        )

    # Download files
    results = download_all_files(client, response, output_dir=str(OUTPUT_DIR), prefix=prefix)

    return response, results


def format_financial_value(value, is_currency=True, decimals=0):
    """Format financial values for display."""
    if is_currency:
        return f"${value:,.{decimals}f}"
    else:
        return f"{value:,.{decimals}f}"


print("✓ Helper functions defined")
```

:::

::: details `skills/notebooks/03_skills_custom_development.ipynb` — 自己写 Skill 的形状

[GitHub 全文](https://github.com/anthropics/claude-cookbooks/blob/main/skills/notebooks/03_skills_custom_development.ipynb)

```python
# Create a new version of the enhanced Financial Analyzer skill
def create_skill_version(client: Anthropic, skill_id: str, skill_path: str):
    """Create a new version of an existing skill."""
    try:
        version = client.beta.skills.versions.create(
            skill_id=skill_id, files=files_from_dir(skill_path)
        )
        return {
            "success": True,
            "version": version.version,
            "created_at": version.created_at,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# Create the new version with our healthcare enhancement
if "financial_skill_id" in locals():
    print("Creating new version of Financial Analyzer with healthcare benchmarks...")

    result = create_skill_version(
        client, financial_skill_id, str(SKILLS_DIR / "analyzing-financial-statements")
    )

    if result["success"]:
        print("✅ New version created successfully!")
        print(f"   Version: {result['version']}")
        print(f"   Created: {result['created_at']}")
        print("\n📊 Version History:")
        print("   v1: Original skill with tech, retail, financial, manufacturing")
        print(f"   v{result['version']}: Enhanced with healthcare industry benchmarks")
    else:
        print(f"❌ Version creation failed: {result['error']}")
else:
    print("⚠️ Please run the previous cells to upload the skill and make enhancements first")
```

:::

::: details `managed_agents/CMA_use_skills_from_a_repo.ipynb` — CMA 自动捡仓库 `.claude/skills`

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



## 关键洞察

Skills 解决的是 **程序性知识的分发和计费**。全塞 system：每次请求都付钱，还和缓存打架（第 4 章）。做成 skill：元数据几乎免费，用到才加载，代码是仓库里的事实而不是模型即兴。组织知识（品牌、关账、合规清单）终于有一个不像 wiki、不像 prompt 的落点。

发现失败是静默的：description 写得不像用户任务，skill 等于不存在。

## 个人思考

第 1 章钉输出形状（xlsx 也是一种形状）；本章钉「怎么稳定地造出那种形状」。下一章 Agent SDK 会把 skill、tool、CLAUDE.md 放进同一个 query loop——skill 是控制面的一层，不是插件市场。

## 相关

- [[00-Cookbooks阅读导读]]
- [[05-上下文治理]]
- [[06-技能Hook与本地规则]]
- [[09-Managed-Agents]]
- [[Warp：How Warp builds self-improving agents on Claude]]

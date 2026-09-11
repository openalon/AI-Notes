---
id: n_f0faadb3c817
---

# 第 9 章：Managed Agents

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="https://github.com/anthropics/claude-cookbooks/tree/main/managed_agents">managed_agents/</a> · 状态：已读</p>
</details>

## 一句话

**CMA 把 agent / environment / session 收成服务端资源：循环、沙箱、文件挂载、多代理和预算由平台跑，你负责事件、版本和闸门。** 入门是「修测试直到绿」；生产是 vault、webhook、prompt 版本、outcome grader。

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

对照 recipe：

| 路径 | 钉的是什么 |
|---|---|
| `managed_agents/CMA_iterate_fix_failing_tests.ipynb` | agent / env / session、挂载、SSE、archive |
| `managed_agents/CMA_operate_in_production.ipynb` | vault、MCP、webhook、CRUD、地理 |
| `managed_agents/CMA_prompt_versioning_and_rollback.ipynb` | prompt 当版本化工件 |
| `managed_agents/CMA_remember_user_preferences.ipynb` | 跨 session 的 memory store |
| `managed_agents/CMA_coordinate_specialist_team.ipynb` | 专家团队 + advisor |
| `managed_agents/CMA_plan_big_execute_small.ipynb` | 大模型规划、小模型读 |
| `managed_agents/CMA_verify_with_outcome_grader.ipynb` | 用结果打分，不自我背书 |
| `managed_agents/CMA_watch_subagents_live.ipynb` | 子线程直播、effort、initial_events |
| `managed_agents/CMA_consult_an_advisor.ipynb` | 回合中咨询更强模型 |
| `managed_agents/CMA_cap_session_spend.ipynb` | session 花费封顶 |
| `managed_agents/CMA_use_skills_from_a_repo.ipynb` | 自动捡仓库 skills |
| `managed_agents/CMA_pin_inference_geo.ipynb` | 推理地理钉扎 |
| 其余领域 notebook + 三份未登记 | 同一 API 的皮肤和闸门 |

## 关键洞察

CMA 把第 5 章的图变成平台原语：roster = orchestrator-workers；outcome = evaluator-optimizer；advisor = 中途升级；effort = 按角色买深度。你买的是沙箱和事件，不是「更聪明的 Claude」。

三条不变式值得当制度：上传只读；先 stream 再 send；idle ≠ 结束（看 `stop_reason`）。prompt 版本化把「改一句人设」从发版问题变成配置问题——前提是 session pin 版本，否则一次 update 扫过所有在跑会话。

grader 的 rubric 比 writer 的任务更具体，否则闭环是假的。plan-big 的 coordinator 看不见 worker prompt：文档漂移是静默故障。

## 个人思考

SDK vs CMA 不是新替旧。要本地文件系统、自定义权限 UI、IDE 嵌入 → SDK。要按用户隔离凭证、按 session 封顶、按版本回滚、不想运维容器 → CMA。两者都还需要第 10 章的尺子和第 11 章的账单。

## 相关

- [[00-Cookbooks阅读地图]]
- [[08-Claude-Agent-SDK]]
- [[08-团队落地]]
- [[Anthropic：The AI-native SDLC playbook]]
- [[07-多代理与验证]]

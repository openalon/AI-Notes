---
name: ingest-article
description: 把文章、博客、X 长帖整理进 AI-Notes 知识库。用户丢来 URL、帖子、PDF、或说「整理这篇文章」「写学习总结」「沉淀进笔记」「加到知识库」「写一篇 thought」时必须用。产出符合本库的 frontmatter、一句话结论、图、核心观点，并更新 00-Maps。不要只在对话里总结。
---

# 整理文章进 AI-Notes

把外部材料变成这个仓库里的笔记，而不是聊天记录。笔记同时给 Obsidian 和 VitePress 用，所以写完要能在两边打开。

先读本文件。需要对照成品时再打开 [references/examples.md](references/examples.md)。

## 仓库约定

```text
00-Maps/AI知识库总览.md     入口；新文章必须补一条双链
01-Articles/X/              X / Twitter 长帖、X Article
01-Articles/其他/           博客、官网、非 X 来源
01-Articles/X/<作者>/       同一来源多篇时再分子目录（如 宝玉、GoogleCloudTech）
02-Thoughts/                跨文之后的独立判断，不是转述
03-HarnessEngineering/      只给 Harness 书章节笔记，不走本 skill 的文章模板
```

图片放在对应分区的 `_assets/`，例如 `01-Articles/X/_assets/`、`01-Articles/其他/_assets/`。不要把图丢进 `99-Inbox`。

## 何时用哪一类笔记

| 用户给的是 | 写到 |
|---|---|
| 一篇文章 / 一条长帖 / 一组同源链接 | `01-Articles/` 学习总结 |
| 读完多篇之后要自己的判断、对照、立场 | `02-Thoughts/` |
| Harness 书某一章 | 不要用本 skill；去填 `03-HarnessEngineering/` 现有章节文件 |

一篇源文对应一篇文章笔记。多篇源文合成一份判断时，才写 thought，并在 `related` 里双链回那些文章。

## 工作流

### 1. 读原文，不要凭记忆写

- 有 URL：抓全文。X 帖尽量拿到原帖和它指向的 article。
- 一组同源链接（同一作者同一主题的系列博文）：合成**一篇**笔记，`source` 列全部 URL。
- 抓不到就停，向用户要原文或粘贴，不要补造观点。
- 先用原文语言理解，再用中文写笔记。关键术语可保留英文。

### 2. 定路径和文件名

- X：`01-Articles/X/<标题>.md`
- 非 X：`01-Articles/其他/<标题>.md`
- 同一账号已有子目录：放进该子目录，并视情况更新那里的 `00-索引.md`
- Thought：`02-Thoughts/<判断句或主题>.md`

文件名就是笔记标题，也是 wikilink 名。可以带作者前缀，例如 `Zed：Introducing Delta`、`Anthropic：The AI-native SDLC playbook`。

不要用日期当文件名，不要写成 `summary-of-...`。

### 3. 写文章笔记

严格按这个骨架，缺块会让后面对照时对不齐：

```markdown
---
title: <与文件名一致>
tags:
  - AI
  - Agent
source:
  - https://...
created: YYYY-MM-DD
---

## 一句话结论

<一句完整判断，不是摘要。点出作者真正改了哪一层假设。>

## 一张图看懂

<优先 mermaid。流程、分层、对照用 flowchart；关系用简表。>

## 核心观点

### 1. <观点标题，是判断不是「背景介绍」>

<用自己的话转述机制。必要时引用原句，并标明是谁说的。>

### 2. ...
```

写作约束：

- **一句话结论**是判断，不是「本文介绍了…」。可以加粗关键从句。
- **一张图**优先 ` ```mermaid `。只有原文已经有必须保留的配图时，才把图存到 `_assets/` 并用 `![[01-Articles/.../_assets/<file>.png]]`。
- **核心观点** 4–8 条。每条先写机制，再写它否定了什么旧假设。
- 内部互链用 `[[笔记名]]`，外链用普通 Markdown。
- `tags` 用已有风格：`AI`、`Agent`、`Agent-Native`、`Harness-Engineering`、`Git`、产品名、作者名。英文词保持 Pascal / kebab，与现有笔记一致。
- `created` 用当天日期（会话里的「今天」）。
- 不要写「作为 AI 我认为」、不要列待办、不要在文末加「延伸阅读」堆砌。

### 4. 写 thought（仅当用户要判断，或材料本身是对照）

用户说「对照这几篇」「你怎么看」「写一篇思考」时才写。结构：

```markdown
---
title: <判断主题>
type: thought
created: YYYY-MM-DD
tags:
  - Agent-Native
related:
  - "[[已有文章笔记]]"
---

## 一句话结论

<跨文之后的立场，不是把各篇结论再拼一次。>

## 各自在补哪一层

<对照表：每家/每篇改的是哪一层，对 Git / 工作流 / 人的位置持什么态度。>

## 共同之处

### 1. ...

## 分歧

### 1. ...

## 对未来的判断
```

Thought 里禁止大段复述某篇文章；机制已经写在 `01-Articles/` 里。这里只做分层、对照、自己的推论。`related` 必须能点回那些文章。

可参考：`02-Thoughts/Agent-native 软件基础设施与工作流.md`。

### 5. 更新地图

打开 `00-Maps/AI知识库总览.md`，在「最近新增」列表**最上面**插入：

```markdown
- [[笔记标题]]：<比一句话结论更短的钩子，大约一句>
```

不要改「目录说明」。地图里的双链只用笔记名，不要写路径。

同一作者子目录若有 `00-索引.md`，同步加条目。

### 6. 自检

- 文件名、`title`、wikilink 三者一致
- `source` 是可打开的原文链接
- 一句话结论读起来像判断
- 图能在 VitePress / Obsidian 里渲染（mermaid 或 `![[...]]`）
- 没有把草稿留在对话里却不落盘
- 没有把 thought 写成第二篇学习总结

### 7. 重跑本仓库的网页预览

侧栏和笔记索引在 `vitepress dev` **启动时**扫一遍仓库，新文件不会自动进左侧导航。落盘并更新地图之后，立刻重跑本仓库的开发服，不要让用户自己停再开。

1. 只结束本仓库的 `vitepress dev`（或它的 node 子进程）。匹配依据是**运行时的仓库根路径**（`pwd` / git 根），不要把本机用户名或绝对路径写进仓库。不要动其他目录里的 VitePress（例如 claude-code-guide、herdr）。
2. 在仓库根执行 `npm run docs:dev`，放到后台。端口仍走 `.vitepress/config.mts` 的 `5280`，被占用则顺延。
3. 不要加 `host: true`，不要改端口配置。
4. 收尾那两三句话里带上实际地址，默认 `http://127.0.0.1:5280/`。

## 不要做的事

- 不要把笔记写进 `docs/` 或 `.vitepress/`。源文件就是 vault。
- 不要为了网页把 `[[wikilink]]` 改成 Markdown 链接。
- 不要新建第三套分区（例如 `04-Inbox`），除非用户明确要求。
- 不要自动 git commit。
- 不要把 Harness 书章节笔记改成文章模板。

## 用户只丢了一个链接时

按文章笔记全流程做完：落盘、画图、更新地图、重跑本仓库 `npm run docs:dev`。做完用两三句话说明写到了哪个文件、一句话结论是什么、网页地址。不要问「要不要保存」。

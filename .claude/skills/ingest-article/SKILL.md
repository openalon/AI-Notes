---
name: ingest-article
description: 把文章、博客、X 长帖整理进 AI-Notes 的文章分区。用户丢来 URL、帖子、PDF、或说「整理这篇文章」「写学习总结」「沉淀进笔记」「加到知识库」时必须用。产出 01-Articles/ 下带 frontmatter 的学习总结，并更新 00-Overview。不要只在对话里总结。跨文判断走 ingest-thought；书的章节走 ingest-book。
---

# 整理文章进 AI-Notes

把一篇外部材料变成这个仓库里的文章笔记，而不是聊天记录。笔记同时给 Obsidian 和 VitePress 用。

先读本文件。写之前打开 [references/examples.md](references/examples.md)，并从**本仓库根** Read 一篇密度样本：

- `01-Articles/其他/Anthropic：The AI-native SDLC playbook.md`
- `01-Articles/其他/Cursor：Git at any scale.md`

这是 vault 里的成品笔记，不是外链，也不是 skill 目录里的文件。用词先读 [../note-language/SKILL.md](../note-language/SKILL.md)。

跨文判断走 `ingest-thought`。一本书或 recipe 集走 `ingest-book`。本 skill 只管 `01-Articles/`。

## 仓库约定

本库三类内容，三个 skill：

```text
00-Overview/AI知识库总览.md     入口；新文章必须补一条双链
01-Articles/X/              X / Twitter 长帖、X Article
01-Articles/其他/           博客、官网、非 X 来源
01-Articles/X/<作者>/       同一来源多篇时再分子目录（如 宝玉、GoogleCloudTech）
02-Thoughts/                跨文判断 → ingest-thought
03- 起的书籍分区             章节笔记 → ingest-book
```

图片放在对应分区的 `_assets/`，例如 `01-Articles/X/_assets/`、`01-Articles/其他/_assets/`。不要把图丢进 `99-Inbox`。

## 何时用

| 用户给的是 | 做 |
|---|---|
| 一篇文章 / 一条长帖 / 一组同源链接 | 本 skill，写到 `01-Articles/` |
| 「对照这几篇」「你怎么看」「写一篇思考」 | 转 `ingest-thought` |
| 一本新书 / 填某一章 / Cookbooks recipe | 转 `ingest-book` |

一篇源文对应一篇文章笔记。多篇源文合成一份判断时，先保证各篇已经落盘，再写 thought。

## 工作流

### 1. 读原文，不要凭记忆写，也不要凭二次摘要写

- 有 URL：抓全文。X 帖尽量拿到原帖和它指向的 article。帖是入口时，笔记按 **article 的论证** 写，不要按推文句子扩写。
- 一组同源链接（同一作者同一主题的系列博文）：合成**一篇**笔记，`source` 列全部 URL。作者自己的前序信如果是同一机制（例如 Ng 的三层循环），读完再写，不要只写最新一封的目录。
- WebFetch / 搜索经常返回改写提纲或 125 字摘录。提纲不够。必须拿到：具体分叉、尺度（2–3 人访谈 / 上百份问卷）、作者自己的对照句。拿不到就停，向用户要原文或粘贴，不要用二次摘要当原文。
- 抓不到就停，向用户要原文或粘贴，不要补造观点；只能读到部分内容时，也不得声称完成了全文阅读。
- 写入前先按 source、basename 和目标路径查重。已有笔记默认不覆盖；同一 source 重跑时更新原笔记或明确告知已存在，保留原 `id`。
- 更新总览或作者索引时按已有条目做幂等更新，不重复插入。
- 先用原文语言理解，再用中文写笔记。关键术语可保留英文。

### 2. 定路径和文件名

- X：`01-Articles/X/<标题>.md`
- 非 X：`01-Articles/其他/<标题>.md`
- 同一账号已有子目录：放进该子目录，并视情况更新那里的 `00-索引.md`

文件名就是笔记标题，也是 wikilink 名。可以带作者前缀，例如 `Zed：Introducing Delta`、`Anthropic：The AI-native SDLC playbook`。

**basename 全库必须唯一。** VitePress `byName` 只认文件名，不认路径。不要再用一个已经存在的笔记名。

不要用日期当文件名，不要写成 `summary-of-...`。

### 3. 写文章笔记

严格按这个骨架，缺块会让后面对照时对不齐：

```markdown
---
id: n_<12 hex>
title: <与文件名一致>
nav: <侧栏短标签，作者或产品 + 机制，约 8 字>
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

- **一句话结论**是判断，不是「本文介绍了…」。可以加粗关键从句。点出作者改了哪一层假设，不要复述小标题。
- **一张图**优先 ` ```mermaid `。图画的是机制（谁驱动哪一圈、真理在哪一层），不是把小标题连成流程图。标签用词走 `note-language`。只有原文已经有必须保留的配图时，才把图存到 `_assets/` 并用 `![[01-Articles/.../_assets/<file>.png]]`。
- **核心观点** 4–8 条，每条是一段能独立站住的机制，不是作者目录的中文版。先写：谁、改了哪一层、用什么替换、读者能带走的判断。数字、分叉、尺度写进段落。引用原句当证据，不要让引语承担正文。
- 「否定了什么旧假设」是机制段末尾的一句，不是每条后面贴同一句模板。
- 库里已有相邻判断时，用 `[[wikilink]]` 点明差在哪一层（例如制度闸门 vs 个人技能），不要只外链原文。
- 内部互链用 `[[笔记名]]`，外链用普通 Markdown。
- `nav` 是侧栏短标签，不是标题缩写。格式：`作者或产品：机制`（例如 `Ng：改规格`、`Cursor：Git 托管`）。页面标题仍用完整 `title` / 文件名。没有 `nav` 时侧栏会回退到长标题。
- `tags` 用已有风格：`AI`、`Agent`、`Agent-Native`、`Harness-Engineering`、`Git`、产品名、作者名。英文词保持 Pascal / kebab，与现有笔记一致。
- `created` 用当天日期（会话里的「今天」）。
- `id` 用 `n_` + 12 位 hex（例如 `python3 -c "import secrets; print('n_' + secrets.token_hex(6))"`），写入后永不改。网页评论和表情按这个 id 走，跟标题、文件名、路径无关。
- 出处写 YAML `source:`。网页上的 cite 芯片由 `.vitepress/obsidian.ts` 注入，不要在文章正文再手写一份 `<details class="note-cite">`（书籍章节才手写芯片）。
- 不要写「作为 AI 我认为」、不要列待办、不要在文末加「延伸阅读」堆砌。
- **反例（不要再写）**：`Andrew Ng：Shaping the build` 的第一稿把四项技能名译成五个小标题，每条 = 一句引语 + 清单 + 「否定的旧假设是…」。删掉小标题只剩目录。对照 `Anthropic：The AI-native SDLC playbook`：每条有工件名、闸门角色、碎掉的前提。

### 4. 更新总览

打开 `00-Overview/AI知识库总览.md`，在「最近新增」列表**最上面**插入：

```markdown
- [[笔记标题]]：<比一句话结论更短的钩子，大约一句>
```

不要改「目录说明」。总览里的双链只用笔记名，不要写路径。

同一作者子目录若有 `00-索引.md`，同步加条目。

### 5. 自检

- 文件名、`title`、wikilink 三者一致，basename 全库唯一
- `nav` 已写，侧栏扫一眼能认出是哪篇，不是整句博客标题
- `id` 已写入且是新生成的，没有复用别的笔记
- `source` 是可打开的原文链接
- 一句话结论读起来像判断
- 图能在 VitePress / Obsidian 里渲染（mermaid 或 `![[...]]`）
- 没有把草稿留在对话里却不落盘
- 没有写成 thought 或书的章节模板
- **密度**：删掉小标题和列表，正文仍能讲清机制。每条有具体分叉或尺度，不是作者目录的翻译。写前读过一篇密度样本，而不是只读了本 skill 的模板。

### 6. 重跑本仓库的网页预览

侧栏和笔记索引在 `vitepress dev` **启动时**扫一遍仓库，新文件不会自动进左侧导航。落盘并更新总览之后，立刻重跑本仓库的开发服，不要让用户自己停再开。

1. 只结束本仓库的 `vitepress dev`（或它的 node 子进程）。匹配依据是**运行时的仓库根路径**（`pwd` / git 根），不要把本机用户名或绝对路径写进仓库。不要动其他目录里的 VitePress（例如 claude-code-guide、herdr）。
2. 在仓库根执行 `npm run docs:dev`，放到后台。端口仍走 `.vitepress/config.mts` 的 `5280`，被占用则顺延。
3. 不要加 `host: true`（那会对外网卡开放）。本机必须能打开 `http://127.0.0.1:5280/`：配置里 `server.host` 用 `'127.0.0.1'`，不要只听 `[::1]`。
4. 收尾那两三句话里带上实际地址，默认 `http://127.0.0.1:5280/`。

## 不要做的事

- 不要把笔记写进 `docs/` 或 `.vitepress/`。源文件就是 vault。
- 不要为了网页把 `[[wikilink]]` 改成 Markdown 链接。
- 不要发明第四类内容分区。三类就是文章 / 思考 / 书籍。
- 不要自动 git commit。
- 不要把书籍章节笔记改成文章模板，也不要把单篇博客写成 thought。
- 不要把作者的小标题译成核心观点标题，下面再挂清单。那是比原文差的摘要，不是学习总结。

## 用户只丢了一个链接时

按文章笔记全流程做完：落盘、画图、更新总览、重跑本仓库 `npm run docs:dev`。做完用两三句话说明写到了哪个文件、一句话结论是什么、网页地址。不要问「要不要保存」。

## 修笔记时回写

用词、图上的标签、直译、本机路径 → `note-language`。文章落盘流程（YAML、cite、目录）和**写作密度** → 本文件。思考侧写 `ingest-thought`，书籍侧写 `ingest-book`。

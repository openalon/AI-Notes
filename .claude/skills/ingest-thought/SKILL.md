---
name: ingest-thought
description: 把跨文之后的独立判断写成 AI-Notes 的思考笔记。用户说「写一篇 thought」「对照这几篇」「你怎么看」「整理思考」时必须用。产出 02-Thoughts/ 下 type: thought 笔记，related 双链回已有文章或书的章节。不要转述源文，不要走文章或书籍模板。
---

# 整理思考进 AI-Notes

思考是第三类笔记：不是又一篇学习总结，也不是一章书。它只在多篇材料已经入库之后，写分层、对照和自己的推论。

先读本文件。对照成品：`02-Thoughts/Agent-native 软件基础设施与工作流.md`。用词先读 [../note-language/SKILL.md](../note-language/SKILL.md)。

单篇源文走 `ingest-article`。一本书的某一章走 `ingest-book`。

## 仓库约定

```text
00-Overview/AI知识库总览.md     入口；新 thought 必须补一条双链
01-Articles/                   源文的机制写在这里
02-Thoughts/                   跨文判断，本 skill 只写这里
03- 起的书籍分区                 可被 related 链回，但 thought 不放进书的目录
```

## 何时写

| 用户给的是 | 做 |
|---|---|
| 「对照这几篇」「你怎么看」「写一篇思考」 | 本 skill |
| 一篇尚未入库的文章，顺便要判断 | 先 `ingest-article` 落盘源文，再写 thought |
| 只有一篇源文，没有对照 | 不要写 thought，去写或改文章笔记 |
| 某本书的某一章 | 不要用本 skill |

没有已经落盘的源笔记，就不要凭记忆写 thought。先问要对照哪几篇，缺的先收文或填章；任何相关源笔记不可读或缺失时停止，不要先写一个不完整的 thought。

## 工作流

### 1. 定文件名

先按主题、source 和目标路径查重。已有 thought 默认不覆盖；需要修订时保留原 `id`，总览已有同名双链则只更新内容，不重复插入。

`02-Thoughts/<判断句或主题>.md`

文件名就是笔记标题，也是 wikilink 名。用立场或主题，不要 `thoughts-on-…`，不要日期。

### 2. 写 thought

```markdown
---
id: n_<12 hex>
title: <与文件名一致>
type: thought
created: YYYY-MM-DD
tags:
  - Agent-Native
related:
  - "[[已有文章或章节]]"
---

## 一句话结论

<跨文之后的立场，不是把各篇结论再拼一次。>

## 各自在补哪一层

<对照表：每家/每篇改的是哪一层。>

## 共同之处

### 1. ...

## 分歧

### 1. ...

## 对未来的判断
```

约束：

- **禁止大段复述**某篇文章或某一章。机制已经写在 `01-Articles/` 或书籍章节里。
- `related` 必须能点回那些笔记，用 wikilink，不要只写 URL。
- `id` 用 `n_` + 12 位 hex，写入后永不改。
- `created` 用会话里的「今天」。
- 不要写「作为 AI 我认为」，不要待办，不要文末「延伸阅读」堆砌。
- 一句话结论是立场。可以加粗关键从句。
- 对照表和判断的用词走 `note-language`。

章节名按材料改（「四家各自在补哪一层」只是现成那一篇的名字），但分层对照 + 共同 + 分歧 + 判断这个节奏要在。

### 3. 更新总览

打开 `00-Overview/AI知识库总览.md`，在「最近新增」最上面插入：

```markdown
- [[笔记标题]]：<比一句话结论更短的钩子>
```

不要改「目录说明」。双链只用笔记名。

### 4. 重跑网页预览

侧栏在 `vitepress dev` **启动时**扫一遍。落盘后立刻重跑本仓库的开发服：

1. 只结束本仓库的 `vitepress dev`（按运行时仓库根匹配，不要写死本机用户名）。
2. 仓库根 `npm run docs:dev`，后台。端口走 `.vitepress/config.mts` 的 `5280`。
3. 不要加 `host: true`。本机必须能打开 `http://127.0.0.1:5280/`：配置里 `server.host` 用 `'127.0.0.1'`，不要只听 `[::1]`。收尾带上 `http://127.0.0.1:5280/`。

## 自检

- `type: thought` 已写
- `related` 每条都能点回已有笔记
- 正文没有把某篇核心观点列表再抄一遍
- `id` 新生成且未复用
- 总览已插双链
- 没有自动 git commit

## 不要做的事

- 不要把 thought 写成第二篇学习总结。
- 不要把 thought 放进 `01-Articles/` 或书籍目录。
- 不要为了网页把 `[[wikilink]]` 改成 Markdown 链接。

## 修笔记时回写

用词 → `note-language`。thought 结构、对照表、「不要转述」→ 本文件。文章侧写 `ingest-article`，书籍侧写 `ingest-book`。

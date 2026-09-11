---
name: ingest-book
description: 把一本书或官方 recipe 集整理进 AI-Notes 的书籍分区。用户说「开一本新书」「整理这本书」「填这一章」「阅读后填写」「把 cookbooks 收成笔记」时必须用。产出编号目录、阅读导读、一章一个文件、出处芯片。不要走文章模板，不要只在对话里总结。
---

# 整理书籍进 AI-Notes

把一本书变成这个仓库里的章节笔记，而不是聊天记录或书摘。笔记同时给 Obsidian 和 VitePress 用。

先读本文件。对照成品时打开 [references/examples.md](references/examples.md)。用词先读 [../note-language/SKILL.md](../note-language/SKILL.md)。

文章走 `ingest-article`，跨文判断走 `ingest-thought`。本 skill 只管 `03-` 起的书籍分区。

## 仓库约定

```text
00-Overview/AI知识库总览.md     入口；新书开读时补一条双链
03-HarnessEngineering/          Book 1 / Book 2 章节笔记；PDF 可入库
04-GameDesignWorkshop/          Fullerton 第五版；试读 PDF gitignore，网页不提供下载
05-ClaudeCookbooks/             官方 recipe 的学习路径；.ipynb 不入库
NN-<ShortName>/                 下一本：编号递增，短英文目录名
```

现有三本是样本，不是上限。新书新建 `NN-` 目录，不要塞进 `01-Articles/`。

## 何时用

| 用户给的是 | 做 |
|---|---|
| 一本新书 / 官方手册 / recipe 集，要开专题 | 新建 `NN-<ShortName>/`，写阅读导读 + 章节骨架，接线侧栏和书籍下拉 |
| 已有书的某一章「阅读后填写」 | 填该章现有文件，不新建、不改成文章模板 |
| 书的结构要重排（例如 95 道 recipe 收成 12 章） | 改阅读导读和章节清单，按**工程依赖**排，不按上游文件夹平铺 |
| 一篇博客 / 一条 X | 不要用本 skill，转 `ingest-article` |
| 对照几篇文章之后的立场 | 不要用本 skill，转 `ingest-thought` |

助手就是阅读的人。用户说「阅读后填写也需要你来填」时，空占位不可接受；按 Book 1 / 已填 GDW 的密度写完。读不到原文就停，向用户要 PDF、网页或本机官方仓库，不要补造章节；只能读到部分内容时，不得标记为已读或补造缺失内容。

写入前先按 source、basename 和目标路径查重。已有章节、导读或书籍目录默认不覆盖；需要修订时保留原 `id`，README、总览、侧栏和书籍下拉已有条目只做幂等更新。

## 一本新书怎么落盘

### 1. 编号目录

扫描现有书籍目录，取最大的数字前缀并加一，生成下一个空闲 `NN-`；同时检查目标路径和侧栏标签是否冲突。目录名用短英文或项目通用名，和侧栏标签一致；发现冲突就停止并询问，不要复用已有编号。

目录里固定有：

- `index.md`：VitePress 专题首页（`title:` + 本书在讲什么 + 从阅读导读进）
- `README.md`：Obsidian 用的学习路线和进度表（VitePress `srcExclude` 掉 README，网页不显示）
- `00-<短名>阅读导读.md`：怎么读、依赖顺序、和已有书怎么对照
- `01-….md` … 一章一个文件，编号与阅读顺序一致

系列书（像 Harness Book 1 / Book 2）可以在专题下再分子目录，但 **wikilink basename 全库必须唯一**。VitePress `byName` 只认文件名。不要再出现第二个 `00-阅读导读.md`；前面加书名短前缀（`00-Cookbooks阅读导读`、`00-GDW阅读导读`）。

### 2. 接线（缺一则网页侧栏或顶栏看不见）

1. `.vitepress/sidebar.ts`：`SECTION_LABELS` 和 `sections` 数组都加上新目录。
2. `.vitepress/config.mts`：顶栏 **书籍下拉**里加一项，不要往一级 nav 再堆一本。首页 `index.md` 的 features 可以单独做一张卡片。
3. `00-Overview/AI知识库总览.md`：目录说明加一行；最近新增最上面插阅读导读的双链。
4. 需要忽略的大文件（试读 PDF）写进 `srcExclude` / `.gitignore`，cite 里用 `<code>文件名</code>`，不要做成可下载链接。

### 3. 阅读导读

```markdown
---
id: n_<12 hex>
---

# <短名>阅读导读：<怎么读这一本>

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="…">…</a> · 状态：… · 对照：…</p>
</details>

## 一句话

**一句判断，不是「本书介绍了…」。**

## 一张图看懂

```mermaid
flowchart TD
  …
```

## 核心概念
## 关键洞察
## 个人思考
## 相关
```

图上的分支标签、导读一句话、专题首页用词走 `note-language`。站点入口叫总览，书怎么读叫阅读导读，源码去哪找叫源码索引。

### 4. 章节文件

已填章（助手读过，或用户明确要填）：

```markdown
---
id: n_<12 hex>
---

# 第 N 章：<标题>

<details class="note-cite">
<summary>出处</summary>
<p>来源：<a href="…">原网页</a> · 状态：已读 · PDF：<a href="./book.pdf"><code>book.pdf</code></a> p.x–y</p>
</details>

## 一句话

**一句判断。**

## 核心概念
## 关键洞察
## 个人思考
## 相关

- [[00-<短名>阅读导读]]
- [[上一章]]
- [[下一章]]
```

未读章先占位：cite 写「状态：未读」，三个填写块可以暂时空，但必须有 `id`、标题、cite、相关。不要用文章模板的 `title` / `tags` / `source` / `created` YAML——书的出处在 cite 芯片里，网页评论只认 `id`。助手之间可以说骨架；贴进网页的文件写「占位」。

`id` 用 `n_` + 12 位 hex，写入后永不改。

写作密度对齐 Book 1 已填章和 Cookbooks 1–12：机制、取舍、能带走的判断。不要把原文段落搬进来，不要在对话里写完却不落盘。

## 按书类型的硬约束

### 有官方网页 + 离线 PDF（Harness）

- cite 同时给原网页和 `./xxx.pdf` 页码。
- PDF 若要在网页打开，用相对链接；需要构建时拷贝的，走 `.vitepress/config.mts` 的 copy 插件。

### 纸书 / 试读 PDF 不能上网（GDW）

- PDF gitignore，`srcExclude` 掉。
- cite 只写 `<code>game-design-workshop.pdf</code>`，不要做成站点下载。

### 官方 notebook / recipe 集（Cookbooks）

- **不把 `.ipynb` 拷进本库。** 官方 notebook 留在本机的 claude-cookbooks 仓库，笔记只引用 GitHub 路径。网页 cite 不要写本机绝对路径。
- 上游按文件夹堆例子；章节按工程依赖重排。阅读导读说明为什么是这个顺序。
- 对照 recipe 不要只写文件名。写成 VitePress `::: details`，默认折叠，里面放**证明该章判断的机制片段**（不是 pip / API key / wget），外加 GitHub 全文链接。各章引导句写成「机制片段摘自官方 notebook」，不要写「对照仓库」。
- 不要用裸 `<details>` 包代码块：CommonMark 会在空行处结束 HTML，fence 会漏到折叠外面。必须用 `::: details`。
- 片段从本机官方仓库现摘，不要凭记忆写代码。整本 notebook 太长就只摘机制格；不要为了「有源码」把 2000 行 cost notebook 贴进来。

## 填已有章

1. 打开该章文件，保留 `id`。
2. 读原文（网页 / PDF / notebook），按「一句话 / 核心概念 / 关键洞察 / 个人思考」填满。
3. 更新 `README.md` 进度表对应行的 `[ ]` → `[x]` 或 `[~]`。
4. 相关双链指向阅读导读和相邻章；需要跨书对照时链到那一章，不要链到文章模板。
5. 图和「可以进入下一步的标准」用白话，细则见 `note-language`。

### 6. 重跑本仓库的网页预览

落盘并完成接线后，按 article/thought 相同的预览规则刷新：只处理确认属于本仓库的开发服，优先复用或安全重启，不要按模糊端口或进程名误杀其他项目；在仓库根执行 `npm run docs:dev`，并确认修改后的章节或首页可通过 `http://127.0.0.1:5280/` 访问。

## 自检

- 文件名、H1、wikilink 三者能对上；basename 全库唯一
- `id` 已写入且未复用
- 出处是 cite 芯片，不是文章 YAML `source:`
- 一句话是判断
- 新书已进 `SECTION_LABELS`、`sections`、书籍下拉、总览
- Cookbooks 类没有 `.ipynb` 入库；recipe 用 `::: details` 而不是文件名表
- 没有自动 git commit

## 不要做的事

- 不要把章节笔记写成 `01-Articles` 的学习总结骨架。
- 不要为了网页把 `[[wikilink]]` 改成 Markdown 链接。
- 不要往顶栏一级 nav 每加一本就多一项。
- 不要在对话里总结完一章却不改文件。

## 修笔记时回写

用词、图上的标签、直译、本机路径 → `note-language`。书籍落盘流程（目录、cite、`::: details`、书籍下拉）→ 本文件。文章侧写 `ingest-article`，思考侧写 `ingest-thought`。

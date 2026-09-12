# 成品对照

写新笔记前，打开一篇现成文件对齐语气和密度，不要复制内容。只读模板、不 Read 样本，会写出目录体笔记。

跨文判断的样本在 `ingest-thought`。书籍章节的样本在 `ingest-book`。

## 机制型博客

`01-Articles/其他/Zed：Introducing Delta.md`

- 文件名带产品前缀
- `source` 是 YAML 列表（多篇同源博文合成一篇）
- 一句话结论点出「软件在对话里长出来」
- mermaid 对照旧世界 / 新世界
- 观点标题本身是判断
- 正文没有手写 cite 芯片；网页芯片由 YAML `source:` 注入

密度样本（从仓库根 Read，不要在 `.claude/skills/` 下找）：

- `01-Articles/其他/Anthropic：The AI-native SDLC playbook.md`
- `01-Articles/其他/Cursor：Git at any scale.md`
- `01-Articles/其他/Warp：How Warp builds self-improving agents on Claude.md`

每条有工件 / 存储层 / 闭环，不是小标题翻译。

## 不要写成这样

`01-Articles/X/Andrew Ng：Shaping the build.md` 的第一稿：

- 把 Driving the build loop / Making product decisions 译成五个小标题
- 每条 = 一句英文引语 + 清单 + 「否定的旧假设是…」
- 图把小标题连成环，没有画出三层循环（分钟 / 小时 / 周）
- 没有链到库里已有的 [[Anthropic：The AI-native SDLC playbook]]

结构齐了，比原文差。写完后用「删掉小标题是否还站得住」检查。

## X 长帖

`01-Articles/X/Harness Engineering：当工程师不再写代码.md`

- `source` 可以是单字符串
- 图用 `![[01-Articles/X/_assets/....png]]`
- 仍然要有一句话结论和核心观点，不能写成摘抄

同一作者多篇时看 `01-Articles/X/宝玉/` 和 `01-Articles/X/GoogleCloudTech/00-索引.md`。

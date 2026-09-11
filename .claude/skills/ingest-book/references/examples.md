# 成品对照

写新书或填章前，打开一篇现成文件对齐语气和密度，不要复制内容。

## 阅读导读

`05-ClaudeCookbooks/00-Cookbooks阅读导读.md`

- 一句话是判断（约束按什么顺序钉），不是目录说明
- mermaid 是依赖顺序，不是上游文件夹
- 和 Harness / GDW 有对照表
- basename 带书名短前缀，避免和 Book 2 的 `00-阅读导读` 撞名

`04-GameDesignWorkshop/00-GDW阅读导读.md`

- 图上的分支和对照句用白话；细则见 `note-language`

## 已填章（密度样本）

`03-HarnessEngineering/Book1-ClaudeCode/00-序言.md`

- cite 芯片在 H1 下，含原网页、状态、PDF 页码
- 一句话加粗关键从句
- 核心概念是机制和取舍，不是段落摘抄

`05-ClaudeCookbooks/01-先钉输出.md`

- 正文讲判断；对照 recipe 用 `::: details`，默认折叠
- 折叠里是机制代码（prefill `{`、`input_schema`），不是文件名，也不是整本 notebook
- 每条有 GitHub 全文链接

## 未读占位

`04-GameDesignWorkshop/04-戏剧元素.md`

- 仍有 `id`、cite（状态：未读）、相关双链
- 三个填写块可以空，但文件必须先存在，侧栏才能列出来

## 专题首页

`05-ClaudeCookbooks/index.md`、`03-HarnessEngineering/index.md`

- VitePress 用 `index.md`（`title:`）
- 进度表和出处细节放 `README.md`，网页排除 README

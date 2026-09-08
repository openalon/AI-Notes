# AI Notes

用于存放 AI 时代的文章学习总结、概念整理、模式沉淀。

笔记仍是普通 Markdown / Obsidian 库。网页预览用 VitePress，源文件就在仓库根目录，不复制进 `docs/`，也不需要装 [obsidian-vitepress](https://github.com/tyrad/obsidian-vitepress) 这类插件（那个插件是在 Obsidian 里把当前笔记拷到另一套 VitePress 工程再预览）。

```bash
npm install
npm run docs:dev
```

终端会打印实际地址。默认是 `http://127.0.0.1:5280/`（被占用则顺延）。

不要用 `http://localhost:5173/`：本机其他 VitePress（例如 claude-code-guide）占着 IPv6 的 5173，浏览器的 `localhost` 会优先进那个站。

```bash
npm run docs:build     # 生产构建
npm run docs:preview   # 预览构建结果
```

GitHub Pages：推 `main` 会走 `.github/workflows/deploy.yml` 自动构建并发布。仓库 Settings → Pages 选 GitHub Actions。站点地址是 `https://openalon.github.io/AI-Notes/`。

页面评论用 [Giscus](https://giscus.app/zh-CN)，每篇文章对应一条 GitHub Discussion。表情栏是讨论首帖的 reaction，用来给文章点赞，和单条评论的表情分开。匹配键是笔记 YAML 里的 `id`，改标题或文件名不会丢评论。启用前：

1. 仓库保持 **Public**。
2. 仓库 Settings → General → Features 打开 **Discussions**。
3. 给仓库安装 [giscus app](https://github.com/apps/giscus)。
4. 用 Discussions 里的 **Announcements** 分类（只有维护者和 giscus 能开新帖）。
5. 把分类 ID 填进 `.vitepress/theme/Comments.vue` 的 `CATEGORY_ID`。
6. 根目录 `giscus.json` 已列出 `https://blog.openalon.com` 和 `https://openalon.github.io`；换域名时同步改这份白名单。

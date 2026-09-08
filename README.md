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

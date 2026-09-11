---
name: vitepress-gtm
description: Inject Google Tag Manager (GTM-MNXQCPGT) into this VitePress site. Use when adding analytics/GTM/tracking or verifying every page (including 404) loads the container.
---

# VitePress GTM for AI Notes

Site-level container `GTM-MNXQCPGT`, shared with herdr-bar / openalon.com. Hits the OpenAlon GA4 stream. Not per markdown page. New pages pick it up automatically.

Reference implementation: `.vitepress/gtm.ts` in this repo (copied from herdr-bar’s `docs/.vitepress/gtm.ts`).

## When

- The site is VitePress (`vitepress` in package.json).
- User asks to add Google Tag Manager, GTM, 跟踪, analytics, or “same tracking as herdr-bar”.
- User pastes a GTM snippet; use the ID in that snippet.

Do **not** use for non-VitePress apps, or a different GTM container unless the user names a new ID.

## Do

1. Confirm the site is VitePress. Keep `GTM-MNXQCPGT` unless they paste a different ID.

2. Drop `.vitepress/gtm.ts` (this repo’s VitePress root is the vault root, not `docs/`):

   ```ts
   import type { HeadConfig } from 'vitepress'

   export const GTM_ID = 'GTM-MNXQCPGT'

   const GTM_BOOTSTRAP = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`

   export const gtmHead: HeadConfig[] = [['script', {}, GTM_BOOTSTRAP]]

   export function injectGtmNoscript(code: string): string | void {
     const marker = `googletagmanager.com/ns.html?id=${GTM_ID}`
     if (code.includes(marker)) return
     return code.replace(
       /<body([^>]*)>/,
       `<body$1><!-- Google Tag Manager (noscript) --><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript><!-- End Google Tag Manager (noscript) -->`,
     )
   }
   ```

3. Wire it in `defineConfig` — **head script first**, then other tags. `transformHtml` is build-only (no body slot in VitePress):

   ```ts
   import { gtmHead, injectGtmNoscript } from './gtm'

   export default defineConfig({
     transformHtml(code) {
       return injectGtmNoscript(code)
     },
     head: [
       ...gtmHead,
       // existing icon / theme-color / …
     ],
   })
   ```

   If `transformHead` already exists, leave it. Do not put GTM there (that hook is for per-page extras such as 404 `noindex`).

4. Prove it after `vitepress build`:

   - Built HTML contains `GTM-MNXQCPGT` and `https://www.googletagmanager.com/gtm.js?id=` in `<head>`.
   - Built HTML contains `googletagmanager.com/ns.html?id=GTM-MNXQCPGT` **after** `<body`.
   - Check home, one nested page, and `404.html`.
   - VitePress minifies the bootstrap (parameter names change). Assert the container ID, not the unminified source.

   Example assertion (Node against `.vitepress/dist`):

   ```js
   assert.ok(html.includes('GTM-MNXQCPGT'))
   assert.ok(html.includes('https://www.googletagmanager.com/gtm.js?id='))
   const bodyOpen = html.search(/<body[^>]*>/)
   const noscript = html.indexOf('googletagmanager.com/ns.html?id=GTM-MNXQCPGT')
   assert.ok(bodyOpen >= 0 && noscript > bodyOpen)
   ```

5. Keep this skill in `.claude/skills/vitepress-gtm/` (this repo already has other skills there; do not replace the directory with a symlink to `.agents/skills`).

## Do not

- Paste GTM into a markdown page or frontmatter `head` — new pages would miss it.
- Add gtag.js (`G-…`) next to this container unless the user asks; tags live in GTM, not a second snippet.
- `--deep` / duplicate: skip if `gtm.js?id=GTM-MNXQCPGT` is already in site `head`.
- Expect the noscript iframe in `vitepress dev` — `transformHtml` runs on build. Head script does load in dev.
- Change the container ID, dataLayer name, or host (`www.googletagmanager.com`) without an explicit new snippet from the user.

## After deploy

GTM Preview → tag `https://openalon.github.io/AI-Notes/` (include the VitePress `base`) and `https://blog.openalon.com` if that custom domain is live. Local `docs:dev` also hits the container.

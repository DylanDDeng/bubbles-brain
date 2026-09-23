# 新评测 case 收件箱

把还没整理进画廊的评测产物放在这里。这个目录**不会被发布**，整理完成后文件会被移到
`static/eval-demos/`（或 `static/eval-videos/`），并在 `../cases.json` 里登记。

## 怎么放

每道题建一个子目录，目录名随意（中文也行）：

```
inbox/
  2026-09-飞机大战/
    prompt.md              # 题目原文（必需）；可选加一行「日期：2026-09-20」
    claude-opus-5.html     # 每个模型一个文件，文件名 = 模型名
    gpt-6.html
    reference.mp4          # 可选：题目里给模型看的参考视频 / 图片
```

- 只跑了一个模型的题目也完全没问题，目录里放一个文件即可。
- 支持 `.html`、`.svg`、`.gif`、`.mp4`、`.png`/`.jpg`。
- 如果是已有题目（比如又拿「旋转六边形小球」测了新模型），在 `prompt.md` 里写上题目 id，
  例如 `task: hexagon-bouncing-balls`，就会并入原题的对比页。
- 没写日期时，按文件进入仓库的日期记年份。

## 整理时会做的事

1. 文件重命名为 `<模型>-<题目>.html`，移入 `static/eval-demos/`。
2. 在 `cases.json` 里新增 / 更新 task、case、model 条目。
3. 生成缩略图 `static/images/eval-cases/<case-id>.webp`。
4. 更新 `astro/raw-html-policy.json` 的文件数和哈希，跑 `npm run verify`。

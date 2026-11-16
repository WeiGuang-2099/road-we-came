# 来时路

一段五分钟左右的短旅程。出发前写下一句理由，路上的人会一遍遍转述它，到了山顶，你要凭记忆把它写回那卷空白的经上。

## 本地运行

需要 Node.js 20.19 以上（推荐 24 LTS）。

```bash
npm install
npm run dev
```

| 命令             | 作用                     |
| ---------------- | ------------------------ |
| `npm run dev`    | 本地开发服务器           |
| `npm test`       | 单元测试                 |
| `npm run lint`   | ESLint 和 Prettier 检查  |
| `npm run format` | 自动格式化               |
| `npm run build`  | 类型检查并构建到 `dist/` |

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库（本项目用的是 `road-we-came`），把代码推到 `main` 分支。
2. 仓库 Settings → Pages → Source 选 **GitHub Actions**。
3. 之后每次推送到 `main`，工作流 [`deploy.yml`](.github/workflows/deploy.yml) 会依次检查、测试、构建并发布，地址是 `https://weiguang-2099.github.io/road-we-came/`（仓库名不同就换成对应的名字）。

构建产物用的是相对路径（`vite.config.ts` 里的 `base: './'`），仓库改名不用改配置。`dist/` 打成 zip 也能直接传到 itch.io。

## 代码结构

| 文件              | 内容                                           |
| ----------------- | ---------------------------------------------- |
| `src/main.ts`     | 入口，组装各个模块                             |
| `src/game.ts`     | 流程：开场、茶寮、驿站、桥头、渡口、山门、山顶 |
| `src/script.ts`   | 全部文案，改剧情只动这里                       |
| `src/drift.ts`    | 路人转述时的走样规则（换词、丢字、听错）       |
| `src/compare.ts`  | 终点的原文对照和评语                           |
| `src/view.ts`     | 页面渲染、输入框、选项                         |
| `src/save.ts`     | 本地存档                                       |
| `src/ambience.ts` | 用 WebAudio 合成的风声，第一次点击后才响       |
| `src/random.ts`   | 带种子的随机数，刷新页面后转述结果不变         |
| `src/chars.ts`    | 哪些字算数：标点、符号和空格不计入比较和走样   |

测试文件和源码放在一起，命名为 `*_test.ts`。`src/game_test.ts` 让一个按脚本作答的假页面走完整趟旅程，并在每个等玩家操作的地方模拟刷新，检查之后能原样接着走。测试共用的内存存储在 `src/memory_storage.ts`。

## 备注

- 同一个账号下的 GitHub Pages 站点共用一个域名，localStorage 也是共用的，所以存档键都带 `laishilu:v1:` 前缀。
- 输入框处理了中文输入法组字时按回车的情况。以后换引擎或重写界面，也别改成在 canvas 里自绘的输入框。
- `package.json` 里的 `overrides` 是为了让 typescript-eslint 用上修复过安全问题的 minimatch，等它自己升级依赖后可以删掉。

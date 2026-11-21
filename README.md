# 来时路 · The Road We Came

一段五分钟左右的短旅程。出发前写下一句理由，路上的人会一遍遍转述它，到了山顶，你要凭记忆把它写回那卷空白的经上。

## 中英文

游戏有中文和英文两个版本，选择的顺序是：

1. 网址里带 `?lang=en` 或 `?lang=zh` 时，按网址来。
2. 玩家点过右下角的语言切换，就用上次选的。
3. 否则看浏览器的语言偏好，中文用户看到中文，其他人看到英文。

文案分别在 `src/script_zh.ts` 和 `src/script_en.ts`，英文版是按英文的习惯重写的，不是逐字翻译。玩家写的理由是英文时，路人按整词转述（换词、丢词、把同音词听错，比如 sea 和 see），船夫要一个词，山顶也按词对照；中文仍然按字。两种语言共用同一份存档。

## 本地运行

需要 Node.js 20.19 以上（推荐 24 LTS）。

```bash
npm install
npm run dev
```

| 命令             | 作用                                                |
| ---------------- | --------------------------------------------------- |
| `npm run dev`    | 本地开发服务器                                      |
| `npm test`       | 单元测试                                            |
| `npm run lint`   | ESLint 和 Prettier 检查                             |
| `npm run format` | 自动格式化                                          |
| `npm run build`  | 类型检查并构建到 `dist/`                            |
| `npm run zip`    | 构建并打包成 `laishilu.zip`，用来上传 itch.io       |
| `npm run og`     | 用本机的 Chrome 或 Edge 重画分享卡片和 itch.io 封面 |

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库（本项目用的是 `road-we-came`），把代码推到 `main` 分支。
2. 仓库 Settings → Pages → Source 选 **GitHub Actions**。
3. 之后每次推送到 `main`，工作流 [`deploy.yml`](.github/workflows/deploy.yml) 会依次检查、测试、构建并发布，地址是 `https://weiguang-2099.github.io/road-we-came/`（仓库名不同就换成对应的名字）。

构建产物用的是相对路径（`vite.config.ts` 里的 `base: './'`），仓库改名不用改构建配置，只有 `index.html` 里分享卡片的网址要跟着改。

## 依赖更新

[`.github/dependabot.yml`](.github/dependabot.yml) 让 Dependabot 每月检查一次 npm 依赖和 GitHub Actions 的版本，有更新就发 PR：

- npm 的小版本和补丁合成一个 PR，大版本各自单独一个；Actions 的更新合成一个 PR。
- 新版本发布满 7 天才会提，躲开刚发布就撤回或被投毒的版本。安全修复不用等。
- TypeScript 只收补丁更新，原因见下面的备注。

每个 PR 上，[`check.yml`](.github/workflows/check.yml) 会跑一遍检查、测试和构建，通过了再合并；合并到 `main` 后照常由 `deploy.yml` 发布。安全修复的 PR 要先在仓库 Settings → Advanced Security 里打开 **Dependabot alerts** 和 **Dependabot security updates**。

## 发布到 itch.io

1. 运行 `npm run zip`，得到 `laishilu.zip`。
2. 在 itch.io 新建项目，Kind of project 选 **HTML**，上传这个 zip，并勾选 **This file will be played in the browser**。
3. 嵌入选项：视口 960×720，勾选 **Mobile friendly**、**Fullscreen button** 和 **Enable scrollbars**。山顶那一页比 720 高，不开滚动条就看不到下面的对照。

页面要填的文字、分类、标签，还有封面和截图，都在 [`itch/`](itch/) 里，照着 [`itch/page.md`](itch/page.md) 填就行。

## 访问统计

游戏用 [GoatCounter](https://www.goatcounter.com/) 统计两件事：打开游戏算一次访问，走到山顶记一个事件。两者都按“网站/语言”命名，比如 `weiguang-2099.github.io/en`，所以 GitHub Pages 和 itch.io 的数字分得开。GoatCounter 不用 cookie，也不收集个人信息；玩家写的字从不发送，`Stats` 接口本身就不接收任何文字。

统计页是 <https://weiguang2099.goatcounter.com>，要登录才能看。站点代码 `weiguang2099` 写在 [`src/stats.ts`](src/stats.ts) 的 `GOATCOUNTER_CODE` 里；换一个 GoatCounter 站点就改这里，推到 `main` 后 GitHub Pages 跟着换，itch.io 要重新 `npm run zip` 再上传一次。把代码改成空字符串就不再加载任何统计脚本。

在 localhost 上打开不计数，被广告拦截器拦下时也不计数，游戏都照常能玩。想让自己的浏览器不计入，打开一次 `https://weiguang-2099.github.io/road-we-came/#toggle-goatcounter`，看到提示就好了；再打开一次恢复计数。这个开关存在浏览器里，只管 GitHub Pages，itch.io 上的游戏在另一个网址下，不受影响。

统计脚本固定用 `count.v5.js`，并带上完整性校验（SRI）：它和玩家写的字在同一个页面里运行，地址上的文件一旦被换掉，浏览器就会拒绝执行。要换新版本时，从 GoatCounter 的 [count.js 版本说明](https://www.goatcounter.com/help/countjs-versions) 里同时换文件名和 hash。

## 代码结构

| 文件               | 内容                                                         |
| ------------------ | ------------------------------------------------------------ |
| `src/main.ts`      | 入口，选语言并组装各个模块                                   |
| `src/game.ts`      | 流程：开场、茶寮、驿站、桥头、渡口、山门、山顶               |
| `src/script.ts`    | 文案的结构，两种语言共用                                     |
| `src/script_zh.ts` | 中文文案，改中文剧情只动这里                                 |
| `src/script_en.ts` | 英文文案，改英文剧情只动这里                                 |
| `src/language.ts`  | 按网址、上次的选择和浏览器偏好选语言                         |
| `src/drift.ts`     | 路人转述时的走样规则（换词、丢字、听错）                     |
| `src/compare.ts`   | 终点的原文对照和评语                                         |
| `src/view.ts`      | 页面渲染、输入框、选项                                       |
| `src/save.ts`      | 本地存档                                                     |
| `src/stats.ts`     | 访问统计：打开游戏和走到山顶，交给 GoatCounter               |
| `src/ambience.ts`  | 用 WebAudio 合成的风声，第一次点击后才响                     |
| `src/random.ts`    | 带种子的随机数，刷新页面后转述结果不变                       |
| `src/chars.ts`     | 把句子切成词：中文一个字算一个词，英文按单词；标点和空格不算 |

测试文件和源码放在一起，命名为 `*_test.ts`。`src/game_test.ts` 让一个按脚本作答的假页面走完整趟旅程（中英文各一趟），并在每个等玩家操作的地方模拟刷新，检查之后能原样接着走。`src/script_test.ts` 会检查英文文案里没有漏翻的中文。测试共用的内存存储在 `src/memory_storage.ts`。

## 备注

- 同一个账号下的 GitHub Pages 站点共用一个域名，localStorage 也是共用的，所以存档键都带 `laishilu:v1:` 前缀。
- 输入框处理了中文输入法组字时按回车的情况。以后换引擎或重写界面，也别改成在 canvas 里自绘的输入框。
- 出发时至少要写两个词（中文两个字，英文两个单词），路上改口至少要一个字，不够时按下按钮，输入框下面会提示"再多写几个字。"。路人转述最多把理由磨到两个词，所以只要玩家自己不改短，渡口总有两个词可挑，山顶也总能剩下点什么。山顶默写不设下限，写一串省略号也算一种回答。
- 楷体用的是霞鹜文楷（npm 包 `lxgw-wenkai-webfont`，字体按 SIL OFL 1.1 授权），按 unicode-range 拆成 97 块，浏览器只下载页面上用到的字。
- 分享卡片的标签在 `index.html`，图片是 `public/og.png`（1200×630），照着标题页画在 `scripts/og.html` 里；同一个页面加上 `?cover`，就是 itch.io 的封面 `itch/cover.png`（630×500）。改了它要运行 `npm run og` 重画两张图（找不到浏览器时，用环境变量 `CHROME` 指定路径）。生成链接预览的爬虫不运行脚本，用不上语言选择，所以卡片只有一张，中英双语：标题中文在前，描述英文在前，预览被截短时英文读者也能读到英文。
- 英文版的经卷改成横排，印章仍然用中文的"来时路"。
- 茶寮、驿站、桥头的台词各有几套：第一趟用 `first`，之后按走到山顶的次数轮流用 `later` 里的几套，抹去走过的路后从头算。同一趟里三处用的是同一个序号，所以 `later` 是按趟写的：第一套三处都认出了你，第二套从茶寮的小雨一直下到驿站，到桥头已是雨后。加新的一套时，三处要一起加。
- `package.json` 里的 `overrides` 是为了让 typescript-eslint 用上修复过安全问题的 minimatch，等它自己升级依赖后可以删掉。
- TypeScript 在 `package.json` 里写的是 `~6.0.3`，`dependabot.yml` 也只让它收补丁更新，因为 typescript-eslint 目前只支持 6.1 以下的版本。等它支持新版本了，手动升级 TypeScript，再删掉 `dependabot.yml` 里那条 `ignore`。

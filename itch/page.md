# itch.io 页面

在 itch.io 上新建项目时照着这份填。图片都在这个文件夹里：`cover.png` 由 `npm run og` 画出；`1-setting-out.png` 到 `5-summit-zh.png` 是游戏的实际画面，窗口 960×720（最后一张 960×770，放得下山顶的评语），按 2 倍分辨率截的。

## 上传之前

1. 想统计 itch.io 上的访问，先在 `src/stats.ts` 里填好 GoatCounter 的代码（见 README 的“访问统计”）。不填也能上传，只是不统计。
2. 运行 `npm run zip`，得到 `laishilu.zip`。

## 基本信息

| 字段                         | 填写                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------- |
| Title                        | 见下面的文字                                                                     |
| Project URL                  | `the-road-we-came`                                                               |
| Short description or tagline | 见下面的文字                                                                     |
| Classification               | Games                                                                            |
| Kind of project              | HTML                                                                             |
| Release status               | Released                                                                         |
| Pricing                      | No payments；想收打赏就选 $0 or donate                                           |
| Uploads                      | `laishilu.zip`，勾选 **This file will be played in the browser**                 |
| Embed options                | 视口 960 × 720；勾选 Mobile friendly、Fullscreen button 和 **Enable scrollbars** |
| Cover image                  | `cover.png`（630×500）                                                           |
| Screenshots                  | 按编号上传 `1-setting-out.png` 到 `5-summit-zh.png`                              |

一定要勾 **Enable scrollbars**：山顶那一页比 720 高，不勾的话玩家滚不到下面的对照和评语。

## 分类信息

| 字段            | 填写                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| Genre           | Interactive Fiction                                                                                              |
| Tags            | Short, Narrative, Text based, Atmospheric, Meditative, Minimalist, Experimental, Relaxing, Singleplayer, Chinese |
| Average session | A few minutes                                                                                                    |
| Languages       | English, Chinese                                                                                                 |
| Inputs          | Mouse, Keyboard, Touchscreen                                                                                     |

## 生成式 AI 披露

itch.io 要求在项目设置的 Generative AI Disclosure 里如实回答项目有没有生成式 AI 的产出；答“有”还要选种类（图像、声音、文本、代码）。按这个游戏的实际情况填。就仓库里能看到的：`public/favicon.svg` 带着内容凭证，写明由 Claude 提供或修改；分享卡片和封面的排版、访问统计的代码，以及下面的页面文字，也是 Claude 写的。其余的代码和文案有没有用 AI，你最清楚。

## 页面文字

Title：

```text
来时路 · The Road We Came
```

Short description or tagline：

```text
Write down why you set out. The road will retell it. At the summit, write it back from memory.
```

Description，英文在前、中文在后，两段一起贴进去。没开访问统计的话，删掉讲 GoatCounter 的那两句。

```text
A short journey of about five minutes.

Before you set out, you write down why you're going. Along the road, at the teahouse, the waystation and the stone bridge, people tell your reason back to you, a little wrong each time: a word swapped, a word dropped, a word misheard. You can agree, or put them right. The ferryman takes one word as his fare. At the summit you're handed a blank scroll and asked to write down, from memory, why you set out.

At the end of the road, will you still know why you began?

Plays in English or Chinese. It follows your browser's language, and the button in the corner switches it any time. The English version was written for English, not translated word for word.

Your progress stays in your browser, so you can close the tab and carry on later. Walk it again and the people on the road will remember you.

The wind is made in the browser. You can turn it off in the corner. Works on phones too.

Nothing you write leaves your browser. The page counts visits and finished journeys with GoatCounter, which uses no cookies and keeps no personal data.

Typeface: LXGW WenKai, under the SIL Open Font License 1.1.
```

```text
一段五分钟左右的短旅程。

出发前写下一句理由，路上的人会一遍遍转述它，到了山顶，你要凭记忆把它写回那卷空白的经上。

中英双语，按浏览器的语言自动选择，也可以随时用右下角的按钮切换。

进度存在浏览器里，关掉页面也能接着走。再走一次，路上的人会认出你。

风声是浏览器里合成的，可以在右下角关掉。手机上也能玩。

你写的字不会离开浏览器。页面用 GoatCounter 统计访问次数和走到山顶的次数，它不用 cookie，也不收集个人信息。

字体：霞鹜文楷（SIL Open Font License 1.1）。
```

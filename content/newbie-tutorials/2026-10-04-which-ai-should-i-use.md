---
title: "AI 这么多，我该用哪个"
description: "豆包、DeepSeek、千问、元宝、Kimi，再加上 ChatGPT、Claude、Gemini，到底该用哪个？先给结论，再讲每家擅长什么、结论是怎么来的。"
date: 2026-10-04
lastmod: 2026-10-05
draft: false
weight: 6
slug: "which-ai-should-i-use"
tags: ["新手村", "AI 选择", "AI 工具", "新手教程"]
---

[上一篇](/newbie-tutorials/how-to-talk-to-ai/)讲了怎么把话说清楚。可很多人卡在更前面一步：**到底该跟哪个 AI 说？**

打开应用商店搜「AI」，豆包、DeepSeek、千问、元宝、Kimi、文心排成一列；朋友说 ChatGPT 最强，同事说写代码得用 Claude，网上又说 Gemini 刚登顶了某个榜单。每一个都说自己最聪明，每一个都免费下载。

## 先说结论

不绕弯子，2026 年 10 月的答案是这三句：

- **有条件用海外头部模型，首选 Claude 和 ChatGPT。** 这两家在几乎所有重要榜单上都排在最前面，写代码、干长活、写东西都是第一梯队。
- **只能用国内的，首选 GLM 和 Kimi。** 国产模型里，它俩的成绩最接近海外第一梯队，尤其是写代码和长任务。
- **只想免费，首选 DeepSeek。** App 不收会员费，深度思考、联网、读文件、看图都能用，综合成绩在国产模型里也排前几。

下面讲这三句结论是怎么来的，以及每家到底擅长什么。

## 先分清：模型和 App 不是一回事

结论里说的 GLM、Kimi、DeepSeek，指的都是**模型**，也就是 AI 的「大脑」：负责理解你的话、思考、写出回答。[第四篇](/newbie-tutorials/how-llms-are-trained/)讲的训练，造出来的就是它。你手机上装的是 **App**：它把模型装进去，再配上联网搜索、读文件、语音、画图这些手脚。

打个比方，模型是**发动机**，App 是**整辆车**。

![同一个模型装进三个 App：甲只能聊天；乙多了联网搜索和读文件；丙多了语音通话和画图。问「今天上海下雨吗」，只有能联网的乙答得上来](/media/newbie-tutorials/pick-model-vs-app.svg)

这件事对选 AI 很重要，因为**名字常常对不上**：GLM 是智谱公司的模型，你要去「智谱清言」App 里用它；腾讯元宝里可以在混元和 DeepSeek 之间切换；DeepSeek 的模型是开源的，不少 App 里都装着它。比较「哪个 AI 更聪明」，比的是发动机；真正下载的时候，再看哪辆车装着它。

## 结论是怎么来的：看成绩单

「哪个模型更聪明」不能靠感觉，也不能听厂商自己说。比较靠谱的办法，是看**独立机构出的考试**：同一套题，所有模型都考一遍，按同样的标准打分。

本站的[模型榜单](/benchmarks/)收录了 8 个这样的考试。下面挑两张最能说明问题的成绩单，图里只放了在主流聊天 App 里用得到的模型：

- **Vals Index**：考的是金融、法律、编程、税务这些真实行业里的活，看模型能不能像一个靠谱员工一样把事办完。可以理解成「综合干活能力」。
- **DeepSWE**：把模型放进真实的代码仓库，让它独立完成需要改很多个文件的开发任务。可以理解成「写代码的真本事」。

![两张横向柱状图。Vals Index：Gemini 4 Argon 68.9（未全面开放）、Claude Sonnet 5.5 67.0、GPT-6 Astra 63.1、GLM-5.3 53.5、DeepSeek V4.1 Flash 51.3、Kimi K3 50.3、腾讯混元 Hy4 49.9、Qwen 3.8 Max 48.3。DeepSWE：Claude Opus 5.5 74.2、GPT-6 Astra 74.1、Gemini 3.8 Flash 73.8、GLM-5.3 69.0、Kimi K3 68.5、DeepSeek V4 Pro 62.8、Qwen 3.8 Max 57.5](/media/newbie-tutorials/pick-scoreboard.svg)

看图说话，三句结论都在里面：

1. **海外两强是 Claude 和 GPT。** 两张榜上它们都在最前排；DeepSWE 上 Claude Opus 5.5 和 GPT-6 Astra 只差 0.1 分。Gemini 4 Argon 在 Vals 上排第一，但它 9 月底才发布，普通用户还用不上。
2. **国内两强是 GLM 和 Kimi。** 写代码这张榜上，GLM-5.3（69.0）和 Kimi K3（68.5）是图中国产模型里最高的两个，离海外第一梯队只差五六分；其他国产模型落后得更多。
3. **DeepSeek 在免费里没有对手。** 它的综合干活分（51.3）在图中的国产模型里仅次于 GLM，比 Kimi、混元、千问都高，而它的 App 不收会员费。

还要记住两点。第一，**这是 2026 年 10 月的快照**，模型几个月就更新一轮，排名会变。第二，**榜单考的是难题**，问菜谱、写通知这类日常小事，各家差距远没有图上这么大。所以结论说的是「首选」，不是「只能用」。

## 每家擅长什么

### Claude（Anthropic）：写代码、干长活、写东西

Claude 是这次成绩最全面的一家。本站收录的 8 个榜单里，它在 5 个上排第一：综合智力指数（Artificial Analysis）、职场任务（GDPval，交付文档、表格、幻灯片）、终端编程（Terminal-Bench）、软件工程（DeepSWE）和从零写软件（ProgramBench）。

所以它最擅长的是**需要耐心和条理的活**：写和改代码、连续干几个小时的复杂任务、长文章的写作和修改、把一堆材料整理成一份能交的文档。很多人还喜欢它的文风：克制，不浮夸。

- **在哪用**：Claude 官网和 App。免费版能用 Sonnet 等型号；最强的 Opus 要开 Pro（每月 20 美元）以上。
- **注意**：Claude 的官方支持地区不包括中国大陆和香港。

### ChatGPT（OpenAI）：最全能，最难的长任务也扛得住

ChatGPT 的新旗舰 GPT-6 Astra 在 9 月初发布，成绩和 Claude 咬得很紧：DeepSWE 上只差 0.1 分；FrontierSWE（给 20 小时去完成高难度工程任务）上排第一，比 Claude 还高。

它的另一个长处在 App：语音对话、画图、联网、读文件、记忆，功能是聊天 App 里最全的之一。如果你只想装一个、什么都让它干，ChatGPT 最省心。

- **在哪用**：ChatGPT 官网和 App。GPT-6 Astra 目前只给付费用户，Plus 约每月 20 美元。
- **注意**：同样没有面向中国大陆开放。

### GLM（智谱）：国产里最均衡，写代码和办事最强

GLM-5.3 是智谱在 8 月发布、并开放下载的模型，主打编程和 Agent（能自己动手办事的 AI）。在主流聊天 App 用得到的国产模型里，它的成绩最均衡：Vals 综合干活分、DeepSWE、FrontierSWE 都排第一，也是终端编程榜（Terminal-Bench）上唯一进榜的国产模型。

所以如果你在国内、主要拿 AI **写代码、做表格、处理成套的工作任务**，GLM 是第一选择。

- **在哪用**：智谱的「智谱清言」App 和网页版，免费下载，有付费会员可选；它的海外网站 z.ai 也能用。

### Kimi（月之暗面）：长文档和长任务

Kimi 从一开始就主打「能读很长的东西」。7 月发布的 K3 能一次读进约 100 万 token 的内容，一整本书都放得下（token 是什么，见[上下文窗口](/vibe-coding/terms/context-window/)）。写代码它也很强：DeepSWE 上 68.5 分，和 GLM 只差 0.5 分，FrontierSWE 国产第二。

所以它最适合**读长报告、长合同、整本书，或者需要来回翻大量材料的任务**。它的短板是职场交付类任务：GDPval（做文档、表格、幻灯片）上的分数比 GLM、千问、DeepSeek 都低。

- **在哪用**：Kimi App 和网页版。免费版能用但有额度；新模型 K3 的完整能力要开会员，会员每月 49 元起。

### DeepSeek：免费里最好的

DeepSeek 是 2025 年初靠「深度思考」火起来的那家。9 月发布的 V4.1 Flash 能直接看图，模型同样开源。成绩上，它的综合干活分（Vals 51.3）在主流国产模型里仅次于 GLM；写代码（DeepSWE 62.8）比 GLM、Kimi 低一截，但比千问高。

它最大的优势是**不要钱**：App 和网页版不收会员费，深度思考、联网搜索、读文件、看图都能直接用。对只想先免费用起来的人，它是性价比最高的选择。

- **在哪用**：DeepSeek App 和网页版。腾讯元宝等 App 里也能选到 DeepSeek 模型。

### 其他几家，为什么没进首选

- **Gemini（谷歌）**：新旗舰 Gemini 4 Argon 分数很高，在 Vals 和金融分析榜上都排第一，但 9 月 30 日才发布，还没全面开放；免费版用的是更早的模型，谷歌服务在大陆也打不开。等它真正放开，这个结论可能就要改了。
- **千问（阿里）**：职场任务（GDPval）的分数在主流国产模型里最高，但写代码的两个榜（DeepSWE、FrontierSWE）落后 GLM、Kimi 一截，综合干活分也排在后面。
- **豆包（字节）**：它的模型没有参加这几个独立考试，没法放进同一张成绩单里比较。豆包的长处在 App 本身：国内用户最多，免费功能全，语音聊天和画图、做短视频都方便。日常聊天、娱乐，用它完全没问题。
- **腾讯元宝**：混元 Hy4 的综合分和 Kimi 差不多；它的特色是能搜公众号、视频号里的内容，App 里还能直接切到 DeepSeek。

## 一张表收拢

| 模型 | 最擅长 | 去哪用 | 免费吗 | 大陆能直接用吗 |
| --- | --- | --- | --- | --- |
| **Claude** | 写代码、长任务、写作改稿 | Claude 官网 / App | 有免费版，最强型号要付费 | 不能 |
| **ChatGPT** | 全能，最难的长任务 | ChatGPT 官网 / App | 有免费版，新旗舰要付费 | 不能 |
| **GLM** | 国产最均衡；写代码、办事 | 智谱清言 App / 网页 | 免费，有付费会员 | 能 |
| **Kimi** | 长文档、长任务、写代码 | Kimi App / 网页 | 有免费额度，K3 完整能力要会员 | 能 |
| **DeepSeek** | 免费里综合最强；深度思考 | DeepSeek App / 网页 | 免费 | 能 |

按你的情况挑一个：

<div class="nb-lab" data-nb-lab="aipick">
  <div class="nb-lab-head">
    <span class="nb-lab-kicker">LAB 01</span>
    <strong>十秒选型：先试哪一个？</strong>
    <p>回答三个问题，下面会给出一个首选和一个备选，并说明理由。随时可以改答案看变化。</p>
  </div>
  <div class="nb-lab-stage">
    <fieldset class="nb-rules nb-rules-inline">
      <legend>1 · 海外的 AI 你能直接用吗？</legend>
      <label class="nb-rule"><input type="radio" name="nb-ap-net" value="cn" checked><span>不能 / 不确定</span><small>只看国内能直接下载的</small></label>
      <label class="nb-rule"><input type="radio" name="nb-ap-net" value="global"><span>能</span><small>网络、账号和支付都已经解决了</small></label>
    </fieldset>
    <fieldset class="nb-rules nb-rules-inline">
      <legend>2 · 你最常拿它干什么？</legend>
      <label class="nb-rule"><input type="radio" name="nb-ap-use" value="daily" checked><span>问问题、写东西</span><small>查资料、出主意、写文案</small></label>
      <label class="nb-rule"><input type="radio" name="nb-ap-use" value="code"><span>写代码、办成套的事</span><small>做网站、处理表格、长任务</small></label>
      <label class="nb-rule"><input type="radio" name="nb-ap-use" value="docs"><span>读长文档</span><small>报告、合同、整本书</small></label>
    </fieldset>
    <fieldset class="nb-rules nb-rules-inline">
      <legend>3 · 愿意花钱吗？</legend>
      <label class="nb-rule"><input type="radio" name="nb-ap-budget" value="free" checked><span>只用免费的</span><small>先用着看</small></label>
      <label class="nb-rule"><input type="radio" name="nb-ap-budget" value="paid"><span>愿意付费</span><small>用得多，想要最好的</small></label>
    </fieldset>
    <div class="nb-lab-result" data-tone="good" data-nb-ap-out aria-live="polite"></div>
    <p class="nb-lab-nojs">这个小实验需要开启 JavaScript 才能操作。</p>
  </div>
</div>

## 结论会变，用你自己的活验证

成绩单能告诉你谁更强，但「在你的活上顺不顺手」只有你自己知道。最好的办法是**试驾**：

![一张试驾打分表：用三件自己这周本来就要干的活，同样的问法分别问 AI 甲和 AI 乙。总结 PDF 甲更准，写退租消息两边差不多，查周末展览乙能联网所以更好。哪个顺手留哪个](/media/newbie-tutorials/pick-test-drive.svg)

1. **挑两个。** 就是上面选出的首选和备选。别一口气装七八个，比到最后谁都记不清。
2. **备三件真活。** 不要考它「你是谁」，拿你这周本来就要干的事：一份要总结的文件、一条要写的消息、一个要查的问题。
3. **问法一字不改。** 同一段话分别发给两边。按[上一篇](/newbie-tutorials/how-to-talk-to-ai/)说的，背景、任务、要求写清楚，比较才公平。
4. **用一周，留一个。** 顺手的当主力，另一个留着问第二意见。

还有两件事，不管选了谁都要记住：

- **不用对某个 AI 忠诚。** 每过半年，翻一眼[模型榜单](/benchmarks/)，再用同样三件活试驾一次。
- **别把隐私交出去。** 你贴进输入框的每一个字，都会发到 AI 公司的服务器上。

![贴进输入框之前先过一遍红绿灯：公开信息放心贴；工作文件、合同、体检报告先删掉姓名、金额、证件号再贴；身份证号、银行卡、密码、公司禁止外传的资料和别人的隐私，别贴](/media/newbie-tutorials/pick-privacy-lights.svg)

不少产品默认会拿对话去改进模型，可以在设置里关掉：ChatGPT 在「设置 → 数据控制」，Claude 在「设置 → 隐私」，DeepSeek 在「设置 → 数据管理 → 数据用于优化体验」。其他产品，找名字里带「改进」「优化」的那个开关。

## 小结

- **三句结论：** 海外首选 Claude 和 ChatGPT，国内首选 GLM 和 Kimi，免费首选 DeepSeek。
- **结论来自成绩单：** 独立机构的考试，同一套题、同一个标准。Claude、GPT 两张榜都在最前排；GLM、Kimi 是主流国产模型里写代码最强的两个；DeepSeek 不要钱，综合分紧跟 GLM。
- **各有所长：** Claude 写代码和长任务，ChatGPT 最全能，GLM 国产最均衡，Kimi 读长文档，DeepSeek 免费。
- **结论会变：** 这是 2026 年 10 月的快照。最后拍板的，是你自己的活。

这篇出现的几个黑话，收个尾：

| 黑话 | 本文叫它 | 说明 |
| --- | --- | --- |
| 模型 · Model | 发动机 | GLM-5.3、Kimi K3、GPT-6 Astra、Claude Opus 5.5 这些名字，说的都是模型 |
| 产品 · App | 整辆车 | 把模型装进去，再配上联网、读文件、语音、画图的软件 |
| Benchmark · 基准测试 | 成绩单 | 独立机构出的同一套考题，用来横向比较模型 |
| 深度思考 · 推理模型 | 先打草稿再作答 | 难题更稳，但回答会慢一些 |
| 开源 | 发动机图纸公开 | 谁都能下载模型装进自己的 App，所以同一个模型会出现在很多地方 |
| [上下文窗口](/vibe-coding/terms/context-window/) | 一次能读多少 | Kimi 的长项；读长文档要看这一项 |

到这里，新手村的六篇凑成了一条完整的路：前四篇讲它是什么，第五篇讲怎么跟它说话，这一篇讲跟谁说。选好了，就去用吧。

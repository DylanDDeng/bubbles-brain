---
title: "AI 这么多，我该用哪个"
description: "豆包、DeepSeek、千问、元宝、Kimi，再加上 ChatGPT、Claude、Gemini——不用挨个下载。四道筛子加一次试驾，十分钟挑出适合你的那一两个。"
date: 2026-10-04
lastmod: 2026-10-04
draft: false
weight: 6
slug: "which-ai-should-i-use"
tags: ["新手村", "AI 选择", "AI 工具", "新手教程"]
---

[上一篇](/newbie-tutorials/how-to-talk-to-ai/)讲了怎么把话说清楚。可很多人卡在更前面一步：**到底该跟哪个 AI 说？**

打开应用商店搜「AI」，豆包、DeepSeek、千问、元宝、Kimi、文心排成一列；朋友说 ChatGPT 最强，同事说写代码得用 Claude，网上又说 Gemini 刚登顶了某个榜单。每一个都说自己最聪明，每一个都免费下载。

先说三句结论，让你松口气：

- **头部几家，日常差距比你想的小。** 问菜谱、写通知、改简历，它们都能做得不错；真正拉开差距的是难题和特定功能。
- **选错几乎没有代价。** 基础功能大多免费，不顺手就换，没有什么会员费会被浪费掉。
- **该问的不是「哪个最强」，是「哪个最适合我这几件活」。** 这一篇给你一套十分钟能走完的选法：先分清一个概念，再过四道筛子，最后试驾一次。

## 先分清：模型和 App 不是一回事

大家嘴里的「DeepSeek」「GPT」，常常指两样不同的东西。

一样是**模型**，也就是 AI 的「大脑」：负责理解你的话、思考、写出回答。[第四篇](/newbie-tutorials/how-llms-are-trained/)讲的训练，造出来的就是它。另一样是**App**，就是你手机上装的那个软件：它把模型装进去，再配上联网搜索、读文件、语音通话、画图这些手脚。

打个比方，模型是**发动机**，App 是**整辆车**。你去买车，不会只问发动机多少马力，还要看有没有导航、后备箱多大、坐着舒不舒服。

![同一个模型装进三个 App：甲只能聊天；乙多了联网搜索和读文件；丙多了语音通话和画图。问「今天上海下雨吗」，只有能联网的乙答得上来](/media/newbie-tutorials/pick-model-vs-app.svg)

这不是假想。腾讯元宝里，你可以在腾讯自家的混元和 DeepSeek 之间切换；DeepSeek 的模型是开源的，不少 App 里都装着它。所以「DeepSeek 真好用」这句话，可能夸的是那颗发动机，也可能夸的是某一辆车。

这件事的实际意义是：**挑 AI，要按「本事」挑，不按名气挑。** 日常最常用的本事有五项：

| 本事 | 管什么 | 没有它会怎样 |
| --- | --- | --- |
| **联网搜索** | 新闻、天气、价格这类「今天」的信息 | 模型的知识停在训练那天，它要么说不知道，要么照着印象编——[第一篇](/newbie-tutorials/why-llms-hallucinate/)讲过这个坑 |
| **读文件** | 你手里的 PDF、Word、表格 | 只能一段段复制粘贴，长了还会被挤出[桌面](/newbie-tutorials/why-ai-forgets/) |
| **看图** | 拍照问植物、截图问报错、看药盒说明书 | 你得用文字把图描述一遍，往往说不清 |
| **深度思考** | 算账、比较方案、写代码 | 它张口就答，容易在中间某一步算错 |
| **画图** | 海报、插画、头像 | 聊天模型只会写字，画图要另接一个模型 |

> 「深度思考」各家叫法不一样：推理模式、思考模式、专家模式，说的都是一件事——让它先在心里打草稿，再给你答案。慢一点，但难题更稳。

来试试：下面五句话，各自最需要 App 有哪项本事？

<div class="nb-lab" data-nb-lab="capmatch">
  <div class="nb-lab-head">
    <span class="nb-lab-kicker">LAB 01</span>
    <strong>这活要哪项本事？</strong>
    <p>五句日常会说的话，选出每句最依赖的那项本事。每题选完马上揭晓。</p>
  </div>
  <div class="nb-lab-stage">
    <div data-nb-cap></div>
    <div class="nb-lab-result" data-nb-result hidden></div>
    <div class="nb-lab-actions"><button type="button" class="nb-btn nb-btn-ghost" data-nb-reset hidden>再来一遍</button></div>
    <p class="nb-lab-nojs">这个小实验需要开启 JavaScript 才能操作。</p>
  </div>
</div>

## 四道筛子

分清了模型和 App，就可以开始挑了。依次回答四个问题，十几个候选会很快剩下一两个。

### 第一道：你那里能不能直接用

这一道最硬，也最先过。

ChatGPT、Claude、Gemini 这几家海外产品，**都没有面向中国大陆的个人用户开放**。Claude 的官方支持地区列表里，中国大陆和香港都不在上面。想用它们，得自己解决网络、海外手机号和海外支付，账号还可能被封。另一边，国内在境内向公众提供生成式 AI 服务要先在网信办备案，截至 2026 年 8 月底，已经有一千一百多款服务完成了备案。豆包、DeepSeek、千问、元宝、Kimi、文心这些，下载就能用。

所以，**如果你手头没有现成的条件，就别折腾。** 公开榜单上排在最前面的确实多是海外模型，但那些差距大多体现在高难度的题目上；写周报、查资料、问问题，国内头部几家完全够用。等哪天你真碰到了它们解决不了的活，再考虑也不迟。

### 第二道：你主要拿它干什么

这一道决定你挑哪辆车。下面是 2026 年 10 月的情况，**只列各家的特色和你可以先试的那个，不代表别家做不到**：

| 你最常干的活 | 国内先试 | 为什么 | 海外先试 |
| --- | --- | --- | --- |
| 日常问答、聊天、语音陪练 | 豆包 | 国内用户最多（2026 年 6 月月活 3.8 亿），免费版就有联网、读文件、画图和语音通话 | ChatGPT |
| 在微信生态里找资料 | 腾讯元宝 | 联网时能搜公众号、视频号里的内容 | — |
| 读长文档、长报告 | Kimi | 一直主打长文本，新模型 K3 能装下约 100 万 token | Claude、Gemini |
| 算账、比方案、写代码 | DeepSeek | 靠「深度思考」出圈；新模型 V4.1 还能直接看图 | Claude |
| 画图、做短视频 | 豆包 | 免费画图，还接入了字节的视频模型，能直接生成短视频 | ChatGPT、Gemini |
| 办事、做表格 | 千问 | 接入了阿里最新的旗舰模型，带办公助手和定时任务 | — |

这张表会过时，但思路不会：**先找到你最常干的那件活，再看哪家在这件事上有特色。** 你要是每样都干一点，就选功能最全的那个当主力。

### 第三道：免费的够不够

对绝大多数新手来说，**够**。国内几家的日常功能基本免费；海外几家也都有免费版，只是最新的旗舰模型多半只给付费用户。

付费大致是这个价位（2026 年 10 月）：

| 产品 | 付费档 | 每月价格 |
| --- | --- | --- |
| 豆包 | 专业版（2026 年 6 月上线） | 68 / 200 / 500 元 |
| Kimi | 会员 | 49 元起 |
| Claude | Pro | 20 美元 |
| Gemini | AI Pro | 19.99 美元 |
| ChatGPT | Plus | 约 20 美元 |

什么时候值得掏钱？满足任意一条再说：**每天都在用；免费额度经常撞到上限；需要某个只有付费档才有的功能。** 就算要付，也一次只订一家，用满一个月再决定续不续。

### 第四道：你的资料放心给它吗

这一道常被忽略，却最要紧。你贴进输入框的每一个字，都会发到 AI 公司的服务器上。有的公司还会默认拿对话去改进模型。

![贴进输入框之前先过一遍红绿灯：公开信息放心贴；工作文件、合同、体检报告先删掉姓名、金额、证件号再贴；身份证号、银行卡、密码、公司禁止外传的资料和别人的隐私，别贴](/media/newbie-tutorials/pick-privacy-lights.svg)

两个马上能做的动作：

- **关掉训练开关。** 多数产品在设置里都有一个「用你的数据改进模型」之类的选项。比如 ChatGPT 在「设置 → 数据控制」里，Claude 在「设置 → 隐私」里，DeepSeek 在「设置 → 数据管理 → 数据用于优化体验」里。名字各家不同，找带「改进」「优化」字样的那个。
- **工作资料听公司的。** 很多公司有规定，或者有自己部署的内部 AI 工具。规定比你选哪个 App 更要紧。

四道筛子都过完了，把答案填进去看看：

<div class="nb-lab" data-nb-lab="aipick">
  <div class="nb-lab-head">
    <span class="nb-lab-kicker">LAB 02</span>
    <strong>十秒选型：先试哪一个？</strong>
    <p>按你的真实情况回答四个问题，下面会给出一个先试的和一个备选。随时可以改答案看变化。</p>
  </div>
  <div class="nb-lab-stage">
    <fieldset class="nb-rules nb-rules-inline">
      <legend>1 · 海外的 AI 你能直接用吗？</legend>
      <label class="nb-rule"><input type="radio" name="nb-ap-net" value="cn" checked><span>不能 / 不确定</span><small>只看国内能直接下载的</small></label>
      <label class="nb-rule"><input type="radio" name="nb-ap-net" value="global"><span>能</span><small>网络、账号和支付都已经解决了</small></label>
    </fieldset>
    <fieldset class="nb-rules nb-rules-inline">
      <legend>2 · 你最常拿它干什么？</legend>
      <label class="nb-rule"><input type="radio" name="nb-ap-use" value="chat" checked><span>问问题、聊天</span><small>查资料、出主意、语音陪练</small></label>
      <label class="nb-rule"><input type="radio" name="nb-ap-use" value="docs"><span>读文档、写材料</span><small>总结报告、改文章</small></label>
      <label class="nb-rule"><input type="radio" name="nb-ap-use" value="reason"><span>算账、写代码</span><small>比较方案、解难题</small></label>
      <label class="nb-rule"><input type="radio" name="nb-ap-use" value="create"><span>画图、做视频</span><small>海报、插画、短视频</small></label>
    </fieldset>
    <fieldset class="nb-rules nb-rules-inline">
      <legend>3 · 愿意花钱吗？</legend>
      <label class="nb-rule"><input type="radio" name="nb-ap-budget" value="free" checked><span>只用免费的</span><small>先用着看</small></label>
      <label class="nb-rule"><input type="radio" name="nb-ap-budget" value="paid"><span>每月几十块可以</span><small>用得多就愿意付</small></label>
    </fieldset>
    <fieldset class="nb-rules nb-rules-inline">
      <legend>4 · 你会贴工作资料进去吗？</legend>
      <label class="nb-rule"><input type="radio" name="nb-ap-privacy" value="low" checked><span>基本不会</span><small>多是生活里的问题</small></label>
      <label class="nb-rule"><input type="radio" name="nb-ap-privacy" value="high"><span>经常会</span><small>合同、报表、客户资料</small></label>
    </fieldset>
    <div class="nb-lab-result" data-tone="good" data-nb-ap-out aria-live="polite"></div>
    <p class="nb-lab-nojs">这个小实验需要开启 JavaScript 才能操作。</p>
  </div>
</div>

## 最后一步：用你自己的活试驾

四道筛子帮你缩小范围，但最后拍板的应该是你自己的体验。榜单测的是别人出的考题，而你要的是**在你的活上顺手**。

![一张试驾打分表：用三件自己这周本来就要干的活，同样的问法分别问 AI 甲和 AI 乙。总结 PDF 甲更准，写退租消息两边差不多，查周末展览乙能联网所以更好。哪个顺手留哪个](/media/newbie-tutorials/pick-test-drive.svg)

试驾只要四步：

1. **挑两个。** 就是上面选出的那一个先试、一个备选。别一口气装七八个，比到最后谁都记不清。
2. **备三件真活。** 不要考它「你是谁」「1+1 等于几」，拿你这周本来就要干的事：一份要总结的文件、一条要写的消息、一个要查的问题。
3. **问法一字不改。** 同一段话分别发给两边。按[上一篇](/newbie-tutorials/how-to-talk-to-ai/)说的，背景、任务、要求写清楚，比较才公平。
4. **用一周，留一个。** 哪个用着顺手就留哪个当主力，另一个留着当备用，碰到主力答不好的题，再拿去问问第二意见。

还有一个心态要放下：**不用对某个 AI 忠诚。** 模型几个月就更新一轮，今天落后的明天可能就追上来了。每过半年，用同样三件活再试驾一次就行。想看各家在专业测试里的成绩，可以翻本站的[模型榜单](/benchmarks/)，但只拿它当参考。

## 小结

- **先分清模型和 App。** 模型是发动机，App 是整辆车；你感受到的差别，很多来自车，不是发动机。
- **按本事挑，不按名气挑。** 联网搜索、读文件、看图、深度思考、画图——先想清楚你的活要哪几项。
- **四道筛子依次过：** 能不能用、干什么、免费够不够、资料放不放心。
- **最后用自己的活试驾。** 挑两个，三件真活，同一个问法，一周后留一个。

这篇出现的几个黑话，收个尾：

| 黑话 | 本文叫它 | 说明 |
| --- | --- | --- |
| 模型 · Model | 发动机 | DeepSeek V4.1、Kimi K3、GPT、Claude 这些名字，说的多是模型 |
| 产品 · App | 整辆车 | 把模型装进去，再配上联网、读文件、语音、画图的软件 |
| 深度思考 · 推理模型 | 先打草稿再作答 | 难题更稳，但回答会慢一些 |
| 多模态 | 能看图 | 不只读文字，也能读图片，有的还能听声音 |
| [上下文窗口](/vibe-coding/terms/context-window/) | 桌面的大小 | 一次能放进多少材料；长文档要看这项 |
| 备案 | 国内上线的许可 | 在境内向公众提供生成式 AI 服务，要先在网信办备案 |

到这里，新手村的六篇凑成了一条完整的路：前四篇讲它是什么，第五篇讲怎么跟它说话，这一篇讲跟谁说。选好了，就去用吧。

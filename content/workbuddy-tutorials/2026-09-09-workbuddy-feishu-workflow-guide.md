---
title: "WorkBuddy 搭配飞书：群消息、记账与周报实战"
slug: "workbuddy-feishu-workflow-guide"
description: "配置 WorkBuddy 飞书连接器，用群消息总结与 Skills 收藏、截图记账与数据看板、项目周报三个案例，串起上下文读取、内容整理和结果交付。"
date: 2026-09-09
weight: 5
tags: ["WorkBuddy", "飞书", "连接器", "多维表格", "AI 办公", "Agent"]
author: "BubbleBrain"
sourceUrl: "https://mp.weixin.qq.com/s/-eBx2_llppdGEnD6771nSQ"
---

> 本文由 BubbleBrain 发布于微信公众号，原题为《WorkBuddy丝滑配飞书，看完直呼我是BB大天才？！》。[查看原文](https://mp.weixin.qq.com/s/-eBx2_llppdGEnD6771nSQ)

![WorkBuddy 搭配飞书教程题图](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_001.png)

This is B&B in your House.

有一说一·，

现在的AI办公产品真的非常非常卷，卷生卷死，卷到可怕。

![WorkBuddy 教程开场动图](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_002.gif)

这种卷的程度已经恐怖到大家都不清楚产品到底有哪些功能了。

总的来说就是当你把一个你以为大家都知道的功能演示给同事看的时候，他的反应be like：

![同事对 AI 办公功能的反应](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_003.png)

这也行？！

是的是的，是这样的，就比如我之前在团队里说WorkBuddy 也可以配飞书的时候，有小伙伴给我的回应是，

“WorkBuddy， 飞书？，你确定？！“

OKK！那我想我们也有很长一段时间没有讲WorkBuddy了，那不如今天就给大家讲解下如何用WorkBuddy 去搭配飞书，以及用上飞书之后，还有哪些特别的玩法。

## 配置飞书

整个配置的流程其实非常丝滑，不是很复杂。

我们先打开WorkBuddy 连接器，搜索飞书。

![在 WorkBuddy 连接器中搜索飞书](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_004.png)

然后点击+号，会出现一个首次使用的一个小弹窗提示：

![飞书连接器首次使用提示](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_005.png)

再等上一会儿，就会有一个飞书创建应用的界面。

![创建飞书应用](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_006.png)

然后我们直接点击创建按钮，会弹出这个权限勾选的界面

![配置飞书应用权限](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_007.png)

全部勾选上这些权限之后，再回到WorkBuddy，看到下面这样显示连接正常就说明可以正常通过WorkBuddy 来读取飞书中的内容，作为上下文了。

![飞书连接器显示连接正常](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_008.png)

我其实一直有个自己的暴论是，

“**好的Agent离不开好的上下文”**

那要让WorkBuddy发挥出最大的威力来帮助我等牛马打工仔，就不能舍不得给上下文。

那一个工作软件中，什么地方是最有上下文的呢？

当然是跟各种群消息还有多维表格了。

## 总结群消息

我自己在飞书上加了一个分享群叫AI Lab，里面会有小伙伴聊天然后分享一些比较优质的、好的内容，

但是我确实有的时候忙的没功夫看，等想起来了已经有快100条消息了，我还得慢慢爬楼翻，实在太累。

![飞书 AI Lab 群聊消息](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_009.png)

这个时候WorkBuddy 就可以派上大用场了。

我经常会让它做的一件事就是让它去看看群里大家在分享啥。

![让 WorkBuddy 总结群内分享](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_010.png)

模型选择上，秉持着能薅羊毛就绝不浪费积分的原则，我选的是腾讯自己家的新模型Hy4 Preview。这个模型到9月10日前，每天都还赠送免费的额度。

对吧，那就更没道理不用了！

把任务下达之后，我们等上一会儿，就可以看到结果了。

![WorkBuddy 生成群消息总结界面](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_011.png)

这里WorkBuddy 有一个非常好的的细节是支持了生成式UI，一眼就能看的清楚！

更重要的是它其实知道我想看的是什么，

它把人工分享的内容还有机器人发送的日报内容都给区分开来了，然后会按照推荐度来排序文章，告诉我哪些文章是值得看的，是重要的。

![按推荐度整理群内文章](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_012.png)

就现在这个时代吧，其实获取信息本身这件事并不难；难的是能讲出一堆信息里有哪些是重要的。

对于人来说，去筛选信息这件事儿可太累了；把它交给Agent 干，那是干得漂漂亮亮的。

再深一步说，碰上好的内容，我还能直接让WorkBuddy 统一给我丢到多维表格里管理，等到我想起来有需要的时候，我还能问它。

比如这里它说了机器人给我推荐了几个非常有名的Skills。

我最近正好也在给团队内小伙伴测评不同的Skills效果，所以正好可以让WorkBuddy来调研下这些Skills到底是什么东西。

![调研群内推荐的 Skills](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_013.png)

再次好评生成式UI！！ 真的对比看着太清晰了！！

然后这几个其实都是非常有名的Skills了，按照我自己的工作流会先丢到多维表格里存着，以备不时之需。这其实也是一句话的事儿。

![将 Skills 加入多维表格并检查重复内容](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_014.png)

比较细节的是，WorkBuddy 在发现有内容重复的时候，还会停下来先征求你的意见，不会鲁莽的删除或者愚蠢的添加重复的内容。

最后等WorkBuddy 做完之后，你就可以在自己的库里查看了。

![在飞书多维表格查看收集的 Skills](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_015.png)

## 管理个人记账

另一个让我觉得WorkBuddy 搭配飞书非常有用的场景是记账这件事儿。记账这件事儿本身有多重要，我就不用多说了吧。

真的，你不记账你不知道，自己原来能花这么多钱。

特别是干了AI之后，你就是这花一笔钱，那花一笔钱的，月底一看：

“我靠，我怎么花了折麽多钱！”

很早之前有一段时间我是记账的，但是后来我不记了，因为太麻烦了，每天都会有不同的付款方式，光靠人手工记肯定不行的。

所以之前研究出了一种已经是最省事儿的办法，就是把消费截图丢给WorkBuddy，让它自己根据截图去记录。

我实测下来核心的数据基本是都能填对的，偶尔会出现问题的，就是一些信息啥的，比如这笔账属于哪个分类啥的，这个再多调整一下就是了，反正不是我调整。

而且这个方法的最大好处之一是，它不需要你坐在电脑边，直接通过移动端远程控制的方式，把截图丢给WorkBuddy就行。

![通过移动端发送消费截图记账](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_016.png)

等上一下，很快就做好了。我发现Hy 4 对这种实际工作环境里Skills的运用还是挺熟练的，都不怎么会出错。

我们可以直接打开多维表格查看一下：

![在飞书多维表格查看新增账单](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_017.png)

已经给我加在这儿了。

然后可以给大家搂一眼我自己现在的这个账单一部分，非常之吓人；

![个人订阅与消费记录](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_018.png)

只有在整理的时候才会发现，卧槽，这个订阅我怎么没记得取消。。。

当然了，只入库记录肯定不行，不然没办法沉淀，也没办法知道下个月该往哪里完善。

所以我又让Workbuddy 基于我的这张表整理了一个数据看板。只要我的这个表动了，数据看板也会自动更新调整。

提示词其实也不复杂，就是一句话，让它按几个维度来建立看板就行。

![让 WorkBuddy 基于账单创建数据看板](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_019.png)

来看看WorkBuddy 来做的结果吧。

![WorkBuddy 创建的消费数据看板](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_020.png)

这表纯靠我给它那么一句不清不楚的话做出来，真是难为它了。要我自己手动搭建一个这样的表，连摸鱼带干活，我可以干三天。

有了这么张表，最大的好处就是我知道这个月比上个月，钱多花在哪，少花在哪儿了，我看得更加方便，更加清楚了。

我甚至都可以问WorkBuddy 我想知道的数据，比如我这个月和上个月的花费对比是怎么样的？！

![询问本月与上月花费对比](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_021.png)

它直接给我现做了分析。

![WorkBuddy 生成的消费分析](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_022.png)

连文字带图片，非常详细。一看就是老数据分析达人了。

我仔细想了想，过去很长时间其实我并不是缺少数据，而是有很多很多的数据在每天发生，但是一直都没有合适的方法去把它沉淀和提炼。

对一个模型来说，无法拿来训练的数据，就是没有用的数据；那对人来说，也是一样的道理。无法沉淀的数据，一样也没有任何价值。

但是有了WorkBuddy 搭配飞书之后，数据不仅有了存放的地方，也有了它价值的体现。

## 邪修写周报

最后还分享一个非常邪修的写周报的方法。

就是我之前是一个非常非常讨厌写周报的人，简直是深恶痛绝。

但是后来我发现了一个邪修的方法之后，感觉小小周报也就不过如此。

就如果你是写代码的，直接让WorkBuddy 读取几个项目的代码提交历史，然后总结一下，总结出来的内容放到飞书文档，那就是一篇充实的周报。

让我来演示一下：

![根据项目提交历史生成周报](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_023.png)

直接让它读取你经常工作的几个项目，形成一个周报。

有意思的是，它还挺有觉悟的，在执行的时候发现这周才过去两天，然后问我要不要算上上周的工作内容也算到周报里来。

![确认周报统计时间范围](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_024.png)

那这不天大的好事儿么。

等上一会儿，就完成了，直接在内置浏览器打开了。

![查看生成的飞书周报](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_025.png)

权威，还是太权威了。

周报最忌讳的是什么？！

是只顾着长度不顾着内容。

那写周报的最大难点是什么？！

是都写周报了，谁还管内容啊！

WorkBuddy 就非常好的平衡了这两点。 要内容有内容，要长度有长度，主打一个全面型周报，让人看了挑不出毛病。

那可能有小伙伴还会问了，只说了研发写周报，是别的岗位不配么？ 那当然不是了。别的岗位的应对周报之法就更多了。

我随便讲两个方法。

一个是去WorkBuddy 的技能里搜索周报两个字。

![在 WorkBuddy 技能市场搜索周报](/media/workbuddy-tutorials/workbuddy-feishu-workflow-guide/img_026.png)

WorkBuddy 的技能里堪称一个巨大的宝库，有着极其丰富的生态市场。只要你愿意搜，就没有它没收集的。

咱就找着这些技能试就行了。

还有一个方法其实跟我们第一个case 说的方法基本一致，

WorkBuddy 都能总结各种消息了，难道还不能给我总结出一个周报来么就？！保准写的又快又好。

## 最后写点儿

我之前看到网上很火的是大家都在搭建属于自己的工作台。但是我一直没对这件事儿多感冒。

因为我的所有的工作上下文本身已经存在于飞书里了，感觉完全没有必要来为此在多花时间搭建一套。

我缺的只不过是一个能够随时承载着我的这些上下文的Agent。

它需要能24小时随时在线，无论是远程还是在电脑旁，亦或是云端or 本地，它永远就在那里替我默默做事儿；

它还需要能支持各种模型，来满足我有的时候既想测试不同模型，又想体验薅羊毛的爽感；

它还需要有各种各样的插件集成、Skills 收藏，这样才可以想做什么就做什么。

这么看来，WorkBuddy 最合适不过了。

以上，

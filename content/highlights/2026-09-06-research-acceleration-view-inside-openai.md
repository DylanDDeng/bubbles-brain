---
externalId: "research-acceleration-view-inside-openai"
kind: "article"
title: "研究加速：从 OpenAI 内部看 AI 研究的变化"
description: "OpenAI 披露内部 Coding Agent 的使用量、实验速度、任务成功率与人工干预数据，并说明安全限制如何影响训练，以及衡量研究加速的方法和局限。"
date: 2026-09-06
sourceUrl: "https://openai.com/index/research-acceleration-view-inside-openai/"
tags: ["OpenAI", "Codex", "AI Research", "Coding Agents", "RSI", "AI Safety"]
featured: true
draft: false
---

[OpenAI 官方原文](https://openai.com/index/research-acceleration-view-inside-openai/) · 2026 年 9 月 6 日

> 本文为原文的中文译编，“我们”指 OpenAI。图表使用原站公开的数据与图表定义转为静态版本，调整了配色与版式。重复的方法说明合并至附录，分类器提示词保留英文原文。RSI 指递归自我改进（Recursive Self-Improvement）。

我们相信，要让 AGI 造福全人类，就必须让它接受民主治理。这需要公众充分了解高能力 AI 系统的能力、风险和保护措施，并展开知情讨论。世界各地的人都需要理解前沿 AI 可能的发展轨迹，才能有意义地参与决定它如何发展。

披露具体风险、事件和保护措施是必要的，但还不充分。我们认为，公众也需要理解最有能力的系统如何在前沿实验室内部发展，以及它们如何推动研究进步。

我们的目标是安全地构建自动化 AI 研究员，使其能够在人类监督下推进深度学习和对齐研究，实现迭代改进。根据我们的测量，我们已经达到了去年秋天[宣布的目标](https://x.com/sama/status/1983584366547829073?lang=en)：在今年 9 月前拥有自动化研究实习生。这里的“研究实习生”，指的是能够在人类指导下完成定义明确的研究任务的系统，包括那些需要熟练研究人员花费数天完成的任务。我们正朝着在 2028 年 3 月前创建自动化 AI 研究员的目标取得显著进展。

今年以来，OpenAI 研究人员的日常工作发生了很大变化。研究人员全天都在使用 Coding Agent，常常同时运行多个会话，总使用量迅速增长，增速超过 OpenAI 的其他团队。研究人员提交代码的速度更快，运行的实验也更多。Agent 的使用方式同样在变化：它们承担的任务越来越复杂，成功完成任务的频率也在提高。

AI 研究是一个复杂过程，存在许多潜在瓶颈，因此整体进展的速度很可能无法与这些具体指标同步增长。不过，总体而言，这些结果与我们许多人的内部感受一致：Agent 工具正在实质性地加速研究进展。研究优先级仍由人来设定，哪些想法和结果值得继续追求，以及是否扩大规模、暂停或部署系统，也仍由人来决定。

我们相信，如果以负责任的方式开展，自动化 AI 研究将带来直接改善人类福祉、推进 OpenAI 使命的模型。它可以降低先进智能的成本，让世界各地的人受益。我们开展这项工作的一个原因，是自动化研究可能帮助我们解决对齐问题，并构建应对越来越强大的 AI 的防御能力。自动化 AI 研究员也可以成为自动化安全研究员或对齐研究员。能力更强、与人类意图对齐的系统，可以帮助保护关键基础设施、防御危险的 AI Agent，并开发新的保护措施。

这些都是发展有用的自动化研究能力的理由，但并不意味着快速 RSI 必然是我们应该追求的结果。是否推进、如何推进，必须取决于我们能否保有人类控制，以及公众在充分知情后对收益与风险作出的民主选择。

我们尚不知道如何安全地一路实现与人类意图对齐的完整 RSI。我们正在让对齐和安全措施随能力一起扩展，但不能假定它们的进展一定跟得上；能力更强的系统也可能更难监控。严谨的对齐与安全工作是这项工作的核心，起点是测量并缓解当前 Agent 编程系统中已经出现的安全问题。只要我们发现继续推进会带来不可接受的安全风险，就会采取适当行动，包括放慢或停止开发、部署那些无法获得充分保护的系统。

近期 Hugging Face 事件发生后，我们[将这一承诺付诸行动](https://openai.com/index/pacing-model-development-cyber-capabilities/)，暂停了计划部署的最新模型的强化学习（RL）训练，同时进一步加固研究环境、开展红队测试，并扩大监控系统的覆盖范围。这并未停止全部研究：部分工作负载在更严格的控制下恢复，另一些则继续暂停。我们提高了安全和对齐标准，把安全工作更深入地纳入模型生命周期，要求在整个训练过程中提供更有力的对齐行为证据。

今天，我们提供一份详细快照，说明最近几个月 Agent 系统如何推动我们向 RSI 迈进。Agent 系统仍然新颖且变化迅速，我们的测量工作也处于初步阶段。通过分享早期结果和背后的方法，我们希望帮助公众了解情况，推动公开披露成为常态，并帮助整个领域形成共同的测量标准。

正如我们在[前沿安全政策蓝图](https://openai.com/index/frontier-safety-blueprint/)中所写，我们认为，OpenAI 和其他公司都应被要求公开跟踪各自迈向 RSI 的进展。即使没有这样的要求，我们也计划继续保持透明。随着测量技术和理解的改进，我们会调整透明度实践，同时兼顾安全和专有信息的保护。

## 1. Coding Agent 正在重塑 OpenAI 研究人员的日常工作

今年年初，按 Agent 使用量排名位于中位数的 OpenAI 研究人员，使用 Coding Agent 的量还不大。到 8 月中旬，这位中位数研究人员已经每天把 Agent 融入工作；按 API 价格折算，每天使用的推理超过 600 美元。研究组织中位于第 90 百分位的用户，每天使用的 token 按同一口径折算超过 7,000 美元。

<div class="article-figure-grid">
<div class="article-figure-grid__item">

![内部 Coding Agent 使用量：研究人员中位数](/images/highlights/research-acceleration/276xfN35M5ZRRCHqaGoeqc-paired.svg)

</div>
<div class="article-figure-grid__item">

![内部 Coding Agent 使用量：第 90 百分位研究人员](/images/highlights/research-acceleration/6uxQo7OTnJrk6arDtdYQGt-paired.svg)

</div>
</div>

![研究部门的使用量增长快于公司其他部门](/images/highlights/research-acceleration/4yelFztsMmTGSygPES59Mh.svg)

2026 年 6 月之前，整个研究组织的 Agent 总运行时长仍低于人类总劳动时间。如今，这一情况已经改变。按标准的 8 小时工作日折算，截至 8 月中旬，研究组织每投入 1 个人类工作日，就使用相当于 3.1 个 Agent 工作日的运行时间。

![Agent 工作日与研究人员工作日的比值](/images/highlights/research-acceleration/6OZYTVQM8KRYJ1H21oa0V5.svg)

另一个观察角度，是有多少研究人员采用高并发工作流，例如同时运行 4 个或更多 Agent。如下图所示，这个人数正在增长。统计包含每日峰值，既计入用户直接启动的 Agent，也计入这些 Agent 随后创建的子 Agent。

![研究人员越来越多地采用并发工作流](/images/highlights/research-acceleration/G7AW5IjPbFuDiZ6gNmEAL.svg)

## 2. 研究人员编写更多代码，运行更多实验

AI 研究的许多环节可以视为劳动密集型过程，目标是将模型智能或性能上的新改进整合进核心模型。这个过程依赖很多步骤，只有它们共同运转良好，能力才能提升：研究人员需要设计新的改进方案，编写评测来判断模型表现，搭建基础设施以规模化测试这些改进，在训练中发现 bug 及不安全或不对齐的行为，并把有效的想法整合进核心训练任务。任何环节的失败都可能限制整个循环。

编写代码和运行实验是研究人员的两项主要工作，我们已经看到这些过程正在加速的证据。

![全公司工程人员的代码交付速度正在提高](/images/highlights/research-acceleration/3kKr6oP0sSiYi1Lrja7x2b.svg)

这些数据相对容易测量，却不容易解释。随着自动化推进，最难自动化的任务会占据研究人员越来越多的精力，并成为未来进展的重要瓶颈。算力也是限制进展的因素；随着其他瓶颈减弱，它的重要性可能进一步提高。

2026 年，平均每位活跃实验人员运行的实验数有所增加，8 月达到自 2025 年 1 月开始追踪以来的最高值。这与 Codex 使用的增长相关，不过，我们可用的算力自 2025 年以来也有显著增加。

![每位活跃实验人员的实验数量增加](/images/highlights/research-acceleration/51uRPX69SaWzZdkUwwCFQF.svg)

## 3. 研究人员交给 Agent 的工作正在变化

定性观察和内部数据都表明，研究人员委派给 Coding Agent 的任务组合正在变化：更高层次、更长时间跨度的任务，越来越常被交给 Agent。

为了更清楚地了解这一趋势，我们使用 Epoch AI [近期发布的分类体系](https://epoch.ai/gradient-updates/toward-an-onet-for-ai-rnd)，分析研究组织近期的使用情况。该体系受长期用于分类各类工作的 O*NET 系统启发，专门面向前沿 AI 研发，将研发生命周期拆分为六个主要阶段：

1. **决策（Decide）**：做什么、继续什么、如何分配资源。
2. **设计（Design）**：研究想法与工程规格。
3. **构建（Build）**：代码与数据集。
4. **运行（Run）**：训练与评测任务、硬件和模型服务。
5. **分析（Analyze）**：实验、模型、部署及外部工作。
6. **沟通（Communicate）**：发现、反馈、状态和决策。

下图按照这一体系对 Coding Agent 的 token 使用进行分类。

![研究人员正在以新的方式使用 Coding Agent](/images/highlights/research-acceleration/4QLdZ4iw0n4L9rYGTvteZK.svg)

![年初以来，各类研究活动的 Agent 使用量均有增长](/images/highlights/research-acceleration/1nabj561MakfHpgk8Nau7M.svg)

从 2026 年 1 月到 8 月，各类研究活动的使用量都有增长。1 月时，占主导的类别是研究与基础设施代码。这个类别持续扩大，其他类别也有明显增长，尤其是技术帮助和运行监控。高层规划仍只占 Agent 输出 token 的极小比例。

根据同事的反馈，Coding Agent 很擅长排查内部研究基础设施的问题，这解决了研究进展中的一个实际瓶颈。多个团队过去会定期开设答疑时段，帮助研究人员排查实验问题；它们发现 2026 年参加答疑的人数减少，其中一个团队已经完全停止这类答疑，把精力转向其他系统改进。

下图展示研究人员向其他团队寻求技术支持的一个主要内部频道，每天发布的顶层帖文数量。据我们所知，该频道活动的减少，并未被转移到另一个由人提供技术支持的频道的提问抵消。流量下降与上述更广泛的变化一致。

![部分研究故障排查越来越多地由 Agent 承担](/images/highlights/research-acceleration/5i5c3kCvvooZXryxTLJKYB.svg)

我们还可以研究 Coding Agent 是否成功完成了研究人员提出的任务。借助 Agent 分类器，我们发现，从 1 月到 7 月，对于能够找到真实结果的任务，多个难度分组中的成功率总体有所提高。难度以人类完成任务所需时间的估计值作为近似衡量。

不过，Agent 要成功完成任务，仍需要大量人类引导，任务越复杂越是如此。在过去 6 个月中，成功完成的 4–8 小时任务里，超过一半发生过至少 1 次人工干预。

![Agent 完成研究任务的成功率随时间提高](/images/highlights/research-acceleration/4J4gOOZPIhRvVC5oniqDDG.svg)

上图排除了结果不确定的分类，以及会话数少于 50 或独立用户数少于 50 的数据点。

![更长的任务需要更多人工干预](/images/highlights/research-acceleration/1Jc716VU2pvzYGuQUBvYTa.svg)

上图按任务时间跨度展示 1 月至 7 月的任务结果和干预情况，排除了结果不确定的分类。

## 4. 把握模型开发的节奏

迈向更强大、能够实现安全且有益 AGI 的系统，还取决于这些工作所需的保护措施。随着我们对风险的了解加深，对必要保护措施的判断也可能变化。

[如前文所述](https://openai.com/index/pacing-model-development-cyber-capabilities/)，我们最近更新了监控、对齐和安全标准。这里展示近期限制如何影响研究活动的一个方面。

![安全限制实施后，强化学习算力分配的变化](/images/highlights/research-acceleration/2gqOfIvKUYrL6COO2IImIV.svg)

图中 7 月 20 日至 8 月 6 日之间的大部分 Astra 算力，用于测试安全与安保改进措施的实施情况。

7 月 20 日，在发现 Agent 已经攻破我们的研究基础设施后，我们暂时关闭了训练所用的容器服务，随后在增加大量限制的情况下恢复了服务。

这导致 RL 训练算力急剧下降，团队需要重新配置工作流，以适应加固后的研究环境。上图包含了对计划部署的最新模型暂停两周强化学习的阶段。在 7 月 20 日至 8 月 6 日的 Astra 级 RL 实验中，按 GPU 分配量计算，大部分运行都用于测试安全与安保改进措施的实施情况。

8 月 7 日，初步证据表明，按照我们的[预备框架（Preparedness Framework）](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf)，Astra [可能具备关键级网络能力](https://openai.com/index/responding-next-frontier-critical-cyber-capabilities/)。这促使我们增加针对该模型的安全限制，要求 Astra 在安全等级更高的研究环境中运行。

在接下来的一周，Astra 级 GPU 分配量进一步下降了 **59.2%**，其他模型类别的分配量则增加了 **17.2%**。这一增长抵消了 Astra 级降幅的约 **85%**，使所分析 RL 工作负载的总分配量基本保持不变。这一模式与“涉及 Astra 的工作受到限制时，部分训练和实验转移至非 Astra 模型”的解释一致，也与研究人员为受到新约束的工作负载所释放的算力寻找其他用途的反馈相符。

这些数据为围绕训练与安全的持续讨论提供了有用信号：新的控制措施实施后，算力仍然有价值，也有灵活性，自然会流向研究组织内部的替代用途。长期而言，讨论 AI 进展速度时，还应进一步讨论如何最好地使用那些受到新控制措施或拟议控制措施约束的算力。

## 5. 接下来的道路

推动并理解迈向对齐 RSI 的进展，对我们的使命至关重要。我们会继续完善方法，报告不断演进的理解，并努力推动对前沿系统的知情公共讨论和有意义的民主治理。

## 附录：本文的测量方法

由 Agent 驱动的 AI 研究仍然新颖，我们还在学习如何测量它。一些指标，例如研究团队生成的代码量，相对容易收集，却难以解释，因为它们与研究进展的关系仍不确定。更直接关注研究进展的指标，例如 Agent 完成研究人员交付任务的频率，可能更有用，但开发和验证都更复杂。与此同时，研究人员依赖的工具与系统也在快速变化。加深对研究加速的理解，是整个 OpenAI 的一个重点方向。

除非另有说明，以下约定适用于各项分析：

- “研究人员”是一个广义术语，指研究组织的任何成员，包括构建研究基础设施、管理研究项目或以其他方式支持研究的人员。
- 由于研究人员依赖的工具与系统快速演进，Coding Agent 使用指标覆盖了大部分使用情况，但并未覆盖全部。

### 使用量的中位数和第 90 百分位

每天计算研究人员使用量的中位数与第 90 百分位，再按周一至周日对这些每日数值取周平均，排除公司统一假日。

统计包含研究部门员工的流量，选取通常对应交互式使用的产品入口，排除 `codex exec` 等程序化自动化使用。内部或尚未部署的模型按最接近的生产模型定价，通常对应最终发布的检查点。

费用采用与内部部署最相似的处理层级的零售 API 价格，价格基准日为 2026 年 9 月 3 日。图中金额表示按 API 价格折算的使用量。

### 不同部门的使用增长

输出 token 合并每位员工的 ChatGPT 与 Codex 输出，包含隐藏推理 token，以及可见回答、代码和工具调用的 token。排除公司假日，并把总量换算为 28 天等效值。

每天各部门的数值是所有在职正式员工的中位数，也包括使用量为零的员工，再相对于该部门 2025 年 11 月 1 日的中位数展示。统计使用通常对应交互式使用的产品入口，排除 `codex exec` 等程序化自动化使用。

### Agent 工作日与人类工作日

将所有符合条件的 Agent 运行时长求和，按每 8 小时折算 1 个工作日。每轮交互的墙钟时长通过服务端连接事件与客户端遥测近似估算，并使用多种启发式规则处理长时间无活动的交互。如果同一轮中的两个服务端事件相隔超过 30 分钟，这段中间时间视为非活跃时间，不计入 Agent 工作时长。

研究人员工作日的分母，为保持统一尺度，简单按研究组织每位员工在每个日历日 8 小时计算。图表使用排除公司假日后的 28 天滞后平均。

统计选取通常对应交互式使用的产品入口，排除 `codex exec`、标题生成、记忆整合后台任务、workspace agents、内部评测和已知测试流量。子 Agent 被计为独立于父 Agent 的 Agent；自动启动以审查 Agent 行为的 `auto-review` 会话也计入其中。

### 并发工作流

曲线表示过去 7 天内，曾在任意时刻同时运行至少 4 个 Agent 的研究部门人员占比。分母包括管理者和不在岗员工，排除假日，日期按 PDT 统一。

Agent 交互轮次重叠超过 30 秒才被视为并发。同一轮中两个服务端事件之间超过 30 分钟的无活动间隔，不计入并发峰值。产品入口、排除项、子 Agent 和 `auto-review` 会话的口径，与上面的 Agent 工作日统计相同。

### 代码交付速度

每天对代码库中的每个非自动化提交，将新增与删除的代码行数相加；每次提交的行数在所有提交的第 99 百分位处截断，再除以活跃贡献者数量。活跃贡献者指过去 12 个月中至少有一次提交的独立贡献者。

图表展示季度平均，以 2025 年之前的平均值作为 1 倍基准。2026 年第三季度的原图斜线柱表示截至 8 月 15 日的未完整季度数据；静态版本用较浅的颜色区分。

### 实验速度

使用 OpenAI 常用实验追踪工具 [Neptune](https://openai.com/index/openai-to-acquire-neptune/) 中的实验数据，并进行以下清理：

- 排除评测与自动运行的任务，例如程序化测试。
- 将每个所有者命名空间的贡献限制为每天最多 100 次实验，以减轻个别人提交超大规模参数扫描的影响。

随后计算每周实验数，除以该周实际运行实验的人数。这衡量的是条件强度：对于当周运行过实验的研究人员，他们运行了多少次实验？采用这一口径，是因为并非所有研究人员都会常规运行实验，例如研究群体中有很多人从事系统优化或数据收集，因此活跃实验人员的占比会随时间变化。图中展示这一每周比值的 4 周移动平均。

该图没有控制以下影响：

- 算力随时间增长，也可能提高实验速度。
- 条件强度口径带来的效应，例如少量运行实验的人完全停止实验后，平均值可能表现为实验速度提高。

### 研究活动的分类与变化

从活跃研究员工的内部编程会话中随机抽样 **2%**，再据此推算完整 token 数量。

为限制高使用量用户的影响，将每位用户在纳入统计的研发类别中的每日输出 token 总数，在当天样本中非零用户总量的第 95 百分位处截断。超过上限的用户，其各类别数量按比例缩减，保留原来的类别占比。

分类直接采用 [Epoch AI 的分类体系](https://epoch.ai/gradient-updates/toward-an-onet-for-ai-rnd)，只增加了“标注／评分”一项，随后又将其排除，以防突发的高频评分活动使数据偏离正常研究趋势。“其他／无匹配研发任务”类别也不绘制。

堆叠图使用 14 天移动平均。变化图比较 2026 年 8 月 1–15 日与 1 月 20–31 日的日均值。分类器使用中等推理强度的 GPT‑5.6 Sol，提示词保留如下：

```text
Classify the user’s primary objective in this Codex session into exactly one leaf task from Epoch’s O*NET for AI R&D taxonomy.

Decision procedure:

- Read the supplied objective-focused session view and identify the primary objective or dominant task. The view represents user messages, assistant-facing summaries from previous session windows and other subagents, user-facing final answers and commentary. Assistant tool calls, including subagent instructions, may be included; tool outputs are omitted. At times, user messages from previous windows are included at the start of the conversation to provide context on the current task. However, you should not pick a classification based on these previous-window user messages. The point in the conversation where assistant messages begin interleaving with user messages represents the point when “real work” for the current window begins. If messages are truncated for exceptionally large sessions this will be indicated.

- Identify both the object of the work and the dominant action: planning or specifying, implementing, operating, analyzing, or communicating. Judge the work the user sought, not merely the tool or artifact used, and the underlying goal. Do not infer an AI R&D objective from words such as “experiment”, “run”, “eval”, “grader”, “incident”, “model”, or “plan” alone.

- Choose the single most specific leaf task below. The numbered section and subsection headings provide context only and are never valid outputs.

- If the session contains several activities, choose the leaf that best captures the main objective and the bulk of the work. Treat supporting steps as secondary. A final test, launch, review, question answered, status question, or write-up does not outweigh substantive implementation, debugging, or analysis that preceded it.

- Choose “No matching AI R&D task” when the primary objective is not AI R&D work or the session provides too little evidence to select a task.

Scope boundary:

- This taxonomy covers work on AI research, training and evaluation systems, model behavior, model serving, and researchers’ workflows. Software engineering or administrative tasks that support AI R&D work are also in-scope (for instance, getting a PR to pass CI, implementing a quota scheduler or scheduling a team sync). However tasks entirely unrelated to AI R&D are out of scope.

Research-planning boundary:

- Research planning concerns a model, training, or evaluation research experiment. A generic project plan, QA plan, or application-security test plan is not a research-experiment plan unless it substantively evaluates an AI system.

- A concrete, testable statement of the expected outcome before an experiment runs is “Predict the experiment result with a falsifiable prediction before running”. Choose that leaf instead of the broader experiment-design or plan-writing leaves.

- Choosing ablations, scale, and baselines is “Design the experiment that tests the approach (which ablations, at what scale, against what baselines)”.

- Writing the complete protocol, controls, hyperparameters, and success criteria is “Write the experimental plan (full protocol with controls, ablations, baselines, hyperparams, scale, success criteria)”.

Specification, grading, and analysis boundary:

- Writing a reward or evaluation specification requires creating or changing the reward function, evaluation protocol, or grading rubric. Applying a provided rubric to one answer, search result, permission check, or other candidate is grader execution, not specification writing.

- “Analyze model behavior on evals” requires examining model outputs to characterize successes, failures, or behavioral patterns on an evaluation. Grading one item against a supplied reference or rubric is not model-behavior analysis; use “Label or grade agent rollouts” when the item is an agent trajectory.

- Testing an ordinary product feature (for instance, checking if an HR app loads properly) is not model-behavior analysis. If there is no broader AI R&D objective, choose “No matching AI R&D task”.

- “Analyze user feedback and complaints” does include individual support tickets, thumbs-down, and user reports when the objective is to understand a user-perceived model failure. Implementing the requested product change or actively mitigating the issue is implementation or operations, not production-behavior analysis.

Run, infrastructure, and incident boundary:

- “Monitoring runs” concerns an active training, RL, or evaluation run: launching it, monitoring its health, or restoring it. An ordinary CI job, workflow, data pipeline, or application task is not a training or evaluation run.

- “Hardware infrastructure operations” concerns cluster capacity, nodes, accelerators, fabric, or storage. “Inference reliability engineering” concerns deployments, capacity, routing, and incidents in model serving. A backend, data, or application-service incident is not an inference incident without evidence that model serving is the object of the work.

- Use “Experiment outcomes” for post-hoc interpretation, validity checks, or statistical analysis of training and evaluation results, rather than for operating an active run.

- For active AI-data-generation or pretokenization jobs, use Monitoring runs when the primary objective is babysitting or restoring the job; use Datasets when the primary objective is constructing, filtering, or materializing the corpus.

- If the task is generating software or interacting with technical systems (such as git) but it does not fit cleanly into a research category, it is likely “Write code to implement research and developer tooling (dashboards, debuggers, experiment trackers)”. “Tooling” is very broad and can include dashboards on miscellaneous topics, or general infrastructure.

Communication boundary:

- Communication leaves require substantively authoring a report, documentation, feedback, or status update for the user or other people. Do not pick communication if it is only a small part of larger analysis/coding/monitoring/implementation etc. An agent writing notes to self or sub-agents for future reference is not communication.

- Task-state checks and automated heartbeat or status commands are not research communication by themselves (they are most likely monitoring).

- Pick “Review code” in cases where the agent is reviewing another person’s code, or where the description for “Review code” matches significantly better than any of the labels in the “Code” category. Prefer a “Code” subcategory in cases where the agent is reviewing/giving feedback on code it is implementing itself.

- Pick “Answer a technical question” if the technical question is the bulk of the agent’s work in the session. One-off technical questions should not dominate the classification if there is other substantive work done.

Coding boundary:

- If a window involves cleaning up code or getting it to pass CI, try to determine the purpose of the code and assign it to the appropriate category.

Taxonomy:

- {{TAXONOMY}}

Output exactly one leaf-task label from the taxonomy, or “No matching AI R&D task”, with no explanation or additional text.
```

Epoch AI 分类体系之外新增的一项：

```text
Label or grade agent rollouts

- Example: Apply a user-given rubric on an agent trajectory and report scores.
```

### 技术支持频道

数据来自推理团队使用的主要内部支持频道。排除公司假日，使用 14 天移动平均平滑数据。

真实的支持请求降幅可能比图上更大：相关团队在这一时期不断扩员，而频道中的问题也逐渐从绝大多数是支持请求，转为大多数是 PR 审查请求。

### 任务成功率与人工干预

这一指标的目标，是量化在有限的人类引导预算下，内部 Coding Agent 成功解决任务的频率。简单分类器，例如只根据模型输出判断是否成功，难以有效测量结果，也会遗漏人工干预：模型可能错误地声称成功，PR 可能出现后续评论，用户也可能在后续会话中要求修改。

为同时测量结果与人工干预，我们使用 5.6 Sol 设计了 Agent 分类器。它结合前后会话轨迹读取研究人员的历史会话，确定主要任务，并利用 Slack 频道、文档和 PR 等内部数据源，在事后判断任务是否成功、需要多少次人工干预。在 **n=25** 的人工标注任务集上，我们发现该分类器与人类判断一致。

另一个问题是：随着模型和运行框架改善，以及用户经验增加，内部任务分布会变化，从而使成功率更难解释。作为部分控制措施，我们用 5.6 Sol 为每个任务标注人类等效完成时间，并在各时间分组内绘制任务成功率。

具体方法如下：

- 随机抽样 2026 年 1 月 1 日至 7 月 31 日会话的 2%。
- 只保留研究部门内部 Coding Agent 的交互式会话，排除自动化、记忆更新、标题生成和环境建议。
- 主图排除 `Uncertain` 分类，因此展示的是能够找到真实结果的任务分布上的成功率。即使把不确定任务悲观地全部视为失败，后期月份优于早期月份的结论仍然成立。不过，不确定任务的真实成功率也可能逐月变化，当前分类器无法区分这种变化。观察上，不确定任务常类似于完全孤立、难以判断后续结果的评测问题，或自定义 Agent 流水线中的子任务。
- 分类器记录主要任务、结果和干预次数。结果类别为 `Success | Failure | Tool errors | Uncertain | No clear goal`。
- 对会话重新加权，使所有用户权重相同，减轻个别用户启动大量会话带来的影响。

人类完成时间由中等推理强度的 GPT‑5.6 Sol 分类器估计，提示词与近期论文 [The Shift to Agentic AI: Evidence from Codex](https://cdn.openai.com/pdf/5d1e1489-21c0-43e4-9d42-f87efdbf0082/the-shift-to-agentic-ai-evidence-from-codex.pdf) 中的提示词类似。验证方式同样是分析它与 Codeforces 解题时间的相关性。

![任务时间跨度估计器验证：估计的人类任务时间与平均解题时间的 Pearson 相关系数为 0.85](/images/highlights/research-acceleration/task-horizon-validation.svg)

在 Codeforces 题目上，分类器能够较好地预测相对难度，但给出的时间估计偏保守，通常高于前 5 名的解题时间。

以下是结果与干预分类器的原文提示词，其中部分内部细节已由 OpenAI 隐去：

```text
You are analyzing a historical Codex rollout from some time in the past. Your goal is to use retrospective analysis to tell (a) whether the contemporary Codex rollout successfully completed the primary task of the session to the satisfaction of the user, and (b) whether the user had to intervene to reach the successful outcome, either in this session or in a subsequent one.

To do this, do the following:

1. Identify the primary task of the final selected target window. The target-window manifest lists earlier conversations from the same exported session/date row, including any parallel subagent branches that completed before the target, followed by the selected root-compatible target. Read every listed conversation for context, but select the primary task only from the final entry marked as the target. If the user asks for multiple tasks, select the most important task represented by that target window.

2. Find a clear outcome signal. In descending order of importance (i.e., the most important signals are listed first, and should override any weaker signals):

- User gave direct feedback in this window (e.g., YAY or NAY)

- Find evidence that the results from the task made it to Slack or other durable media <redacted examples>.

- The user built off the results of the task in this window or a followup session. For example:

- <redacted infra details>

- if the user did a data analysis and then asked Codex to post the results on Slack in a subsequent session, this indicates that the task was successfully completed.

- the user asked Codex to do a task in a subsequent session that was clearly dependent on the results of this session (even if they didn’t acknowledge the original task at all, in a positive or a negative way!), this indicates that the task was successfully completed.

- If you can’t find external evidence, you must independently verify the correctness of the answer with an authoritative read-only tool or source. This should be reserved for simple tasks only, such as retrieval/Q&A/self-knowledge questions, NOT for coding, artifact creation, or other long-horizon tasks, since these can often have subtle bugs or revisions that you may be unable to detect.

- The task was continued in a subsequent session and any of the above are true for the subsequent session.

- If you’re unable to confidently verify the outcome, report uncertain or no_clear_goal. Do not guess or assume the outcome without clear evidence or independent verification. If you find a clear outcome signal, report success, tool_errors, or failed. You must research the outcome instead of trusting the original assistant’s self-reported result.

3. Find evidence of whether the user had to manually intervene to complete the current task:

- Whether durable connector evidence available by the cutoff shows that the user had to correct or redo this task. For example, if the code was merged without changes, the user did not intervene. If the code was changed (either in this session or e.g., in the PR), the user intervened.

- Whether or not the user replied to the agent in this window with feedback that the task had to be changed

4. Call report_session_success exactly once to report your output.

- Tools: <redacted tool details>

- Outcome classes:

- Success: The outcome was clearly identified as successful.

- Failed: The outcome was clearly identified as a failure.

- Tool errors: The outcome was a failure BECAUSE tool errors, permission limits, or other system issues prevented the original model from accomplishing the goal in the target window. ONLY system errors in the target window should count here, not misuses of the tool by the original model.

- Uncertain: No clear outcome signal was found, regardless of how many interventions there were.

- No clear goal: There is no clear goal, e.g., no user message or nonsensical user request.

In addition to the grounded outcome class (based on retrospective analysis), please also provide a critic-judged outcome which is your own assessment of how successful the model was based on your own reasoning from reading the transcript and independent verification. This may differ from the grounded outcome class if e.g., finding ground truth verification data was impossible.

Interventions: Report one textual list element for each time the user had to intervene to complete the task. Each element should describe the intervention in a brief sentence. This includes any time the user had to correct or redo the task, either in this session or in a subsequent one. If the user did not have to intervene, report an empty list. Also fill in `intervention_rationale` as a concise explanation of the evidence supporting the list.

Examples of interventions include:

- User posting a followup message that corrects Codex’s implementation

Interventions do NOT include:

- Asking a followup task which is an expansion or continuation of the original tasks

Failures in your own judging tools are not evidence about the target window and must not be classified as Tool errors. If you cannot read the required local evidence file or a judging tool has a fatal infrastructure failure, do not submit a report.

<redacted data analysis details>
```

### 安全限制与 RL 算力分配

使用历史训练记录和每 10 分钟一次的 GPU 分配快照，绘制 2026 年 7 月 15 日至 8 月 15 日的每日 RL 分配量。日期采用 PDT，归一化基准为 7 月 1 日至 8 月 15 日期间的每日峰值分配量，设为 100%。

工作负载的选取与分组方法如下：

- 纳入截至 2026 年 8 月 26 日观察到的健康、长时间运行的 RL 实验。
- 只要训练中涉及的任意模型使用 Astra 级模型，就把该工作负载的全部分配量归入 Astra 级；其他已识别模型归入 Non-Astra。
- 从图表和数值比较中排除无法通过现有实验元数据推断模型类别的工作负载。它们占图示时间窗口内 RL 总分配量的 **4.5%**。
- 所用数据库覆盖绝大多数 RL 工作负载，但不包含部分高度敏感的子项目。我们认为，被排除的项目在图示时间段内没有运行 Astra 工作负载。
- 在每个 10 分钟时间点加总 GPU 分配记录，再对每天的这些小计取平均。缺失观测时间点占该窗口的 **0.59%**，计算时予以排除。
- 周环比采用连续两个 7 天窗口内的快照均值，窗口锚定 7 月 20 日及 8 月 6–7 日公告的确切时间。7 月的基准窗口延伸至图示起点之前，以满足完整 7 天。两个事件日都分别计算指令发出前后的均值，以更清楚地展示影响。

7 月 20 日至 8 月 6 日图示 Astra 算力中的大部分，用于测试安全与安保改进措施的实施情况。

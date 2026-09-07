---
externalId: "research-acceleration-view-inside-openai"
kind: "article"
title: "Research acceleration: The view inside OpenAI"
description: "OpenAI shares internal evidence on coding-agent usage, experiment velocity, task success and human intervention, alongside safety restrictions and the methods used to measure research acceleration."
date: 2026-09-06
sourceUrl: "https://openai.com/index/research-acceleration-view-inside-openai/"
tags: ["OpenAI", "Codex", "AI Research", "Coding Agents", "RSI", "AI Safety"]
featured: true
draft: false
---

[OpenAI original article](https://openai.com/index/research-acceleration-view-inside-openai/) · September 6, 2026

> Reading edition of OpenAI’s article. The first-person voice and findings are OpenAI’s. Charts below are static renders of the source’s published data and chart specifications, with adapted colors and layout. Repeated methods are consolidated in the appendix, and classifier prompts are preserved in English.

For AGI to benefit all of humanity, we believe it must be democratically governed. This can only happen through an informed public debate about the capabilities, risks and safeguards of highly capable AI systems. People everywhere need to understand the likely future trajectory of frontier AI, so they can have a meaningful voice in how it develops.

Transparency about specific risks, incidents and safeguards is necessary, but not sufficient. We believe the public also needs to understand how the most capable systems are developing, and how they are driving research progress, inside of frontier labs.

We aim to safely build an automated AI researcher that can work under human supervision to further progress on deep learning and alignment, enabling iterative improvements. According to our measurements, we have now reached the goal, [announced](https://x.com/sama/status/1983584366547829073?lang=en) last fall, of having an automated research intern by September of this year. By “research intern,” we mean a system that can carry out well-defined research tasks under human direction, including tasks that would take a skilled researcher a few days. We are making strong progress toward creating an automated AI researcher by March of 2028.

Over the course of this year, OpenAI researchers’ daily work has changed substantially. Researchers are using coding agents throughout the day (often in concurrent sessions) and total usage is rapidly increasing, outpacing growth among other OpenAI teams. Researchers are contributing code faster and running more experiments. The ways researchers use agents are changing, too: agents are handling increasingly complex tasks, and succeeding at them more often. AI research is a complex process with many potential bottlenecks, so the overall pace of progress likely won’t keep pace with these specific metrics. But on the whole, these findings are consistent with the broader impression many of us have internally that agentic tools are meaningfully accelerating research progress. People still set our research priorities, judge which ideas and results to pursue, and decide whether to scale, pause, or deploy systems.

If it is done responsibly, we believe automated AI research will yield models that directly enhance human welfare and advance OpenAI’s mission. It can bring down the cost of advanced intelligence so that people worldwide can benefit. We are pursuing this work in part because automated research could help us solve alignment and build defenses against increasingly capable AI. An automated AI researcher can also be an automated safety or alignment researcher. More capable, aligned systems could help secure critical infrastructure, defend against dangerous AI agents, and develop new protective measures.

These are reasons to develop useful automated research capabilities, but they do not mean that rapid RSI is necessarily an outcome we should pursue. Whether and how to proceed must depend on our ability to preserve human control and on informed democratic choices about the benefits and risks.

We do not yet know how to safely get all the way to aligned, full RSI. We are working to scale alignment and safety measures alongside capabilities. But we cannot assume that progress in alignment and safety will keep pace, and more capable systems can become harder to monitor. Careful alignment and safety work is at the center of this effort, and it starts with measuring and mitigating the safety problems we see today in agentic coding systems. Whenever we find that proceeding would pose an unacceptable safety risk, we will respond appropriately including by slowing or stopping our development or deployment of systems we find ourselves unable to sufficiently safeguard.

After the recent Hugging Face incident, we [put this commitment into action](https://openai.com/index/pacing-model-development-cyber-capabilities/), pausing reinforcement learning (RL) training on our latest models intended for deployment while we further hardened and red-teamed our research environments and expanded coverage of our monitoring systems. This did not halt all research: some workloads resumed under stronger controls, while others remained paused. We have raised our safety and alignment standards and moved safety work deeper into the model lifecycle, requiring stronger evidence of aligned behavior throughout all of training.

Today we are providing a detailed snapshot of how agentic systems have contributed to our progress toward RSI in recent months. Agentic systems are new and rapidly changing, and our measurement efforts are still preliminary. By sharing these early results and the methods behind them, we aim to inform the public, encourage a norm of public disclosure, and help the field move toward shared standards of measurement.

Ultimately, as we wrote in our [frontier policy blueprint](https://openai.com/index/frontier-safety-blueprint/), we believe that we and other companies should be required to publicly track our progress toward RSI. Even without such a requirement, we plan to continue being transparent about our RSI progress. We will evolve our transparency approach as our measurement techniques and understanding improve, while balancing the need to protect security and proprietary information.

## 1. Coding agents are reshaping daily work for OpenAI researchers

At the start of this year, the median researcher ranked by agent usage at OpenAI was using coding agents only in modest amounts. By mid-August, the median researcher was integrating agents daily into their work, using more than $600 per day of inference at API prices. The 90th percentile user in our research organization now uses more than $7,000 of tokens per day.

<div class="article-figure-grid">
<div class="article-figure-grid__item">

![Usage of internal coding agents is increasing significantly—Median researcher](/images/highlights/research-acceleration/276xfN35M5ZRRCHqaGoeqc-paired.svg)

</div>
<div class="article-figure-grid__item">

![Usage of internal coding agents is increasing significantly—90th percentile researcher](/images/highlights/research-acceleration/6uxQo7OTnJrk6arDtdYQGt-paired.svg)

</div>
</div>

![Usage growth is faster among researchers than in other parts of the company](/images/highlights/research-acceleration/4yelFztsMmTGSygPES59Mh.svg)

Before June 2026, total agent runtime across the research organization was still below that of total human labor. That has since changed. In terms of a standard 8 hour workday, as of mid-August, in total, the research organization uses 3.1 agent-workdays of effort for every workday of human labor.

![Agentic workdays now far exceed those of human researchers](/images/highlights/research-acceleration/6OZYTVQM8KRYJ1H21oa0V5.svg)

Another way of looking at this is to understand how many researchers use highly concurrent workflows (e.g., running 4 or more agents simultaneously). As shown below, this number is increasing. These figures include the daily peaks of both agents started directly by the user and subagents created downstream from those the user launched directly.

![Researchers are leveraging concurrent workflows more over time](/images/highlights/research-acceleration/G7AW5IjPbFuDiZ6gNmEAL.svg)

## 2. Researchers are writing more code and running more experiments

Much of AI research can be seen as a labor-intensive process with the goal of integrating a new improvement to model intelligence or performance into one of our core models. The process depends on many steps, and capabilities advance when all the steps go right together: Researchers have to design new improvements, write evaluations to judge model performance, write infrastructure to test these improvements at scale, catch bugs as well as unsafe or misaligned behavior during training, and integrate winning ideas into a core training run. A failure at any part of the research process can constrain the entire loop.

Writing code and running experiments are two major activities that researchers do as part of their work, and we see evidence that these processes are accelerating.

![Across the company, engineers are shipping code faster](/images/highlights/research-acceleration/3kKr6oP0sSiYi1Lrja7x2b.svg)

These data points are relatively easy to measure, but can be hard to interpret. As automation progresses, the tasks which are _least_ automatable will take on a larger share of researcher effort and will become the important bottlenecks to future progress. Compute is another gating factor for progress, and may become more important over time as other bottlenecks diminish.

Through 2026, the number of experiments per active experimenter has increased, with August 2026 being an all-time high since tracking began in Jan 2025. This is correlated with increased Codex adoption, though we note that our available compute has also grown significantly since 2025.

![Experiment velocity has increased](/images/highlights/research-acceleration/51uRPX69SaWzZdkUwwCFQF.svg)

## 3. The work researchers use agents for is changing

Both qualitative impressions and internal data indicate that the mix of tasks researchers delegate to coding agents is changing, with delegation of higher level and longer-horizon tasks becoming more common over time.

To get a clearer picture of this trend, we analyzed recent usage in the research organization using a [recently published taxonomy](https://epoch.ai/gradient-updates/toward-an-onet-for-ai-rnd) of the different kinds of work that are part of the AI R&D lifecycle, developed by Epoch AI. This taxonomy, inspired by the longstanding O*NET system for classifying all kinds of work, is specifically tailored to frontier AI R&D, and breaks the process down into six main phases:

1.   Decide: what to work on, what to continue, where to allocate
2.   Design: research ideas and engineering specs
3.   Build: code and datasets
4.   Run: training/eval runs, hardware, serving
5.   Analyze: experiments, models, deployment, external work
6.   Communicate: findings, feedback, status, decisions

Below, we classify coding agent tokens under this taxonomy.

![Researchers are using coding agents in new ways](/images/highlights/research-acceleration/4QLdZ4iw0n4L9rYGTvteZK.svg)

![All categories of research activity have increased since the start of the year](/images/highlights/research-acceleration/1nabj561MakfHpgk8Nau7M.svg)

We see that all categories of research activities have increased between January and August 2026. In January, the dominant category was research and infrastructure code. This category has expanded, but we also see notable increases in additional categories, especially technical help and monitoring runs. High-level planning still remains a minimal fraction of agent output tokens.

Anecdotally, colleagues report that coding agents excel at troubleshooting internal research infrastructure, which addresses one meaningful bottleneck to research progress. Multiple teams which previously held office hours to help researchers troubleshoot their experiments have noted declining attendance in 2026, and one has stopped holding sessions entirely, to focus on making other system improvements instead.

Here, we plot the number of top-level posts per day to one of the main internal channels where researchers seek technical support from other teams. To our knowledge, the channel’s decrease in activity has not been offset by queries shifting to another technical support channel run by humans. The decline in traffic aligns with this broader shift.

![Certain forms of troubleshooting are increasingly handled by agents](/images/highlights/research-acceleration/5i5c3kCvvooZXryxTLJKYB.svg)

We can also study whether coding agents are succeeding at the tasks researchers request. Using an agentic classifier, we find that from January to July, success rates generally increased across several difficulty buckets (proxied as the estimated time a human would take to complete the task) on tasks we can find a ground truth outcome for. However, agents still require significant human steering to be successful, especially as task complexity rises. In the last 6 months, over half of successful 4-8 hour tasks involved 1 or more interventions.

![Agents are increasingly solving more complex tasks for researchers](/images/highlights/research-acceleration/4J4gOOZPIhRvVC5oniqDDG.svg)

Success rates on researcher tasks have increased over time. Graph excludes classifications where the outcome was uncertain and points with <50 sessions or <50 unique users.

![Longer tasks need more interventions](/images/highlights/research-acceleration/1Jc716VU2pvzYGuQUBvYTa.svg)

Task success and intervention rate from Jan to July, broken out by time horizon. Excludes classifications where the outcome was uncertain.

## 4. Pacing model development

Progress toward more capable systems for safe and beneficial AGI will also depend on the safeguards needed for such work. Our assessment of the needed safeguards may change as we learn more about the risks.

[As we have described,](https://openai.com/index/pacing-model-development-cyber-capabilities/) we have recently updated our standards for monitoring, alignment, and security. Here, we show how recent restrictions have affected one aspect of research activity.

![Changes in RL compute in response to safety-related restrictions](/images/highlights/research-acceleration/2gqOfIvKUYrL6COO2IImIV.svg)

The majority of Astra compute shown here between July 20 and August 6 was intended to test the implementation of safety and security improvements.

On July 20, following the discovery that agents had compromised our research infrastructure, we temporarily shut down the container service used for training, and then restored it with significant additional restrictions.

This led to a sharp decline in RL training compute while teams reconfigured their workflows to operate within the hardened research environment. The plot above includes the two week pause in reinforcement learning on our latest models intended for deployment. Astra-class RL experiments between July 20 and August 6 include a majority of runs (by GPU allocation) intended to test the implementation of safety and security improvements.

On August 7, preliminary evidence that Astra [may have critical cyber capabilities](https://openai.com/index/responding-next-frontier-critical-cyber-capabilities/) under our [Preparedness Framework](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf) led to additional model-specific security restrictions which required the Astra model to be run in higher security research environments. In the following week, Astra-class GPU allocation fell a further 59.2 percent, but allocation to other model classes rose 17.2 percent. That increase offset about 85 percent of the Astra-class decline, leaving total allocation in the analyzed RL workloads largely unchanged. This pattern is consistent with substitution of some training and experimentation to non-Astra models while work involving Astra was restricted, and comports with anecdotal reports of researchers finding other uses for compute that could no longer be leveraged for workloads covered by the new constraints.

This data provides a useful signal for ongoing conversations about training and safety: When new controls are introduced, compute remains valuable and flexible, and will naturally be channeled into alternative uses within the research enterprise. Longer term, discussions about the pace of AI progress should also extend to the question of how compute that is subject to new or proposed controls can best be used.

## 5. The path ahead

Making and understanding progress toward aligned RSI is important for our mission. We will continue to refine our methods, report on our evolving understanding, and work toward an informed public debate and meaningful democratic governance of frontier systems.

## Appendix: Our methods for this post

Agent-powered AI research is still new, and we are still learning how to measure it. Some indicators, such as the amount of code our research teams generate, are relatively easy to gather, but hard to interpret because their relationship to research progress is uncertain. Metrics that focus more directly on research progress—such as how often agents succeed at the tasks researchers give them—could be more useful, but are complex to develop and validate. Furthering the difficulty, the tools and systems researchers rely on are evolving rapidly. Deepening our understanding of research acceleration is a significant focus area across OpenAI.

Across these analyses, unless otherwise noted:

*   “Researcher” is a broad term for any member of our research organization, including some who build research infrastructure, manage research projects, or otherwise support the enterprise.
*   Metrics of coding agent use cover most, but not all, usage given rapid evolution in the tools and systems researchers rely on.

### Usage of internal coding agents is increasing significantly

- We calculate the median and 90th-percentile usage across researchers each day, then average those daily values within each week from Monday–Sunday. We exclude company-wide holidays.
- We include traffic sent by Research employees. We include a set of product surfaces generally corresponding to interactive usage (e.g., excluding programmatic automations such as codex exec).
- Internal or pre-deployment models are mapped to the price of their nearest production counterpart—generally the final checkpoint that was released.
- For cost, we use retail API prices at the processing tier most similar to the internal deployment. All prices are as of September 3, 2026.

### Usage growth is faster among researchers than in other parts of the company

Output tokens combine each employee’s ChatGPT and Codex output. Company holidays are excluded, and totals are rescaled to a 28-day equivalent. Output tokens include hidden reasoning tokens and tokens used for visible responses, code, and tool calls. Daily department values are the median across all active regular employees—including employees with zero usage—and are shown relative to that department’s median on November 1, 2025. We include a set of product surfaces generally corresponding to interactive usage (e.g., excluding programmatic automations such as codex exec).

### Agentic workdays now far exceed those of human researchers

Total agent runtime is summed across all qualifying agents (see definition below) and converted at a rate of eight hours per workday. Total wall-clock estimates of turn-length are approximated using server connection events and client telemetry logging. We apply a variety of heuristics to account for long-running inactive turns. If more than 30 minutes pass between two server events in the same turn, this intermediate time span is not considered active and does not count as part of agentic worktime. The number of researcher workdays is calculated simply as eight hours per employee in the research organization on each calendar day for scale consistency. Plots show a 28-day lagging average, excluding company holidays.

We include a set of product surfaces generally corresponding to interactive usage (e.g., excluding programmatic automations such as codex exec). For example, we exclude agentic threads spun up for: codex exec, title generation, background tasks for memory consolidation, workspace agents, internal eval traffic, and known test traffic. We include subagents and count them as separate agents from their parent agents, and include threads spun up automatically to review agent behavior in “auto-review” mode.

### Researchers are leveraging concurrent workflows more over time

The line shows the share of research headcount (including managers and employees who are out of office) which had 4 or more concurrent agents running at any point in the last seven days (holidays excluded). Days are normalized to PDT. Agentic turns are labelled concurrent if they overlap for more than 30 seconds. If more than 30 minutes pass between two server events in the same turn, this intermediate time span is not considered active (and does not count in peak concurrency). Plots exclude company holidays.

We include a set of product surfaces generally corresponding to interactive usage (e.g., excluding programmatic automations such as codex exec). For example, we exclude agentic threads spun up for: codex exec, title generation, background tasks for memory consolidation, workspace agents, internal eval traffic, and known test traffic. We include subagents and count them as separate agents from their parent agents, and include threads spun up automatically to review agent behavior in “auto-review” mode.

### Across the company, engineers are shipping code faster

Every day, for each non-automated commit in our codebase, we sum the added + deleted lines of code (LoC) and divide by the number of active contributors (where active is defined as all distinct contributors who have committed in the last 12 months), with each commit capped at p99 per-commit LoC. We plot quarterly averages. Multipliers are based on the pre-2025 average. The hatched bar for Q3 2026 represents partial quarter data through August 15, 2026. In this static edition, the partial quarter is shown in a lighter color.

### Experiment velocity has increased

We use experiments from [Neptune](https://openai.com/index/openai-to-acquire-neptune/), an experiment tracker commonly used at OpenAI. We clean the data in a few ways:

- Exclude evals and automated runs (such as programmatic tests)
- Cap each owner namespace’s contribution at 100 experiments per day, to limit the effect of individuals submitting extremely large sweeps


Then, we compute the number of experiments per week, divided by the number of experimenters in that week. This is a measure of conditional intensity: of the researchers who ran an experiment in that week, how many did they run? We use conditional intensity because not all researchers routinely run experiments (for example, many employees in the research cohort work on systems optimization or data collection), which means the fraction of active experimenters may change over time. We plot a four-week trailing average of the weekly experiments-per-active-experimenter ratio.

This plot does not control for:

- Compute growth over time, which may contribute to an increase in experiment velocity
- Effects from the usage of conditional intensity, like perceived increases in experiment velocity from low-volume experimenters who stop running experiments entirely

### Researchers are using coding agents in new ways

We randomly sample 2% of internal coding sessions from active research employees, then extrapolate the full token count from that number.

To limit the influence of high-volume users, we cap each user’s daily output-token total across the included R&D categories at the 95th percentile among sampled users with nonzero totals that day. For users above the cap, we reduce their category totals proportionally, preserving each category’s share.

The taxonomy is taken directly from a [taxonomy](https://docs.google.com/document/d/1mDZyulXNojM5uAna-HzSeAEnE0tUNqNOTmBCfPx_M78/edit?tab=t.1vmae3wc1s25#heading=h.7wvqnm3lxi7x) proposed by Epoch AI with one modification—we add a “labeling/grading category” which is later removed from analysis. We exclude this to avoid skewing the data due to bursty high-volume grading activity which does not reflect normal research trends. We also do not plot the “Other/no matching R&D task” category.

The stacked plot is smoothed with a 14-day trailing average. The change plot compares average daily values for Aug 1-15 with January 20-31.

We classify by prompting GPT‑5.6 Sol with medium reasoning with this prompt:


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

The taxonomy used is [taken from Epoch AI verbatim](https://docs.google.com/document/d/1mDZyulXNojM5uAna-HzSeAEnE0tUNqNOTmBCfPx_M78/edit?tab=t.1vmae3wc1s25#heading=h.7wvqnm3lxi7x), except with one additional taxonomy item:


```text
Label or grade agent rollouts

- Example: Apply a user-given rubric on an agent trajectory and report scores.
```

### Certain forms of research troubleshooting are increasingly handled by agents

Data comes from the primary internal support channel used by the reasoning team. The reported numbers are smoothed by excluding company holidays and plotting a 14-day running average. The true decrease in support requests is likely even more dramatic than apparent from this plot—research headcount on the relevant teams increased throughout this period, and over time the distribution of queries in the channel has shifted from overwhelmingly support queries to mostly PR review requests.

### Agents are increasingly solving more complex tasks for researchers

Our goal with this metric is to quantify how often internal coding agents successfully solve tasks, given a limited human budget to steer the model. This is challenging, since simple classifiers (e.g., classifying success from the model’s outputs alone) cannot effectively measure success, and miss human interventions: e.g., if the model falsely claims success, PRs have follow-up comments, or the user requests changes in a followup session.

To measure outcome as well as human interventions, we designed an agentic classifier using 5.6 Sol that reads a researcher’s historical session in the context of past and future rollouts, determines the primary task of the session, and uses internal data sources such as Slack channels, documents, and PRs to determine post-hoc whether the task succeeded as well as how many human interventions were required. We find this classifier agrees with human judgement on an n=25 manually labeled set of tasks.

Another concern: interpreting task success over the distribution of internal usage is challenging because the distribution shifts as models/scaffolds improve and users gain more experience. As a partial control for this, we use 5.6 Sol to label each task with a human-equivalent time estimate and plot task success within each bucket.

Additional details:

- We randomly sample 2% of conversations from January 1, 2026 to July 31, 2026.
- We filter for interactive sessions from internal coding agents in Research.
- We filter out automations, memory updates, title generation, and ambient suggestions.
- For the primary plots, we exclude the Uncertain classification type—essentially meaning that the graph shows task success on the distribution of tasks we are able to find a ground truth outcome for. However, even if Uncertain tasks are pessimistically considered failures, our finding that later months outperform earlier ones still holds. There remains some residual risk that the true success rate on uncertain tasks is changing month-to-month, but our current classifier cannot distinguish this. Anecdotally, we find Uncertain tasks often look like eval questions (which are fully isolated and don’t relate to a larger project, so determining the outcome is challenging) or are subparts of custom agentic pipelines.
- Classifier schema:
  - Primary task
  - Outcome: Success | Failure | Tool errors | Uncertain | No clear goal
  - Number of interventions
- We reweight sessions such that all users have equal weight, to diminish the effect of specific users launching extremely large numbers of sessions.


The classifier prompt is provided below, with some internal details redacted.

To measure the estimated time for a human, we use a GPT‑5.6 Sol classifier on medium reasoning with a prompt similar to our recent post, [The Shift to Agentic AI: Evidence from Codex](https://cdn.openai.com/pdf/5d1e1489-21c0-43e4-9d42-f87efdbf0082/the-shift-to-agentic-ai-evidence-from-codex.pdf). To evaluate our classifier, as in the post above, we analyze its correlation to Codeforces solve times:

![Primary-task time-horizon estimator validation: Pearson correlation 0.85](/images/highlights/research-acceleration/task-horizon-validation.svg)

On Codeforces problems, we find the classifier predicts relative task difficulty well, but predicts conservative estimates generally higher than top 5 solve times.


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

### Changes in RL compute in response to safety-related restrictions

We use historical training records and ten-minute GPU allocation snapshots to plot daily RL allocation from July 15 through August 15, 2026. Dates are in PDT. The plot is normalized such that the daily peak allocation between July 1-Aug 15 equals 100%.

We select and group workloads as follows:

- We include healthy, long-running RL experiments observed through August 26, 2026.
- We assign a workload’s entire allocation to Astra-class if any model involved in training uses an Astra-class model. Other identified models are grouped as Non-Astra.
- We exclude workloads whose model classes could not be inferred from existing experiment metadata from both the figure and the numerical comparisons. These account for 4.5% of the total RL allocation over the figure window.
- We use a database which represents the vast majority of RL workloads, but excludes some highly-sensitive subprojects. We do not believe any excluded projects operated Astra workloads during the displayed time interval.


We sum records of GPU allocation at 10 minute intervals and average those subtotals within each day. Missing observation timestamps, which comprise 0.59% of the window, are omitted.

Week-over-week comparisons use snapshot means in consecutive seven-day windows anchored to the exact times of the July 20 announcement and the August 6-7 announcement. July’s baseline extends before the figure’s start to satisfy the 7-day window. Both event days use separate pre- and post-instruction means for better clarity of their effects.

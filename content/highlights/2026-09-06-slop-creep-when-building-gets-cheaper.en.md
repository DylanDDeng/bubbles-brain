---
externalId: "slop-creep-when-building-gets-cheaper"
kind: "article"
title: "When Building Gets Cheaper Than Thinking: The Cost of System Sprawl"
description: "A reading of Brandon Sovran's Slop-Creep: cheaper implementation makes unnecessary systems easier to accumulate, putting more weight on demand, ownership, and long-term value."
date: 2026-09-06
sourceUrl: "https://awaitinginput.substack.com/p/slop-creep-when-building-gets-cheaper"
tags: ["AI", "Coding Agents", "Software Engineering", "Product Thinking", "Technical Debt"]
featured: true
draft: false
articleIntro:
  author: "Brandon Sovran"
  sourceName: "Awaiting Input"
  note: "An editorial reading of the article's main arguments. The final section contains our own practical takeaways."
---

Producing working software is getting easier. Deciding whether it deserves to exist still requires judgment. Brandon Sovran calls the gradual accumulation of insufficiently justified features, abstractions, and infrastructure **slop-creep**: agents make implementation cheap enough for additions to outpace scrutiny.

The article brings a useful question to AI-assisted development: what responsibilities remain after delivery?

## Lower implementation costs raise the value of demand validation

Sovran recognizes the benefits of cheap experiments that can be shut down. The danger is treating a completed product as evidence that its underlying need was understood.

His experience building a CRM for tattoo artists illustrates the gap. Engineering was manageable; fitting the product into customers' actual habits was harder. Faster delivery alone cannot establish demand.

The article also cites a Microsoft Research and Carnegie Mellon study involving **319 knowledge workers and 936 examples of generative AI use**. Higher confidence in AI was associated with less self-reported critical-thinking effort. That is a survey association, which does not establish that AI inevitably reduces thinking ability.

## Organizational software accumulates dependencies

Sovran focuses on software that becomes embedded in an organization. Each additional service or workflow may look inexpensive in isolation. Once colleagues rely on it, maintenance becomes an obligation.

His illustrative finance-automation scenario shows an employee taking on more work with agents. A successor can inherit the scripts, pipelines, and delivery expectations without enough understanding to maintain them. Local productivity gains can therefore create a longer-term handover burden.

This is a risk scenario proposed by the author, rather than empirical evidence about every automation project. Its useful implication is to include staff turnover and changing business requirements when estimating value.

## Keep judgment in the loop

The article uses “meat proxy” for someone who passes along AI output without checking or understanding it. When that behavior reaches design and review, human participation can exist without meaningful scrutiny.

Sovran advocates rewarding lasting business value, developing an independent design, and obtaining thoughtful human feedback before asking agents to refine it. Someone must still be able to explain the goal and the tradeoffs.

## Our takeaway: give new systems an exit plan

Our practical extension is to ask three questions before adopting another automation:

- **What establishes demand?** Record the user's difficulty and the limits of existing tools.
- **Can someone else take over?** Keep ownership, implementation, and result checks explicit and traceable.
- **When can it be removed?** Define retirement conditions and revisit whether it still delivers value.

Cheaper construction gives teams room to invest more effort in selection: bringing useful systems into existence quickly and retiring those that have outlived their purpose.

Research cited by the original: [The Impact of Generative AI on Critical Thinking](https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/). Term reference: [Niklas Gruhn on meat proxies](https://gruhn.me/blog/2026-08-03/).

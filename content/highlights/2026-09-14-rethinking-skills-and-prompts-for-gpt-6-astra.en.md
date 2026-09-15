---
externalId: "rethinking-skills-and-prompts-for-gpt-6-astra"
kind: "article"
title: "Rethinking Skills and Prompts for GPT-6 Astra"
description: "Revisit skill descriptions, AGENTS.md, and task prompts to avoid bloated context, clarify decision boundaries, and help GPT-6 Astra carry tasks through to completion."
date: 2026-09-14
sourceUrl: "https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra"
tags: ["OpenAI", "GPT-6 Astra", "Codex", "Skills", "Prompt Engineering", "AGENTS.md"]
featured: true
draft: false
articleIntro:
  sourceName: "OpenAI Developers"
  note: "OpenAI official blog post, reproduced in full."
---

Coding agents have come a long way, and best practices are changing fast. With more capable models, what used to require a lot of handholding and scaffolding no longer does.

If you’ve been using agents like Codex for your projects over the last year, you’ve likely accumulated a lot of instructions as you worked to steer the models toward good outcomes. With each release, it’s been worth revisiting those assumptions, but with GPT-6 Astra, it’s more important than ever.

These instructions can take many forms: skills, `AGENTS.md`, and your task prompts are all shaping how the model gets work done.

## Better skills

These instructions can be in the form of skills, which are essentially prompts stored as Markdown files that can also be packaged with resources and bundled scripts. Generally, they are most useful for guidance around a specific workflow, or when using certain apps.

People now default to packaging a lot of skills into their projects, and each skill comes with a name and description that are loaded into the model’s context so it knows when to use them. But many descriptions are far too long, and when you add too many skills, Codex starts shortening their descriptions to fit. The model ends up seeing less of each description, making it harder to know which skill to pick.

What’s worse is that descriptions can often contradict each other or over-emphasize when skills should be used, leading the model to load instructions that don’t actually help the task.

A common workflow to create skills is to use the `$skill-creator` skill. We recently updated its guidance to help mitigate many of the failure modes we’ve seen in practice.

First, skill descriptions should be as short as possible while making it clear when the model should use them:

### Be clear about when it applies

**Bad**

> Create and validate Postgres schema migrations. Use when working with databases, queries, models, or persistence.

**Good**

> Create and validate Postgres schema migrations. Use when adding or changing a migration, or reviewing its rollout.

*Here, the bad skill description can push the model to use it anytime it touches anything related to a database, rather than only when it has to handle a migration.*

Second, one of the key markers of a useful skill is progressive disclosure. Reading a skill takes up context, bringing you closer to compaction and introducing guidance that may not apply to the task. For skills with multiple workflows, make the root document a minimal router that points to supporting docs and scripts. Give the model enough guidance to know where to look without forcing it to read things that don’t matter in the moment.

Third, many skills were written as elaborate itineraries or recipes. Models have gotten much better at understanding nuance and ambiguity, so overly specific guidance can now hinder results where it previously helped.

Repository skills also guide other contributors’ agents, which may use different models. Guidance that helps Sol or Luna may overconstrain GPT-6 Astra, so consider which models will use the instructions you leave behind.

## Up-to-date AGENTS.md

Because [`AGENTS.md`](https://agents.md/) applies whenever the model works in your repository, you should frequently revisit each instruction and ask yourself whether it’s still needed.

Requiring a stack of docs or a full repo map before every edit is excessive for a typo fix. GPT-6 Astra can work out what it needs to read without being pushed to review the whole project before every change.

### Read what the task needs

**Bad**

> Before every edit, read architecture.md, database.md, and deployment.md.

**Good**

> Use architecture.md for service boundaries, database.md for schema changes, and deployment.md when preparing a deployment.

*Prompting the model to read files before every edit is a great way to burn context and slow work down. Pointing to some docs can still be helpful, however, so long as it is contextual. Be sure to keep your docs updated too!*

Previous models needed encouragement to run tests and check their work. GPT-6 Astra does that on its own, so the same instructions can lead to unnecessary testing.

GPT-6 Astra is thorough, but it can be more tentative about how far to take a task. Sometimes it needs a little push to keep going. You can use `AGENTS.md` to give it permission for a specific workflow you know is safe, such as a local test suite:

> The local tests use disposable fixtures and have no production access. Run them, fix failures caused by the requested change, and rerun affected tests without asking for approval at each step.

## Decision boundaries

Pay careful attention to how you describe boundaries. If a previous model did things on your behalf without permission, you may have added strong language to make it ask first. That can be useful, but GPT-6 Astra, as our most aligned model, has much better judgment and will not perform tasks unless it knows it is safe – so you should treat it as such.

If you stated boundaries previously because you wanted to prevent other models from going too far and you’re now switching to GPT-6 Astra, consider updating that language: Astra could take it too seriously and may stop work where you’d actually be happy for it to continue.

## Persistence

If you’re used to GPT-5.6 Sol taking a request and continuing for long stretches, GPT-6 Astra can feel more tentative about when to stop. It may reach a first implementation and come back for your review while there’s still work to do.

This is where it helps to define completion before starting. You might need to push Astra to continue until it’s fully done. If the task includes getting the implementation running, inspecting the result, and fixing what fails, make that part of the request. A requirement to stop for review after the first implementation will pull the model toward an earlier stopping point, so check whether that’s a decision you actually need to make.

If you want it to keep exploring beyond a first pass, say what you want explored and where it should stop.

A new model is a good opportunity to clean your house, but you don’t need to review everything manually: ask GPT-6 Astra to do an audit based on what was discussed in this article, then go build something you wouldn’t have attempted before!

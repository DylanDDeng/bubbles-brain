# Model brand icons

Reused SVG artwork, kept unchanged from existing local projects:

- `openai.svg`, `gemini.svg`, `deepseek.svg`, `grok.svg`, `moonshot.svg`, `zhipu.svg`: Aegis (`coworker/src/ui/assets/`; the Gemini, DeepSeek and Zhipu originals have a `-color` suffix).
- `claude.svg`, `qwen.svg`, `meta.svg`: Refly (`packages/ai-workspace-common/src/assets/`).

These are brand identifiers, not newly drawn artwork. Keep their original SVG paths, colors and embedded titles. They are bundled locally to avoid a runtime CDN dependency. Benchmark tables use decorative empty-alt images because the model and creator names are already visible alongside them.

Finance Agent additions: `minimax.svg` and `xiaomi.svg` are reused from Aegis; `mistral.svg` from Refly; `nvidia.svg` from the local FixIt Simple Icons set. `thinking-machines.svg`, `ant.svg`, `poolside.svg` and `inception.svg` are the unchanged brand SVGs served by Vals AI at `https://www.vals.ai/model_providers/icons/{Thinking%20Machines,Ant%20Group,Poolside,Inception}.svg`.

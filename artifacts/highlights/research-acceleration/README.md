# Research acceleration chart provenance

Source: https://openai.com/index/research-acceleration-view-inside-openai/
Published and retrieved: September 6, 2026.

The 13 assets named with Contentful chart IDs are static SVG renders of the
Vega-Lite specifications and datasets embedded in the source page. Each ID is
also the original page's `#chart-<ID>` anchor. Values, filtering, transforms,
scales, grouping, and uncertainty intervals are preserved. Presentation changes:
720 × 360 plot area (340 × 270 for the paired median and P90 charts),
Arial labels, blue-based colors, static legends,
adapted line breaks, and solid shades in place of site-specific pattern tokens.
The original site's doubled dollar tooltip format is normalized for Vega-Lite.
Chart titles appear as article figure captions. Interactive filters use their
original defaults; the opening source link leads to the original article.

`task-horizon-validation.svg` is the unmodified original validation figure:
https://images.ctfassets.net/kftzwdyauwt9/5YO4FrQCz2YGM9YwPofZrJ/0b613d63193a0d8df8e555cbad36718d/desktop-light__1_.svg

Original data and content: OpenAI. The charts represent OpenAI's own measurements,
not independently replicated results.

Reproduction: install `vl-convert-python` in an isolated Python environment, then
run `render-charts.py`. `source-charts.json.gz` contains the unmodified chart
specifications and datasets extracted from the source page.

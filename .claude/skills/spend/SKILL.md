---
name: spend
description: Show the over-usage dollar spend of Claude Code usage in this project — per model (Fable/Opus/Sonnet), today, last 7 days, and all time. Dollars only, no token counts. Use when the user asks how much they've spent / what this session cost (/spend). Note the built-in /cost is Claude Code's own report; this skill prices real transcript usage per model.
---

# /spend — over-usage dollar report

Run the bundled script from the project root (it locates this project's transcripts from cwd):

```bash
node "<this skill's base directory>/calculate-spend.mjs"
```

The script sums every recorded API request in `~/.claude/projects/<this project>/` (including subagent/workflow transcripts), dedupes repeated usage blocks, and prices them per model at current API rates (Fable $10/$50 per MTok, Opus $5/$25, Sonnet $3/$15, Haiku $1/$5; cache read 0.1×, cache write 1.25×/2×). It reports **dollars only** — per model × Today / Last 7 days / All time.

Then present the output to the user:

1. Reformat as a compact markdown table of dollar amounts (Model | Today | Last 7d | All time). Do NOT add token counts, request counts, or cache statistics — dollars only.
2. Keep the **Today / Last 7 days / All time** totals line prominent.
3. Always include the caveat: these are the dollars **over-usage (extra usage) would bill** at API rates — within a Pro/Max subscription's included quota nothing is actually charged.
4. If the script prints "No transcripts found", say so and suggest checking that the command is being run from the project root.

If pricing for a new model tier is missing (script falls back to Opus rates), update the `PRICES` table at the top of `calculate-spend.mjs`.

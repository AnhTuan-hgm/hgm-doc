#!/usr/bin/env node
/**
 * Estimates API-equivalent spend for this project's Claude Code usage by summing
 * the per-request `usage` blocks recorded in the transcript JSONL files under
 * ~/.claude/projects/<project>/ (includes subagent/workflow transcripts).
 *
 * Pricing ($/MTok): input, output; cache read = 0.1x input; cache write = 1.25x
 * input (5m TTL) or 2x (1h TTL, when the transcript breaks it out).
 * Note: on a Pro/Max subscription these dollars are notional (quota), not billed.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const PRICES = [
    { match: /fable|mythos/i, label: "Fable 5", in: 10, out: 50 },
    { match: /opus/i, label: "Opus", in: 5, out: 25 },
    { match: /sonnet/i, label: "Sonnet", in: 3, out: 15 },
    { match: /haiku/i, label: "Haiku", in: 1, out: 5 },
];
const priceFor = (model) => PRICES.find((p) => p.match.test(model)) ?? { label: model, in: 5, out: 25 };

// Claude Code sanitizes the project cwd into a directory name by replacing every
// non-alphanumeric UTF-16 code unit with "-" (emoji become two dashes).
const projectDir = join(homedir(), ".claude", "projects", process.cwd().replace(/[^a-zA-Z0-9]/g, "-"));

function collectJsonl(dir, out = []) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
    for (const e of entries) {
        const p = join(dir, e.name);
        if (e.isDirectory()) collectJsonl(p, out);
        else if (e.name.endsWith(".jsonl")) out.push(p);
    }
    return out;
}

const files = collectJsonl(projectDir);
if (files.length === 0) {
    console.log(`No transcripts found under ${projectDir}`);
    process.exit(0);
}

// Dedupe by API message id — a message's usage block is repeated on every
// content-block line of the same assistant message.
const seen = new Map(); // message.id -> { model, usage, ts }
for (const file of files) {
    let text;
    try { text = readFileSync(file, "utf8"); } catch { continue; }
    for (const line of text.split("\n")) {
        if (!line.includes('"usage"')) continue;
        let obj;
        try { obj = JSON.parse(line); } catch { continue; }
        const msg = obj?.message;
        if (obj?.type !== "assistant" || !msg?.usage || !msg?.model || msg.model === "<synthetic>") continue;
        const id = msg.id || obj.uuid;
        const prev = seen.get(id);
        if (!prev || (msg.usage.output_tokens ?? 0) > (prev.usage.output_tokens ?? 0)) {
            seen.set(id, { model: msg.model, usage: msg.usage, ts: obj.timestamp ? Date.parse(obj.timestamp) : 0 });
        }
    }
}

function costOf({ model, usage }) {
    const p = priceFor(model);
    const inTok = usage.input_tokens ?? 0;
    const outTok = usage.output_tokens ?? 0;
    const cacheRead = usage.cache_read_input_tokens ?? 0;
    // Prefer the TTL breakdown when present (1h writes cost 2x, 5m writes 1.25x).
    const cc = usage.cache_creation;
    const write5m = cc?.ephemeral_5m_input_tokens ?? (cc ? 0 : (usage.cache_creation_input_tokens ?? 0));
    const write1h = cc?.ephemeral_1h_input_tokens ?? 0;
    const cost =
        (inTok * p.in + outTok * p.out + cacheRead * p.in * 0.1 + write5m * p.in * 1.25 + write1h * p.in * 2) / 1e6;
    return { label: p.label, cost };
}

const byModel = new Map();
let today = 0, week = 0, total = 0;
const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;

for (const entry of seen.values()) {
    const c = costOf(entry);
    const m = byModel.get(c.label) ?? { cost: 0, today: 0, week: 0 };
    m.cost += c.cost;
    if (entry.ts >= startOfToday.getTime()) m.today += c.cost;
    if (entry.ts >= weekAgo) m.week += c.cost;
    byModel.set(c.label, m);
    total += c.cost;
    if (entry.ts >= startOfToday.getTime()) today += c.cost;
    if (entry.ts >= weekAgo) week += c.cost;
}

const fmtUsd = (n) => "$" + n.toFixed(2);

console.log(`Dollar spend (API-equivalent) — ${process.cwd().split("/").pop()}`);
console.log("");
console.log("Model    | Today  | Last 7d | All time");
console.log("---------|--------|---------|---------");
for (const [label, m] of [...byModel.entries()].sort((a, b) => b[1].cost - a[1].cost)) {
    console.log(`${label.padEnd(8)} | ${fmtUsd(m.today).padEnd(6)} | ${fmtUsd(m.week).padEnd(7)} | ${fmtUsd(m.cost)}`);
}
console.log("");
console.log(`Today: ${fmtUsd(today)}   Last 7 days: ${fmtUsd(week)}   All time: ${fmtUsd(total)}`);
console.log("");
console.log("Note: these dollars are what over-usage (extra usage) would bill at API rates; within Pro/Max quota nothing is charged.");

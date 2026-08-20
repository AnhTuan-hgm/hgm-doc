/**
 * Self-check for mergeFoundationDraft — the one guarantee the Draft button rests on:
 * a drafted Master Brand Document can ADD to what's there and can never change or erase it.
 *
 * There is no test runner in this project and adding one is a bigger decision than this
 * feature, so this is a plain assert script with no framework. Nothing imports it, so it
 * costs nothing at runtime; `tsc -b` still type-checks it because it lives under src/.
 *
 * Run it (no test runner and no new dependency — tsc is already here):
 *   npx tsc src/pages/client/dashboard/dashboard-model.check.ts \
 *     src/pages/client/dashboard/dashboard-model.ts \
 *     --outDir /tmp/hgm-check --module commonjs --moduleResolution node \
 *     --target es2022 --skipLibCheck --esModuleInterop --types node \
 *   ; node /tmp/hgm-check/dashboard-model.check.js
 *
 * The compile prints one TS2307 for the aliased `@/lib/supabase` type import, which tsc
 * can't resolve without the project's paths config. It is type-only and erased, so the
 * emitted JavaScript is complete and runs — ignore that one line.
 */
import assert from "node:assert/strict";

import { DEFAULT_FOUNDATION, type Foundation, mergeFoundationDraft } from "./dashboard-model";

const base = (over: Partial<Foundation> = {}): Foundation => ({ ...DEFAULT_FOUNDATION, ...over });

/* 1. An empty field takes the draft. */
{
    const patch = mergeFoundationDraft(base(), { hosts: "Two sisters who inherited the lodge." });
    assert.equal(patch.hosts, "Two sisters who inherited the lodge.");
}

/* 2. A field a person wrote is NEVER touched — the whole point. */
{
    const patch = mergeFoundationDraft(base({ hosts: "AM's own careful wording." }), { hosts: "Model's version." });
    assert.equal(patch.hosts, undefined, "a filled field must not appear in the patch at all");
}

/* 3. Whitespace is not content: a box holding only spaces still counts as empty. */
{
    const patch = mergeFoundationDraft(base({ uvp: "   " }), { uvp: "Ski-in, ski-out with a private gondola." });
    assert.equal(patch.uvp, "Ski-in, ski-out with a private gondola.");
}

/* 4. A blank draft value never blanks an existing field, and never lands as an empty string. */
{
    const patch = mergeFoundationDraft(base({ brandVoice: "Warm, dry, never twee." }), { brandVoice: "" });
    assert.equal(patch.brandVoice, undefined);
    const fresh = mergeFoundationDraft(base(), { brandVoice: "   " });
    assert.equal(fresh.brandVoice, undefined, "an all-whitespace draft value is not content");
}

/* 5. Row lists keep what a person filled, drop empty scaffolding rows, and dedupe. */
{
    const current = base({
        restaurants: [
            { id: "a", name: "Joe's Diner", description: "Best pie in the valley." },
            { id: "b", name: "", description: "" },
            { id: "c", name: "", description: "" },
        ],
    });
    const patch = mergeFoundationDraft(current, {
        restaurants: [
            { name: "Joe's Diner", description: "A model's rewrite that must lose." },
            { name: "Pine & Ash", description: "Wood-fired, book ahead." },
        ],
    });
    const rows = patch.restaurants!;
    assert.equal(rows.length, 2, "one kept row plus one genuinely new row");
    assert.equal(rows[0].name, "Joe's Diner");
    assert.equal(rows[0].description, "Best pie in the valley.", "the AM's description survives the draft");
    assert.equal(rows[1].name, "Pine & Ash");
    assert.ok(rows[1].id && rows[1].id !== "b", "a drafted row gets its own id");
}

/* 6. Re-running a draft over its own output changes nothing. This is what makes the button
      safe to press twice, which an AM will do. */
{
    const drafted = { hosts: "Two sisters who inherited the lodge.", uvp: "Ski-in, ski-out." };
    const first = mergeFoundationDraft(base(), drafted);
    const settled = base(first);
    const second = mergeFoundationDraft(settled, drafted);
    assert.deepEqual(second, {}, "a second identical run must be a complete no-op");
}

/* 7. Personas: the scaffolding pair a new client starts with is empty, so a draft fills it;
      a persona someone has named is kept and not duplicated. */
{
    const patch = mergeFoundationDraft(base({ personas: [] }), {
        personas: [
            { name: "Weekend Recharger", rank: "Primary", summary: "Drives up Friday night.", keywords: ["ski weekend", "hot tub cabin"] },
            { name: "Multi-Gen Organiser", rank: "Secondary", summary: "Books for nine people." },
        ],
    });
    assert.equal(patch.personas!.length, 2);
    assert.equal(patch.personas![0].rank, "Primary");
    assert.deepEqual(patch.personas![0].keywords, ["ski weekend", "hot tub cabin"]);
    assert.equal(patch.personas![1].keywords.length, 0, "a persona with no keywords gets an empty array, not undefined");

    const kept = mergeFoundationDraft(base({ personas: [{ ...patch.personas![0], summary: "Hand-written summary." }] }), {
        personas: [{ name: "Weekend Recharger", rank: "Primary", summary: "Model rewrite." }],
    });
    assert.equal(kept.personas, undefined, "nothing new to add means no patch for that list");
}

/* 8. Taglines are all-or-nothing: one the AM wrote keeps the model out of the list. */
{
    assert.deepEqual(mergeFoundationDraft(base({ taglines: [] }), { taglines: ["Above the tree line", "", "  "] }).taglines, ["Above the tree line"]);
    assert.equal(mergeFoundationDraft(base({ taglines: ["Ours"] }), { taglines: ["Theirs"] }).taglines, undefined);
}

/* 9. Keys the document doesn't have are dropped, so a drifting tool schema can't write
      junk into a client's row. */
{
    const patch = mergeFoundationDraft(base(), { notAFieldAtAll: "x", hosts: "Real." });
    assert.deepEqual(Object.keys(patch), ["hosts"]);
}

console.log("mergeFoundationDraft: all checks passed");

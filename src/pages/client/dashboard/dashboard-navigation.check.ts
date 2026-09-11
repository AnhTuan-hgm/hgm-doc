/**
 * Self-check for journey completion as it is stored — the part that can corrupt a
 * client's recorded progress quietly if it ever drifts.
 *
 * Same no-framework pattern as its siblings: a plain assert script, no test runner, no new
 * dependency. Nothing imports it, so it costs nothing at runtime; `tsc -b` still type-checks
 * it because it lives under src/.
 *
 * Bundled rather than compiled file-by-file, because this module imports icons from an
 * ESM-only subpath that plain `tsc --module commonjs` output cannot require (the same
 * reason the tsc command written at the top of dashboard-model.check.ts no longer runs —
 * that one predates an aliased import it now pulls in). Run it:
 *   npx esbuild src/pages/client/dashboard/dashboard-navigation.check.ts --bundle \
 *     --platform=node --format=cjs --alias:@=./src --outfile=/tmp/hgm-check/check.cjs \
 *   && node /tmp/hgm-check/check.cjs
 */
import assert from "node:assert/strict";
import {
    JOURNEY_STEPS,
    type JourneyStepId,
    isJourneyItemDone,
    journeyItemIds,
    journeyItemKey,
    toggleJourneyItemDone,
    toggleJourneyStepDone,
} from "./dashboard-navigation";

const tickable = JOURNEY_STEPS.filter((s) => s.itemsTickable);
assert.ok(tickable.length > 0, "no tickable steps left — delete this check if that is deliberate");

/* 1. Every tickable step's items carry an explicit id. The label fallback exists for the
      untickable lists; relying on it for a stored key means a copy edit silently loses a
      client's ticks. */
for (const step of tickable) {
    for (const item of step.items ?? []) {
        assert.ok(item.id, `tickable step "${step.id}" has an item without an id: "${item.label}"`);
    }
    const ids = journeyItemIds(step.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate item ids in step "${step.id}"`);
}

/* 2. No item key can ever be read as a step id, or ticking a piece would finish a step. */
const stepIds = new Set<string>(JOURNEY_STEPS.map((s) => s.id));
for (const step of tickable) {
    for (const itemId of journeyItemIds(step.id)) {
        assert.ok(!stepIds.has(journeyItemKey(step.id, itemId)), `item key collides with a step id: ${journeyItemKey(step.id, itemId)}`);
    }
}

const FUNNEL: JourneyStepId = "funnel";
const items = journeyItemIds(FUNNEL);
const keys = items.map((id) => journeyItemKey(FUNNEL, id));
const allDone = (done: string[]) => items.every((id) => isJourneyItemDone(done, FUNNEL, id));

/* 3. A legacy row — the bare step id, ticked before the step was broken up — still reads
      as every piece done. This is the case that would visibly un-finish a step for a
      client who had already got there. */
assert.ok(allDone([FUNNEL]), "a legacy bare step id must still read as every item done");

/* 4. Unticking ONE piece of a legacy row leaves the other four ticked. Dropping the bare
      id on its own would untick all five. */
const afterOne = toggleJourneyItemDone([FUNNEL], FUNNEL, items[0]);
assert.ok(!afterOne.includes(FUNNEL), "the bare id must be expanded, not kept");
assert.equal(isJourneyItemDone(afterOne, FUNNEL, items[0]), false);
for (const id of items.slice(1)) assert.equal(isJourneyItemDone(afterOne, FUNNEL, id), true, `"${id}" must survive unticking a sibling`);

/* 5. Ticking every piece one by one is the same state the all-at-once shortcut writes. */
let oneByOne: string[] = [];
for (const id of items) oneByOne = toggleJourneyItemDone(oneByOne, FUNNEL, id);
assert.ok(allDone(oneByOne));
assert.deepEqual([...oneByOne].sort(), [...toggleJourneyStepDone([], FUNNEL)].sort());

/* 6. "Undo all" clears every key AND the legacy bare id — leaving either behind would
      read as done again on the next render. */
for (const start of [oneByOne, [FUNNEL], [FUNNEL, ...keys]]) {
    const cleared = toggleJourneyStepDone(start, FUNNEL);
    assert.equal(allDone(cleared), false, "undo all must clear the step");
    for (const id of items) assert.equal(isJourneyItemDone(cleared, FUNNEL, id), false);
}

/* 7. Neither reducer ever disturbs another step's progress. */
const other: JourneyStepId = "kickoff";
assert.ok(toggleJourneyItemDone([other], FUNNEL, items[0]).includes(other));
assert.ok(toggleJourneyStepDone([other], FUNNEL).includes(other));
assert.ok(toggleJourneyStepDone([other, ...keys], FUNNEL).includes(other));

/* 8. A step with no tickable items keeps the plain on/off behaviour it always had. */
assert.deepEqual(toggleJourneyStepDone([], other), [other]);
assert.deepEqual(toggleJourneyStepDone([other], other), []);

/* 9. Ticking a piece twice returns to where it started — no key left duplicated. */
const twice = toggleJourneyItemDone(toggleJourneyItemDone([], FUNNEL, items[1]), FUNNEL, items[1]);
assert.deepEqual(twice, []);

console.log("dashboard-navigation.check: all assertions passed");

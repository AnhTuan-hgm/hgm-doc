/**
 * Self-check for makeShadeScale, following dashboard-model.check.ts: no test runner
 * exists in this project, so this is a plain assert script nothing imports.
 *
 * Run:
 *   npx tsc src/pages/client/dashboard/color-scale.check.ts src/pages/client/dashboard/color-scale.ts \
 *     --outDir /tmp/hgm-check --module commonjs --moduleResolution node \
 *     --target es2022 --skipLibCheck --esModuleInterop --types node \
 *   ; node /tmp/hgm-check/color-scale.check.js
 */
import assert from "node:assert/strict";
import { SCALE_STEPS, makeShadeScale } from "./color-scale";

/* 1. Eleven steps, and the scale passes through the EXACT brand hex. */
{
    const scale = makeShadeScale("#6365F1")!;
    assert.equal(scale.length, SCALE_STEPS.length);
    assert.ok(
        scale.some((s) => s.hex === "#6365F1"),
        "the brand hex itself must appear in the scale",
    );
}

/* 2. Light to dark, monotonically — a scale that doubles back reads as broken. */
{
    const lum = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
    const scale = makeShadeScale("#214254")!;
    for (let i = 1; i < scale.length; i++)
        assert.ok(lum(scale[i].hex) < lum(scale[i - 1].hex), `step ${scale[i].step} must be darker than ${scale[i - 1].step}`);
}

/* 3. Shorthand hex works; junk returns null instead of a junk palette. */
{
    assert.ok(makeShadeScale("#abc"));
    assert.equal(makeShadeScale("not a color"), null);
    assert.equal(makeShadeScale(""), null);
}

console.log("makeShadeScale: all checks passed");

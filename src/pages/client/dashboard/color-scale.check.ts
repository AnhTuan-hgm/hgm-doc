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
import { INK, SCALE_STEPS, WHITE, contrastRatio, hexToRgb, makeShadeScale, readableTextOn, rgbString, wcagLabel } from "./color-scale";

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

/* 4. Contrast — the WCAG reference values, so a swatch's "AA" badge means what it says. */
{
    assert.deepEqual(hexToRgb("#7F56D9"), { r: 127, g: 86, b: 217 });
    assert.equal(rgbString("#abc"), "rgb(170 187 204)");
    assert.equal(rgbString("nope"), null);
    assert.equal(Math.round(contrastRatio("#000000", "#FFFFFF")!), 21);
    assert.equal(contrastRatio("#FFFFFF", "#FFFFFF"), 1);
    assert.equal(contrastRatio("#zzz", "#FFFFFF"), null);
    // #767676 on white is the canonical "just passes AA" grey (4.54:1).
    const grey = contrastRatio("#767676", WHITE)!;
    assert.ok(grey > 4.5 && grey < 4.6, `expected ~4.54, got ${grey}`);
    assert.equal(wcagLabel(grey), "AA");
    assert.equal(wcagLabel(7.5), "AAA");
    assert.equal(wcagLabel(3.2), "AA large");
    assert.equal(wcagLabel(1.5), "Low");
}

/* 5. Readable text — dark grounds get white text, light grounds get ink, junk gets null. */
{
    assert.equal(readableTextOn("#214254")!.text, WHITE);
    assert.equal(readableTextOn("#214254")!.light, true);
    assert.equal(readableTextOn("#F4EBFF")!.text, INK);
    assert.equal(readableTextOn("#F4EBFF")!.light, false);
    assert.equal(readableTextOn(""), null);
}

console.log("color-scale: all checks passed");

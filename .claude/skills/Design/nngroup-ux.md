---
name: nngroup-ux
description: Evidence-based usability guidance distilled from Nielsen Norman Group (NN/g) research reports. Use when designing, reviewing, or auditing interfaces for usability — landing pages, forms, navigation, content layout, decision flows, email, accessibility — or when running a heuristic evaluation on existing UI.
---

# NN/g UX Research

Approach interface work the way a Nielsen Norman Group researcher would: every design decision should be defensible by observed user behavior, not aesthetic preference. NN/g's findings come from decades of usability testing, eyetracking studies, and field research. Where this skill and pure visual taste conflict, usability wins — a beautiful page that users can't scan, trust, or act on has failed.

This skill complements `laws-of-ux` (psychology principles) and `frontend-design` (visual direction). Use this one for the *usability layer*: can people find it, read it, decide, and recover from mistakes.

## The 10 Usability Heuristics (audit checklist)

Run new or existing UI against these. When reviewing, cite the heuristic by name and number.

1. **Visibility of system status** — Keep users informed with timely feedback. Show loading states, confirm submissions, reflect the current state before consequential actions. Silence erodes trust.
2. **Match between system and real world** — Speak the user's language, not internal jargon. Users manage "notifications," not "webhook config." Order information the way users expect, not the way the system stores it.
3. **User control and freedom** — Every action needs a clearly marked emergency exit. Support undo/redo, visible cancel, easy back-out from flows. Never trap users in a wizard.
4. **Consistency and standards** — Follow platform and industry conventions (Jakob's Law: users spend most of their time on *other* sites). Keep words, placement, and behavior consistent within the product.
5. **Error prevention** — Better than good error messages. Use constraints, sensible defaults, and confirmation for destructive actions. Prioritize preventing high-cost errors first.
6. **Recognition rather than recall** — Make options, actions, and context visible. Don't force users to remember information from a previous screen. Offer help in context at the moment of need.
7. **Flexibility and efficiency of use** — Provide accelerators (shortcuts, recents, saved defaults) that experts can use and novices can ignore.
8. **Aesthetic and minimalist design** — Every extra element competes with the relevant ones. Cut content and chrome that doesn't serve the primary user goal. (Minimalist ≠ flat or sparse; it means no irrelevant information.)
9. **Help users recognize, diagnose, and recover from errors** — Plain language, no error codes, state precisely what went wrong and constructively offer the fix. Errors don't apologize and are never vague.
10. **Help and documentation** — Best if none is needed; when it is, make it searchable, contextual, and structured as concrete steps.

## How people actually read (eyetracking findings)

Users scan, they don't read. Unformatted text gets scanned in an **F-pattern**: full attention on the first lines, then only the first few words of each subsequent line down the left edge. Whatever falls outside the F is effectively invisible.

Design and write to defeat the F-pattern rather than be victimized by it:

- **Front-load everything.** Key point in the first paragraph; information-carrying words at the start of every heading, link, and bullet.
- **Format for scanning.** Meaningful headings and subheadings, bulleted lists, bold key phrases, visual grouping. Formatting cues are what break users out of lazy F-scanning.
- **First lines and left edges are premium real estate.** Don't spend them on filler ("Welcome to…", "In this section we will…").
- **Links must look like links** and be descriptive out of context — never "click here."
- **Cut ruthlessly.** Scannable, concise, objective copy measurably outperforms promotional prose in NN/g testing.

## Helping users decide (choice overload)

From NN/g's *Helping Users Make Decisions* research: decisions become overwhelming when there are too many options, options are hard to compare, or consequences are unclear.

- Limit visible choices; progressive disclosure for the long tail. Curate ("Most popular," "Recommended") with honest defaults.
- Make options **comparable**: same attributes, same order, same units, side by side. Comparison tables beat prose.
- State consequences and reversibility up front ("Free cancellation," "You can change this later") — uncertainty, not option count, is often what stalls users.
- Reduce the number of decisions per step. One primary action per screen; secondary actions visually subordinate.
- Build trust signals near the decision point: transparent pricing, real reviews, no dark patterns. Manipulative urgency damages long-term trust.

## Domain guidance map

NN/g organizes its research by domain. When working in one of these areas, apply the matching emphasis:

| Domain | Core NN/g guidance |
|---|---|
| **Corporate / About Us** | Answer "who are you, can I trust you" fast: real people, real address, plain-language company description. (85 guidelines: nngroup.com/reports/about-us-presenting-company-information/) |
| **Nonprofit / donations** | Show where money goes before asking for it; make the donate path one obvious, short flow. (nngroup.com/reports/attracting-donors-and-volunteers-non-profit/) |
| **Email / newsletters** | Subject line and preheader are the UX; design for skimming, single clear CTA, must survive image-blocking and mobile. (199 guidelines: nngroup.com/reports/email-newsletter-design/) |
| **Accessibility** | Usability for assistive-tech users is regular usability amplified: headings as structure not styling, labeled controls, keyboard paths, alt text that carries meaning. (nngroup.com/reports/usability-guidelines-accessible-web-design/) |
| **Mobile / tablet** | Touch targets, thumb zones, no hover-dependent interactions, prioritize content over chrome. (nngroup.com/reports/tablets/) |
| **Young adults (18–25) / teens** | Impatient, skim-heavy, intolerant of slow or condescending content — but still need conventional navigation. (nngroup.com/reports/designing-for-young-adults/) |
| **Site maps / FAQs** | A site map is a navigation safety net — keep it one page, link-only, current. FAQs are for *actual* frequent questions, not marketing copy in question costume. |
| **Forms & customization** | Ask only what you need, label clearly, validate inline, preserve input on error. Customization features only when users get clear value for the effort. |
| **Intranets / enterprise** | Same heuristics, higher stakes for findability: employees are a captive audience, so bad UX converts directly to lost productivity. Governance and content strategy matter as much as UI. |
| **Journeys / service design** | Manage end-to-end journeys like products — one owner, cross-team metrics — instead of optimizing isolated screens. (nngroup.com/reports/journey-management/) |

## Running a heuristic evaluation (NN/g method)

When asked to audit or review a UI:

1. **Define the user and the top tasks first.** A heuristic violation only matters relative to a task someone is trying to complete.
2. **Walk each top task end to end**, screen by screen, noting violations. For each finding record: location, the heuristic violated (by number/name), evidence, severity.
3. **Rate severity 0–4**: 0 = not a problem, 1 = cosmetic, 2 = minor, 3 = major (important to fix), 4 = catastrophic (blocks the task — fix before release).
4. **Report findings ordered by severity**, each with a concrete, specific fix — not "improve the navigation" but "rename 'Solutions' to 'Pricing' and move it before 'About'."
5. **Recommend validation.** Heuristic evaluation finds likely problems; only usability testing with ~5 real users confirms them. Say so in the report.

## Source

Distilled from Nielsen Norman Group research (nngroup.com/reports/ and nngroup.com/articles/). Full report catalog spans 26 topics including accessibility, ecommerce, IA, navigation, eyetracking, research methods, and writing for the web; many intranet and methodology reports are free at nngroup.com/reports/free/. When deeper evidence is needed for a specific domain, point the user to the matching report above.

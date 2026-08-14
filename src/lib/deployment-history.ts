/**
 * A point-in-time snapshot of this site's Netlify deploy history, captured 2026-08-14.
 *
 * It's a snapshot rather than a live feed on purpose: reading the Netlify API from the browser
 * needs a personal access token, which is a secret and can't ship in client code. Refreshing it
 * means re-running the capture and committing the result.
 *
 * Note what is NOT here — the reason a build failed. Netlify's public API exposes no method for
 * reading build logs, and every failure below reports the same generic string ("Build script
 * returned non-zero exit code: 2"). Root causes live in DEPLOY_EPISODES, reconstructed from git
 * history, and each one is labelled with how confident that reconstruction is.
 */

export type DeployState = "ready" | "error";

export interface DeployRecord {
    /** Netlify deploy id — also builds the log URL, see deployLogUrl(). */
    id: string;
    /** ISO timestamp the deploy was created. */
    at: string;
    state: DeployState;
    /** Short commit sha. Null for the 46 deploys where Netlify recorded no commit ref. */
    sha: string | null;
    /** Build duration in seconds, when Netlify reported one. */
    secs: number | null;
}

/** How well the cause of a failure episode is actually established. */
export type EpisodeConfidence = "confirmed" | "unrecorded";

export interface DeployEpisode {
    id: string;
    /** Human-readable date range of the episode. */
    when: string;
    /** How many failed deploys it accounts for. */
    failures: number;
    title: string;
    /** What broke. Empty string when it was never recorded. */
    issue: string;
    /** How it was resolved. Empty string when it was never recorded. */
    solution: string;
    confidence: EpisodeConfidence;
    /** Evidence backing the reconstruction — shown so nobody has to take it on trust. */
    evidence: string;
}

export const DEPLOY_HISTORY: DeployRecord[] = [
    { id: "6a35ff36c2b33c000842e55e", at: "2026-06-20T02:47:18.121Z", state: "error", sha: "bf17295", secs: null },
    { id: "6a36001ec13c6c00083a7cd1", at: "2026-06-20T02:51:10.647Z", state: "error", sha: "bc6b816", secs: null },
    { id: "6a360040c3e2a50008f730f5", at: "2026-06-20T02:51:44.019Z", state: "error", sha: "9155a20", secs: null },
    { id: "6a36005e1ec37200082aa706", at: "2026-06-20T02:52:14.790Z", state: "error", sha: "e7d8982", secs: null },
    { id: "6a36025816dd8c00087e3c25", at: "2026-06-20T03:00:40.861Z", state: "error", sha: "c5252a9", secs: null },
    { id: "6a3604cb77148b0009d08687", at: "2026-06-20T03:11:07.440Z", state: "error", sha: "5a4d56b", secs: null },
    { id: "6a3606dcda32d60008a3fcfa", at: "2026-06-20T03:19:56.230Z", state: "error", sha: "979847a", secs: null },
    { id: "6a3610f1d7bc6c0008b1e4a3", at: "2026-06-20T04:02:57.640Z", state: "error", sha: "b025605", secs: null },
    { id: "6a3614deb9eca20007a94563", at: "2026-06-20T04:19:42.191Z", state: "error", sha: "9bc58b1", secs: null },
    { id: "6a3615c99f7e9bb005f24e5e", at: "2026-06-20T04:23:37.582Z", state: "error", sha: null, secs: null },
    { id: "6a36162cf04f0b0008d60b6e", at: "2026-06-20T04:25:16.263Z", state: "ready", sha: "31b9ec4", secs: 33 },
    { id: "6a361644f20a820890db6228", at: "2026-06-20T04:25:40.254Z", state: "ready", sha: null, secs: 58 },
    { id: "6a3617474b289b00086a4d78", at: "2026-06-20T04:29:59.756Z", state: "ready", sha: "5991f58", secs: 22 },
    { id: "6a36176003226df00c8193a2", at: "2026-06-20T04:30:24.502Z", state: "ready", sha: null, secs: 55 },
    { id: "6a361b41da32d60008f3fbc7", at: "2026-06-20T04:46:57.661Z", state: "ready", sha: "bb7893a", secs: 24 },
    { id: "6a361b6f5179a5b974f1d338", at: "2026-06-20T04:47:43.921Z", state: "ready", sha: null, secs: 53 },
    { id: "6a361d148214550008230f1e", at: "2026-06-20T04:54:44.725Z", state: "ready", sha: "03f24ff", secs: 24 },
    { id: "6a361e000baf3200088854a2", at: "2026-06-20T04:58:40.084Z", state: "ready", sha: "fd42802", secs: 22 },
    { id: "6a361e95ec39ac0008e17289", at: "2026-06-20T05:01:09.404Z", state: "ready", sha: "a0012f4", secs: 24 },
    { id: "6a361ff9b489a4000813762f", at: "2026-06-20T05:07:05.513Z", state: "ready", sha: "38e6887", secs: 24 },
    { id: "6a36215a05b19c0008af886a", at: "2026-06-20T05:12:58.677Z", state: "ready", sha: "a4c8190", secs: 26 },
    { id: "6a3624b6323f380008156c38", at: "2026-06-20T05:27:18.187Z", state: "ready", sha: "50d49e6", secs: 26 },
    { id: "6a3626bf132c68000834d5e6", at: "2026-06-20T05:35:59.177Z", state: "ready", sha: "af4716b", secs: 25 },
    { id: "6a3627ad82888c00082ad599", at: "2026-06-20T05:39:57.218Z", state: "ready", sha: "536d73e", secs: 42 },
    { id: "6a362d29aee88f0008a798b3", at: "2026-06-20T06:03:22.001Z", state: "error", sha: "ab163e4", secs: null },
    { id: "6a3638914b289b0008b9d2a1", at: "2026-06-20T06:52:01.523Z", state: "ready", sha: "d5096aa", secs: 29 },
    { id: "6a375593f04f0b00080bd28d", at: "2026-06-21T03:08:03.489Z", state: "ready", sha: "5157163", secs: 25 },
    { id: "6a376b991ffae40008a51672", at: "2026-06-21T04:42:01.647Z", state: "ready", sha: "34315cc", secs: 23 },
    { id: "6a378ecc8066ca0008fbddc7", at: "2026-06-21T07:12:12.927Z", state: "ready", sha: "19c4680", secs: 23 },
    { id: "6a3794e76c68420008834fab", at: "2026-06-21T07:38:15.676Z", state: "ready", sha: "8b822cd", secs: 25 },
    { id: "6a37ad701a0acc000877293d", at: "2026-06-21T09:22:56.149Z", state: "ready", sha: "46ad890", secs: 26 },
    { id: "6a3862a8aee88f000859f0b2", at: "2026-06-21T22:16:08.975Z", state: "ready", sha: "67fc774", secs: 26 },
    { id: "6a386a55b4fae30008a5726e", at: "2026-06-21T22:48:53.962Z", state: "ready", sha: "f86b49f", secs: 25 },
    { id: "6a38f1d784e43f00089f3220", at: "2026-06-22T08:27:03.083Z", state: "ready", sha: "34a48f6", secs: 27 },
    { id: "6a38f71eab25aa0008b2e140", at: "2026-06-22T08:49:34.398Z", state: "ready", sha: "ccdb750", secs: 26 },
    { id: "6a3aa5fbe92f0300081c127e", at: "2026-06-23T15:27:55.877Z", state: "ready", sha: "7ccc1c8", secs: 28 },
    { id: "6a3b69e9e35007000872d781", at: "2026-06-24T05:23:53.361Z", state: "ready", sha: "08c5489", secs: 31 },
    { id: "6a3b6a13c74ba8c5980a7641", at: "2026-06-24T05:24:35.454Z", state: "ready", sha: null, secs: 28 },
    { id: "6a3ce29be5a5f4000859e217", at: "2026-06-25T08:11:07.908Z", state: "ready", sha: "fd29a20", secs: 32 },
    { id: "6a3cf6ce5c00e00008812fee", at: "2026-06-25T09:37:18.582Z", state: "ready", sha: "32efae4", secs: 30 },
    { id: "6a3e55d567af750008177d92", at: "2026-06-26T10:35:01.736Z", state: "ready", sha: "1a0331e", secs: 30 },
    { id: "6a3e5a0cc714e4000831e0a1", at: "2026-06-26T10:53:00.330Z", state: "ready", sha: "b0d89ef", secs: 27 },
    { id: "6a3ec8a538d18b0008555e05", at: "2026-06-26T18:44:53.825Z", state: "ready", sha: "f1cc330", secs: 31 },
    { id: "6a45d1823455c7000812a825", at: "2026-07-02T02:48:34.492Z", state: "error", sha: "94cdca4", secs: null },
    { id: "6a45d2b3efd74557551f89b4", at: "2026-07-02T02:53:39.231Z", state: "error", sha: null, secs: null },
    { id: "6a45e04d3b293700086d742c", at: "2026-07-02T03:51:41.903Z", state: "error", sha: "70ded97", secs: null },
    { id: "6a45e1321c356a000854083b", at: "2026-07-02T03:55:30.245Z", state: "error", sha: "2c8915a", secs: null },
    { id: "6a45e1acbb55160007ca8065", at: "2026-07-02T03:57:32.312Z", state: "error", sha: "68c3804", secs: null },
    { id: "6a45e1f199b977480c79cc4d", at: "2026-07-02T03:58:41.044Z", state: "ready", sha: null, secs: 10 },
    { id: "6a45e408e027800008110833", at: "2026-07-02T04:07:36.986Z", state: "error", sha: "4dadc69", secs: null },
    { id: "6a45e5b84e740a0008ab645c", at: "2026-07-02T04:14:48.992Z", state: "error", sha: "02e2e24", secs: null },
    { id: "6a45e613e2decd000872848d", at: "2026-07-02T04:16:19.809Z", state: "error", sha: "04d9761", secs: null },
    { id: "6a45e662b4e882000872ad88", at: "2026-07-02T04:17:38.369Z", state: "error", sha: "6081e34", secs: null },
    { id: "6a45e73182e68400083bb8c5", at: "2026-07-02T04:21:05.314Z", state: "error", sha: "f0bdd19", secs: null },
    { id: "6a45e8d0fa8b0d000817e5a2", at: "2026-07-02T04:28:00.648Z", state: "error", sha: "2bce631", secs: null },
    { id: "6a45e932e2816acf2ee06fd5", at: "2026-07-02T04:29:38.143Z", state: "ready", sha: null, secs: 1 },
    { id: "6a4605f320f58299a64e1591", at: "2026-07-02T06:32:19.072Z", state: "ready", sha: null, secs: 1 },
    { id: "6a4609a72af6993bbcbba84a", at: "2026-07-02T06:48:07.687Z", state: "ready", sha: null, secs: 1 },
    { id: "6a46af0f80cdf658c078b3f1", at: "2026-07-02T18:33:51.890Z", state: "ready", sha: null, secs: 1 },
    { id: "6a46d39672d40c291e4bb05a", at: "2026-07-02T21:09:42.433Z", state: "ready", sha: null, secs: 1 },
    { id: "6a47ee493a04e5cb7a7f43b7", at: "2026-07-03T17:15:53.121Z", state: "ready", sha: null, secs: 1 },
    { id: "6a4828b775a3095b944ff9e4", at: "2026-07-03T21:25:11.849Z", state: "ready", sha: null, secs: 1 },
    { id: "6a4963648749c312bac6259d", at: "2026-07-04T19:47:48.890Z", state: "ready", sha: null, secs: 1 },
    { id: "6a49b651522256fb18c5c6e0", at: "2026-07-05T01:41:37.688Z", state: "ready", sha: null, secs: 1 },
    { id: "6a4afce1b593e7443ade6943", at: "2026-07-06T00:54:57.085Z", state: "ready", sha: null, secs: 9 },
    { id: "6a4bba6a1661de5a3305fc20", at: "2026-07-06T14:23:38.584Z", state: "ready", sha: null, secs: 12 },
    { id: "6a4bbc236f52175e9ec093f6", at: "2026-07-06T14:30:59.766Z", state: "ready", sha: null, secs: 2 },
    { id: "6a4bc161bb76c0749b18c5c4", at: "2026-07-06T14:53:21.255Z", state: "ready", sha: null, secs: 9 },
    { id: "6a4ce77af1d25c3a6bf86b20", at: "2026-07-07T11:48:10.377Z", state: "ready", sha: null, secs: 2 },
    { id: "6a4ea996da2a5a2e10fdb5c8", at: "2026-07-08T19:48:38.078Z", state: "ready", sha: null, secs: 2 },
    { id: "6a4eaf0841ea353f7fdde89e", at: "2026-07-08T20:11:52.047Z", state: "ready", sha: null, secs: 2 },
    { id: "6a4eb1e4b68678404b2e5e2b", at: "2026-07-08T20:24:04.055Z", state: "ready", sha: null, secs: 2 },
    { id: "6a4fceb732d05115bc2b35da", at: "2026-07-09T16:39:19.472Z", state: "ready", sha: null, secs: 10 },
    { id: "6a54b8026d83220725cf7f2f", at: "2026-07-13T10:03:46.727Z", state: "ready", sha: null, secs: 3 },
    { id: "6a56679af6e00834a7942b1b", at: "2026-07-14T16:45:14.021Z", state: "ready", sha: null, secs: 3 },
    { id: "6a5fc66999727abf07236b46", at: "2026-07-21T19:20:09.904Z", state: "ready", sha: null, secs: 2 },
    { id: "6a611f1833a9283234b1b6a6", at: "2026-07-22T19:50:48.636Z", state: "ready", sha: null, secs: 32 },
    { id: "6a638fc0ea5f477dff2d2f4c", at: "2026-07-24T16:16:00.388Z", state: "ready", sha: null, secs: 2 },
    { id: "6a6a72585ef57ddd31acd0c1", at: "2026-07-29T21:36:24.959Z", state: "ready", sha: null, secs: 2 },
    { id: "6a6a7643d9c57eee32123db0", at: "2026-07-29T21:53:07.431Z", state: "ready", sha: null, secs: 5 },
    { id: "6a6b62c4ca8dc02e4a33ebe8", at: "2026-07-30T14:42:12.204Z", state: "ready", sha: null, secs: 3 },
    { id: "6a6b677a130bb94cd5e5e81c", at: "2026-07-30T15:02:18.733Z", state: "ready", sha: null, secs: 3 },
    { id: "6a6cca60beab4935655e7a54", at: "2026-07-31T16:16:32.926Z", state: "ready", sha: null, secs: 3 },
    { id: "6a6cd1ae5f94ce704447baaa", at: "2026-07-31T16:47:42.640Z", state: "ready", sha: null, secs: 2 },
    { id: "6a74c59b4c9a34729ffe02f1", at: "2026-08-06T17:34:19.963Z", state: "error", sha: "dc4ca63", secs: null },
    { id: "6a74eea730a172a06a90f4b1", at: "2026-08-06T20:29:27.174Z", state: "ready", sha: null, secs: 2 },
    { id: "6a7c9e49a3f448fcffab6487", at: "2026-08-12T16:24:41.069Z", state: "ready", sha: null, secs: 5 },
    { id: "6a7cae05fcf9f403b2c20f30", at: "2026-08-12T17:31:49.494Z", state: "ready", sha: null, secs: 5 },
    { id: "6a7e1ab2ef00ba4b5231d9e8", at: "2026-08-13T19:27:46.433Z", state: "ready", sha: null, secs: 2 },
    { id: "6a7e23af95f23a3dad288d98", at: "2026-08-13T20:06:07.414Z", state: "ready", sha: null, secs: 2 },
    { id: "6a7e2605ef00ba98ae31db6f", at: "2026-08-13T20:16:05.678Z", state: "ready", sha: null, secs: 34 },
    { id: "6a7e2c674a8a640007973361", at: "2026-08-13T20:43:19.076Z", state: "ready", sha: "a937ac4", secs: 54 },
    { id: "6a7e2c70d562b75c806e05ad", at: "2026-08-13T20:43:28.916Z", state: "ready", sha: null, secs: 2 },
    { id: "6a7e30b6d60277000a77ead5", at: "2026-08-13T21:01:42.269Z", state: "ready", sha: "8e4c7c5", secs: 33 },
    { id: "6a7e30c0b24c28f4d02da660", at: "2026-08-13T21:01:52.250Z", state: "ready", sha: null, secs: 2 },
    { id: "6a7e315a1838cad3dcb658cb", at: "2026-08-13T21:04:26.045Z", state: "ready", sha: null, secs: 1 },
    { id: "6a7e3652f3825000085ed704", at: "2026-08-13T21:25:38.803Z", state: "ready", sha: "05045ab", secs: 31 },
    { id: "6a7e365d7a87e60826099ded", at: "2026-08-13T21:25:49.129Z", state: "ready", sha: null, secs: 2 },
    { id: "6a7e6e2847d2570008e19b90", at: "2026-08-14T01:23:52.838Z", state: "ready", sha: "af8a6b3", secs: 28 },
    { id: "6a7e768b23271200084b3d64", at: "2026-08-14T01:59:39.434Z", state: "ready", sha: "34989d4", secs: 38 },
];

/**
 * The 23 failures above are not 23 separate problems — they're four episodes, each one the same
 * build failing repeatedly while it was being chased down.
 *
 * Two causes are confirmed: the commit that fixed them says outright what was wrong. Two were never
 * written down, and the build logs that would have said are gone. Those are marked "unrecorded"
 * rather than guessed at — a deployment log that invents plausible causes is worse than one that
 * admits the gap.
 */
export const DEPLOY_EPISODES: DeployEpisode[] = [
    {
        id: "2026-06-20-diamond-logo",
        when: "20 Jun 2026, 02:47–04:23",
        failures: 10,
        title: "Unused component broke the type-check",
        issue: "The SOP sidebar's diamond logo was replaced with the HGM logo, but the old DiamondLogo component was left behind with nothing importing it. The build runs `tsc -b` before Vite, and it treats an unused local as an error, so every push failed at the type-check stage before Vite ever ran.",
        solution: "Deleted the orphaned DiamondLogo component. The next deploy went green.",
        confidence: "confirmed",
        evidence: 'Fixed by commit 31b9ec4, "Remove unused DiamondLogo component to fix TS build error" — the commit names the cause directly. Failures start at bf17295, which replaced the logo.',
    },
    {
        id: "2026-06-20-owner-guide",
        when: "20 Jun 2026, 06:03",
        failures: 1,
        title: "Owner-guide rebuild — cause not recorded",
        issue: "",
        solution: "",
        confidence: "unrecorded",
        evidence: 'The failing commit is ab163e4, "Rebuild owner guide: step content, credential forms, Supabase save". The next deploy succeeded on d5096aa, which adds new features rather than describing a fix, so it does not say what broke. Netlify no longer serves the build log.',
    },
    {
        id: "2026-07-02-firebase-modules",
        when: "2 Jul 2026, 02:48–04:28",
        failures: 11,
        title: "Imports pointed at modules that were never committed",
        issue: "The Firebase fallback work landed with imports for db-sync, db-logger and firebase, but those three files weren't included in the commit. The build resolved the imports, found nothing, and failed. Because the missing files were never noticed, the next several pushes kept failing the same way.",
        solution: "Committed the three missing modules. The build went green on the next deploy.",
        confidence: "confirmed",
        evidence: 'Fixed by commit 2bce631, "Add missing Firebase fallback modules (db-sync, db-logger, firebase)". The episode starts at 94cdca4, which finalised the Firebase integration. Firestore itself was later removed entirely on 2026-08-06 — see CLAUDE.md.',
    },
    {
        id: "2026-08-06-component-library",
        when: "6 Aug 2026, 17:34",
        failures: 1,
        title: "Single failure, no follow-up commit — cause not recorded",
        issue: "",
        solution: "",
        confidence: "unrecorded",
        evidence: 'The failing commit is dc4ca63, "Add design→code loop, variant strategy, and build order to Component Library Architecture". No further commit landed that day, and the deploy that succeeded ~3h later carries no commit ref — consistent with the same commit being retried successfully, which would point at a transient build failure rather than a code error. That is inference, not evidence: the build log is gone.',
    },
];

/** Netlify's dashboard is the only place the full build log still exists. */
export const deployLogUrl = (id: string) => `https://app.netlify.com/sites/docs-hgm/deploys/${id}`;

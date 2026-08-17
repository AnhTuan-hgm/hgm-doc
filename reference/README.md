# reference/

Team reference material. **Nothing in here is read by the app** — not at build time,
not at runtime. Vite only bundles `src/`, and only `public/` is served as static files.
Deleting this folder would not change the deployed site.

It exists so the source material behind the UI stays next to the code that implements it.

| Folder | What's in it |
| :-- | :-- |
| `design/` | Design artifacts and mockups. `Master Brand Document.html` is the spec for the eleven-section brand document on the client dashboard. `globeloaderartifact.html` is the source of the globe loader (the shipped copy is `public/globe-loader.html`, which `/home2` iframes). |
| `ai-website-setup/` | Exports from the design tool used for the AI-website setup SOP — `.dc.html` project files, bundled design systems, screenshots. The largest thing in the repo (~18 MB). |
| `sop/` | Screenshots captured while writing SOPs. |

## If you add something here

Assets the **app** needs go in `public/`, not here. A file in both places is a file that
will drift. Team headshots used to live in both `HGM Team/HGM Images/` and
`public/hgm team/` as twenty byte-identical copies; only the `public/` set was ever
served, so the duplicates were removed. `src/utils/team-photos.ts` reads `public/hgm team/`.

## Weight

This folder dominates the repo's size. If clone times start to hurt, `ai-website-setup/`
is the thing to move to shared storage — removing it from the working tree does not
shrink `.git`, which keeps every version it has ever held, so that would need a history
rewrite to actually pay off.

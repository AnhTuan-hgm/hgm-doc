/**
 * Real team headshots (public/hgm team/*, source: HGM Team/HGM Images).
 * Keyed by the exact canonical names used in ACCOUNT_MANAGERS /
 * MARKETING_ASSISTANTS / WEB_TEAM (dashboard-screen.tsx) and the `clients`
 * table's am / marketing_assistant / web_manager fields — legacy free-typed
 * names simply miss and fall back to initials.
 */
const TEAM_PHOTO_FILES = [
    "Aidan Peet.webp",
    "Alicia Morin.webp",
    "Ananya Arora.webp",
    "AnhTuan Bui.webp",
    "Brandon Nguyen.webp",
    "Charlotte Pickering.webp",
    "Chiara Henry.webp",
    "Gillian Conley.webp",
    "Jordan Holmes.webp",
    "Kristal Puguan.webp",
    "Kyle Zinger.webp",
    "Leshan Patterson.webp",
    "Lily Phanthavong.webp",
    "Lucca Maggiolo.avif",
    "Makenna Moran.webp",
    "Mike Sebastian.webp",
    "Nicole Araya.webp",
    "Pooja Murugavel.webp",
    "Shawal Nazir.webp",
    "Vicky Si.webp",
];

const PHOTOS = new Map(TEAM_PHOTO_FILES.map((f) => [f.replace(/\.(webp|avif)$/, "").toLowerCase(), encodeURI(`/hgm team/${f}`)]));

/** Photo URL for a team member, or undefined when we don't have one.
    Case-insensitive so Google's casing of a name (account avatars) still hits. */
export const teamPhoto = (name?: string | null): string | undefined => PHOTOS.get((name ?? "").trim().toLowerCase());

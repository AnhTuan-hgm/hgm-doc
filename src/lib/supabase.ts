import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn(
        "[HGM Docs] Supabase env vars not set. Copy .env.example to .env.local and add your credentials.",
    );
}

// Fall back to a syntactically-valid placeholder when env vars are missing (e.g. a
// fresh local checkout with no .env.local). createClient throws on an empty URL,
// which — now that the client is imported at the app root — would blank every page.
// With a placeholder the app still renders; auth calls simply resolve to no session.
const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_KEY = "placeholder-anon-key";

export const supabase = createClient(supabaseUrl || FALLBACK_URL, supabaseAnonKey || FALLBACK_KEY, {
    // persistSession + detectSessionInUrl are required for the dashboard Google OAuth
    // gate so the session survives the redirect back from Google.
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export interface ClientPageData {
    slug: string;
    client_name: string;
    client_website: string;
    pixel_code: string;
    starred?: boolean;
}

export interface OverviewCard {
    id: string;
    department: string;
    tab?: string;
    title: string;
    description: string;
    link: string;
    cover_url?: string;
    starred?: boolean;
    locked?: boolean; // protected card — only the owner can delete it
    created_at?: string;
}

/** A client record shown on the dashboard "Clients" (Client List) page. */
export interface ClientRecord {
    id: string;
    name: string;
    tier: string; // tier-0 | tier-1 | tier-2 | mastermind
    am: string; // account manager name
    location: string;
    cover_url?: string;
    link?: string; // optional link to their dashboard / any page
    starred?: boolean;
    created_at?: string;
}

/** An entry in the private Prompt & Pattern Library (/prompt-library). */
export interface PromptLibraryEntry {
    id: string;
    title: string;
    type: "prompt" | "pattern";
    category: string;
    body: string;
    when_to_use: string;
    tags: string[];
    created_at?: string;
    updated_at?: string;
}

export interface OverviewTab {
    id: string;
    department: string;
    label: string;
    created_at?: string;
}

export interface OwnerGuideMeta {
    slug: string;
    client_name: string;
    share_password?: string;
    created_at?: string;
}

export interface DocsRequest {
    id: string;
    requester: string;
    title: string;
    request_for: string; // clients | webteam | am | ma
    priority: string; // low | medium | high | urgent
    details?: string;
    status?: string; // open | done
    created_at?: string;
}

export interface ChatWidgetPageData {
    slug: string;
    client_name: string;
    client_website: string;
    widget_id: string;
    created_at?: string;
}

/** Section content for per-client dashboards (dashboard_pages.data jsonb). */
export interface DashboardContent {
    status: string; // Onboarding | Active | Paused
    logo_url: string;
    brand: {
        colors: { name: string; hex: string }[];
        fonts: string;
        folder_link: string;
    };
    instagram: {
        profile_url: string;
        highlights: { title: string; image_url: string }[];
    };
    ghl: {
        login_url: string;
        items: { label: string; done: boolean }[];
    };
    revenue: {
        currency: string;
        months: { month: string; revenue: number; leads: number; appointments: number }[];
    };
    links: { title: string; description: string; url: string }[];
    videos?: { id: string; title: string; url: string }[]; // Video guides (Loom link or uploaded mp4) — optional so older rows load unchanged
}

export interface DashboardPageData {
    slug: string;
    client_name: string;
    client_website: string;
    data: Partial<DashboardContent> | null;
    created_at?: string;
}

export interface LeadCapturePageData {
    slug: string;
    client_name: string;
    client_website: string;
    popup_code: string;
    inline_form_code: string;
    promo_header: string;
    promo_desc: string;
    form_option?: string; // both | a | b — which Task-2 option(s) the client sees
    option_b_intro?: string; // Option B intro paragraph (editable; **bold** markers)
    option_b_steps?: string[]; // Option B step list (editable; **bold** markers)
    before_img_1?: string;
    after_img_1?: string;
    before_img_2?: string;
    after_img_2?: string;
    created_at?: string;
}

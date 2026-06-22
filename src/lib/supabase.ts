import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn(
        "[HGM Docs] Supabase env vars not set. Copy .env.example to .env.local and add your credentials.",
    );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
    auth: { persistSession: false },
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
    created_at?: string;
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

export interface LeadCapturePageData {
    slug: string;
    client_name: string;
    client_website: string;
    popup_code: string;
    inline_form_code: string;
    promo_header: string;
    promo_desc: string;
    before_img_1?: string;
    after_img_1?: string;
    before_img_2?: string;
    after_img_2?: string;
    created_at?: string;
}

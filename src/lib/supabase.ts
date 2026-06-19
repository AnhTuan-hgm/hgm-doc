import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn(
        "[HGM Docs] Supabase env vars not set. Copy .env.example to .env.local and add your credentials.",
    );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

export interface ClientPageData {
    slug: string;
    client_name: string;
    client_website: string;
    pixel_code: string;
}

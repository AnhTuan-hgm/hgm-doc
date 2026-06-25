import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AuthUser {
    email: string;
    name: string;
    avatarUrl: string | null;
}

/**
 * Returns the currently signed-in Supabase user, normalized for display.
 * Pulls name/avatar from the Google OAuth identity (user_metadata) when present.
 * `user` is null when signed out; `loading` is true until the first lookup resolves.
 */
export const useAuthUser = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const toAuthUser = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]): AuthUser | null => {
            const u = session?.user;
            if (!u?.email) return null;
            const meta = u.user_metadata ?? {};
            return {
                email: u.email,
                name: (meta.full_name as string) || (meta.name as string) || u.email.split("@")[0],
                avatarUrl: (meta.avatar_url as string) || (meta.picture as string) || null,
            };
        };

        supabase.auth.getSession().then(({ data }) => {
            setUser(toAuthUser(data.session));
            setLoading(false);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(toAuthUser(session));
            setLoading(false);
        });

        return () => sub.subscription.unsubscribe();
    }, []);

    return { user, loading };
};

import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { PixelPage } from "./pixel-page";
import { supabase, type ClientPageData } from "@/lib/supabase";

export const ClientScreen = () => {
    const { clientSlug } = useParams<{ clientSlug: string }>();
    const [data, setData] = useState<ClientPageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!clientSlug) {
            setLoading(false);
            return;
        }
        supabase
            .from("client_pages")
            .select("*")
            .eq("slug", clientSlug)
            .single()
            .then(({ data: row, error }) => {
                if (!error && row) setData(row as ClientPageData);
                setLoading(false);
            });
    }, [clientSlug]);

    if (loading) {
        return (
            <main className="flex min-h-dvh items-center justify-center bg-secondary">
                <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent opacity-60" />
            </main>
        );
    }

    return (
        <PixelPage
            initialClientName={data?.client_name ?? ""}
            initialClientWebsite={data?.client_website ?? ""}
            initialPixelCode={data?.pixel_code}
        />
    );
};

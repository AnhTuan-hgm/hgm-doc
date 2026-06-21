import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { PixelPage } from "./pixel-page";
import { PopupPage } from "./popup-page";
import { NotFound } from "./not-found";
import { supabase, type ClientPageData, type LeadCapturePageData } from "@/lib/supabase";

const Spinner = () => (
    <main className="flex min-h-dvh items-center justify-center bg-secondary">
        <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent opacity-60" />
    </main>
);

/* Lead-capture pages live at /{name}-leadcapture and load from leadcapture_pages. */
const LeadCaptureScreen = ({ slug }: { slug: string }) => {
    const [data, setData] = useState<LeadCapturePageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setData(null);
        setNotFound(false);
        supabase
            .from("leadcapture_pages")
            .select("*")
            .eq("slug", slug)
            .single()
            .then(({ data: row, error }) => {
                if (!error && row) setData(row as LeadCapturePageData);
                else setNotFound(true);
                setLoading(false);
            });
    }, [slug]);

    if (loading) return <Spinner />;
    if (notFound) return <NotFound />;

    return (
        <PopupPage
            key={slug}
            slug={slug}
            initialClientName={data?.client_name ?? ""}
            initialClientWebsite={data?.client_website ?? ""}
            initialPopupCode={data?.popup_code || undefined}
            initialInlineCode={data?.inline_form_code || undefined}
            initialPromoHeader={data?.promo_header || undefined}
            initialPromoDesc={data?.promo_desc || undefined}
            initialBeforeImg1={data?.before_img_1 ?? ""}
            initialAfterImg1={data?.after_img_1 ?? ""}
            initialBeforeImg2={data?.before_img_2 ?? ""}
            initialAfterImg2={data?.after_img_2 ?? ""}
        />
    );
};

export const ClientScreen = () => {
    const { clientSlug } = useParams<{ clientSlug: string }>();

    if (clientSlug?.endsWith("-leadcapture")) {
        return <LeadCaptureScreen slug={clientSlug} />;
    }

    return <PixelScreen clientSlug={clientSlug} />;
};

const PixelScreen = ({ clientSlug }: { clientSlug?: string }) => {
    const [data, setData] = useState<ClientPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // "metapixel" is the template/create route and is always valid even without a saved row.
    const isTemplate = clientSlug === "metapixel";

    useEffect(() => {
        if (!clientSlug) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        if (isTemplate) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setData(null);
        setNotFound(false);
        supabase
            .from("client_pages")
            .select("*")
            .eq("slug", clientSlug)
            .single()
            .then(({ data: row, error }) => {
                if (!error && row) setData(row as ClientPageData);
                else setNotFound(true);
                setLoading(false);
            });
    }, [clientSlug, isTemplate]);

    if (loading) return <Spinner />;
    if (notFound) return <NotFound />;

    return (
        <PixelPage
            key={clientSlug}
            slug={clientSlug}
            isTemplate={isTemplate}
            initialClientName={data?.client_name ?? ""}
            initialClientWebsite={data?.client_website ?? ""}
            initialPixelCode={data?.pixel_code}
        />
    );
};

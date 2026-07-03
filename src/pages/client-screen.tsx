import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { PixelPage } from "./pixel-page";
import { PopupPage } from "./popup-page";
import { ChatWidgetScreen } from "./chat-widget-screen";
import { ClientDashboardPage } from "./client-dashboard-page";
import { TemplateOneScreen } from "./template-one-screen";
import { NotFound } from "./not-found";
import { supabase, type ChatWidgetPageData, type ClientPageData, type DashboardPageData, type LeadCapturePageData } from "@/lib/supabase";

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
            initialFormOption={data?.form_option || undefined}
            initialOptionBIntro={data?.option_b_intro || undefined}
            initialOptionBSteps={data?.option_b_steps?.length ? data.option_b_steps : undefined}
        />
    );
};

/* Chat-widget pages live at /{name}-chatwidget and load from chatwidget_pages. */
const ChatWidgetClientScreen = ({ slug }: { slug: string }) => {
    const [data, setData] = useState<ChatWidgetPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setData(null);
        setNotFound(false);
        supabase
            .from("chatwidget_pages")
            .select("*")
            .eq("slug", slug)
            .single()
            .then(({ data: row, error }) => {
                if (!error && row) setData(row as ChatWidgetPageData);
                else setNotFound(true);
                setLoading(false);
            });
    }, [slug]);

    if (loading) return <Spinner />;
    if (notFound) return <NotFound />;

    return (
        <ChatWidgetScreen
            key={slug}
            slug={slug}
            initialClientName={data?.client_name ?? ""}
            initialClientWebsite={data?.client_website ?? ""}
            initialWidgetId={data?.widget_id || undefined}
        />
    );
};

/* Client dashboards live at /{name}-dashboard and load from dashboard_pages.
   The bare "/client-dashboard" slug is the master template (no DB row needed). */
const ClientDashboardScreen = ({ slug }: { slug: string }) => {
    const [data, setData] = useState<DashboardPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const isTemplate = slug === "client-dashboard";

    useEffect(() => {
        if (isTemplate) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setData(null);
        setNotFound(false);
        supabase
            .from("dashboard_pages")
            .select("*")
            .eq("slug", slug)
            .single()
            .then(({ data: row, error }) => {
                if (!error && row) setData(row as DashboardPageData);
                else setNotFound(true);
                setLoading(false);
            });
    }, [slug, isTemplate]);

    if (loading) return <Spinner />;
    if (notFound) return <NotFound />;

    return (
        <ClientDashboardPage
            key={slug}
            slug={slug}
            isTemplate={isTemplate}
            initialClientName={data?.client_name ?? ""}
            initialClientWebsite={data?.client_website ?? ""}
            initialData={data?.data}
        />
    );
};

export const ClientScreen = () => {
    const { clientSlug } = useParams<{ clientSlug: string }>();

    if (clientSlug?.endsWith("-leadcapture")) {
        return <LeadCaptureScreen slug={clientSlug} />;
    }

    if (clientSlug?.endsWith("-chatwidget")) {
        return <ChatWidgetClientScreen slug={clientSlug} />;
    }

    if (clientSlug?.endsWith("-dashboard")) {
        return <ClientDashboardScreen slug={clientSlug} />;
    }

    return <PixelScreen clientSlug={clientSlug} />;
};

const PixelScreen = ({ clientSlug }: { clientSlug?: string }) => {
    const [data, setData] = useState<ClientPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    // Set when the slug isn't a pixel page but IS a template-1 document.
    const [isTemplateDoc, setIsTemplateDoc] = useState(false);

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
        setIsTemplateDoc(false);
        supabase
            .from("client_pages")
            .select("*")
            .eq("slug", clientSlug)
            .single()
            .then(({ data: row, error }) => {
                if (!error && row) {
                    setData(row as ClientPageData);
                    setLoading(false);
                    return;
                }
                // Not a pixel page — it might be a document copied from /template-1.
                supabase
                    .from("template_docs")
                    .select("slug")
                    .eq("slug", clientSlug)
                    .maybeSingle()
                    .then(({ data: doc }) => {
                        if (doc) setIsTemplateDoc(true);
                        else setNotFound(true);
                        setLoading(false);
                    });
            });
    }, [clientSlug, isTemplate]);

    if (loading) return <Spinner />;
    if (isTemplateDoc && clientSlug) return <TemplateOneScreen key={clientSlug} slug={clientSlug} isTemplate={false} />;
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

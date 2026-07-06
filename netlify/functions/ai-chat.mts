import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

/**
 * Team-only AI assistant for the internal dashboard. Answers questions about
 * this app's own Supabase content (client pages, templates, the Prompt &
 * Pattern Library, the client roster) — e.g. "give me the template for X".
 *
 * Runs server-side only: the Anthropic key and the Supabase service-role key
 * never reach the browser bundle. Uses service-role (not the anon key) so the
 * search tool works regardless of each table's RLS policy — it only ever
 * performs read-only `.select()` queries against a fixed, whitelisted set of
 * tables, never arbitrary SQL, and never mutates anything.
 */

const SYSTEM_PROMPT = `You are the internal AI assistant for HiddenGem Media's team documentation site (hgm-doc). You help the team find their own content: client pages, shareable templates (Meta Pixel, Popup/Lead Capture, Chat Widget, Host Onboarding Form, Owner Guide, Client Dashboard), saved prompts/patterns, and the client roster.

Use the search_site_content tool whenever the user asks for a template, a client's page, or a saved prompt/pattern — e.g. "give me the template for popups" or "find John's dashboard". Always search before saying something doesn't exist.

When you get results back, answer concisely and include the relevant link(s) as plain paths (e.g. /acme-hostonboarding) — the app will render them as clickable links. If nothing matches, say so plainly and suggest the person rephrase (e.g. try the client's name only). Never invent slugs, links, or content that wasn't returned by the tool.`;

const SEARCH_TOOL: Anthropic.Tool = {
    name: "search_site_content",
    description:
        "Search this app's own Supabase data — client pages (Meta Pixel, Popup, Chat Widget, Host Onboarding Form, Client Dashboard, Owner Guide), the Prompt & Pattern Library, and the client roster — by a free-text query. Use for any request naming a client, business, template, or prompt/pattern topic.",
    input_schema: {
        type: "object",
        properties: {
            query: { type: "string", description: "Search text — a client/business name, or a template/prompt/pattern keyword." },
        },
        required: ["query"],
    },
};

interface SearchResult {
    source: string;
    title: string;
    subtitle?: string;
    snippet?: string;
    content?: string;
    url: string | null;
}

async function searchSiteContent(supabaseAdmin: ReturnType<typeof createClient>, query: string): Promise<SearchResult[]> {
    const like = `%${query}%`;
    const [prompts, clientPages, chatwidgets, leadcaptures, hostonb, dashboards, ownerguides, clients] = await Promise.all([
        supabaseAdmin.from("prompt_library").select("title,type,category,body,when_to_use").or(`title.ilike.${like},category.ilike.${like}`).limit(5),
        supabaseAdmin.from("client_pages").select("slug,client_name").ilike("client_name", like).limit(5),
        supabaseAdmin.from("chatwidget_pages").select("slug,client_name").ilike("client_name", like).limit(5),
        supabaseAdmin.from("leadcapture_pages").select("slug,client_name").ilike("client_name", like).limit(5),
        supabaseAdmin.from("host_onboarding_pages").select("slug,client_name").ilike("client_name", like).limit(5),
        supabaseAdmin.from("dashboard_pages").select("slug,client_name").ilike("client_name", like).limit(5),
        supabaseAdmin.from("owner_guides").select("slug,client_name").ilike("client_name", like).limit(5),
        supabaseAdmin.from("clients").select("name,tier,am,location,link").ilike("name", like).limit(5),
    ]);

    const results: SearchResult[] = [];
    for (const p of prompts.data ?? []) results.push({ source: "Prompt & Pattern Library", title: p.title, subtitle: `${p.type} · ${p.category}`, snippet: p.when_to_use, content: p.body, url: "/prompt-library" });
    for (const c of clientPages.data ?? []) results.push({ source: "Meta Pixel page", title: c.client_name, url: `/${c.slug}` });
    for (const c of chatwidgets.data ?? []) results.push({ source: "Chat Widget page", title: c.client_name, url: `/${c.slug}` });
    for (const c of leadcaptures.data ?? []) results.push({ source: "Lead Capture / Popup page", title: c.client_name, url: `/${c.slug}` });
    for (const c of hostonb.data ?? []) results.push({ source: "Host Onboarding Form", title: c.client_name, url: `/${c.slug}` });
    for (const c of dashboards.data ?? []) results.push({ source: "Client Dashboard", title: c.client_name, url: `/${c.slug}` });
    for (const c of ownerguides.data ?? []) results.push({ source: "Owner Guide", title: c.client_name, url: `/owner-guide/${c.slug}` });
    for (const c of clients.data ?? []) results.push({ source: "Client roster", title: c.name, subtitle: [c.tier, c.am, c.location].filter(Boolean).join(" · "), url: c.link || null });

    return results.slice(0, 20);
}

export default async (req: Request) => {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!apiKey || !supabaseUrl || !serviceKey) {
        return Response.json({ error: "AI chat isn't configured yet — ask the web team to set ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY in Netlify." }, { status: 500 });
    }

    let messages: Anthropic.MessageParam[];
    try {
        const body = await req.json();
        messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) throw new Error("empty");
    } catch {
        return Response.json({ error: "No messages provided." }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    let conversation = messages.slice(-20); // cap history sent to the model
    let finalText = "";

    try {
        for (let round = 0; round < 3; round++) {
            const response = await anthropic.messages.create({
                model: "claude-opus-4-8",
                max_tokens: 1024,
                system: SYSTEM_PROMPT,
                tools: [SEARCH_TOOL],
                messages: conversation,
            });

            // Claude can issue multiple tool_use blocks in one turn (parallel calls) — every
            // one of them needs a matching tool_result in the very next message, or the API
            // rejects the next request with "tool_use ids were found without tool_result".
            const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
            if (toolUses.length === 0 || response.stop_reason !== "tool_use") {
                finalText = response.content
                    .filter((b): b is Anthropic.TextBlock => b.type === "text")
                    .map((b) => b.text)
                    .join("\n");
                break;
            }

            const toolResults = await Promise.all(
                toolUses.map(async (toolUse) => ({
                    type: "tool_result" as const,
                    tool_use_id: toolUse.id,
                    content: JSON.stringify(await searchSiteContent(supabaseAdmin, (toolUse.input as { query: string }).query)),
                })),
            );
            conversation = [
                ...conversation,
                { role: "assistant", content: response.content },
                { role: "user", content: toolResults },
            ];
        }
    } catch (err) {
        console.error("[ai-chat]", err);
        return Response.json({ error: "The AI assistant hit an error — try again in a moment." }, { status: 502 });
    }

    return Response.json({ reply: finalText || "Sorry, I couldn't find anything for that — try a different name or keyword." });
};

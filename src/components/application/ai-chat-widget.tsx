import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageChatCircle, Send01, Stars01, XClose } from "@untitledui/icons";
import { useAuthUser } from "@/hooks/use-auth-user";
import { cx } from "@/utils/cx";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

const WELCOME: ChatMessage = {
    role: "assistant",
    content: "Hi! Ask me for a client's page, a template, or a saved prompt — e.g. \"give me the template for host onboarding\" or \"find Oceanview's dashboard\".",
};

/** Renders assistant replies with bare `/paths` turned into clickable links. */
const MessageText = ({ text }: { text: string }) => {
    const parts = text.split(/(\/[a-z0-9-]+(?:\/[a-z0-9-]+)?)/gi);
    return (
        <>
            {parts.map((part, i) =>
                /^\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/i.test(part) ? (
                    <a key={i} href={part} target="_blank" rel="noreferrer" className="font-medium text-brand-secondary underline hover:no-underline">
                        {part}
                    </a>
                ) : (
                    <span key={i}>{part}</span>
                ),
            )}
        </>
    );
};

/**
 * Floating AI chat widget (bottom-right) — the internal team's assistant over
 * this app's own Supabase content. Calls the Netlify Function at
 * /.netlify/functions/ai-chat, which holds the Anthropic + Supabase
 * service-role keys server-side. Team-only (same @hiddengem.media gate as
 * the help menu it replaced in this position).
 */
export const AiChatWidget = () => {
    const { user } = useAuthUser();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    // Global shortcut: Shift + Q opens/closes the chat (same convention as Shift + F search).
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const el = document.activeElement as HTMLElement | null;
            const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
            if (e.shiftKey && (e.key === "Q" || e.key === "q") && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const isTeam = !!user?.email && user.email.toLowerCase().endsWith("@hiddengem.media");
    if (!isTeam) return null;

    const send = async (e: FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || loading) return;
        const next = [...messages, { role: "user" as const, content: text }];
        setMessages(next);
        setInput("");
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/.netlify/functions/ai-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Something went wrong.");
            setMessages((m) => [...m, { role: "assistant", content: json.reply }]);
        } catch (err) {
            setError(
                err instanceof Error && err.message
                    ? err.message
                    : "Couldn't reach the AI assistant — if you're testing locally, run `netlify dev` instead of `npm run dev` so the function is served.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div ref={containerRef} className="fixed right-4 bottom-4 z-50">
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 bottom-14 flex h-[520px] w-96 flex-col overflow-hidden rounded-2xl border border-secondary_alt bg-primary shadow-2xl"
                    >
                        <div className="flex items-center gap-2.5 border-b border-secondary px-4 py-3.5">
                            <span className="flex size-8 items-center justify-center rounded-full bg-brand-solid text-white">
                                <Stars01 className="size-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-primary">AI Assistant</p>
                                <p className="truncate text-xs text-tertiary">Searches this site's own content</p>
                            </div>
                            <button type="button" title="Close" onClick={() => setOpen(false)} className="flex size-7 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-secondary">
                                <XClose className="size-4" aria-hidden="true" />
                            </button>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
                            <div className="flex flex-col gap-3">
                                {messages.map((m, i) => (
                                    <div
                                        key={i}
                                        className={cx(
                                            "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                                            m.role === "user" ? "self-end bg-brand-solid text-white" : "self-start bg-secondary text-primary",
                                        )}
                                    >
                                        <MessageText text={m.content} />
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex max-w-[85%] items-center gap-1 self-start rounded-xl bg-secondary px-3.5 py-3">
                                        <span className="size-1.5 animate-bounce rounded-full bg-fg-quaternary [animation-delay:0ms]" />
                                        <span className="size-1.5 animate-bounce rounded-full bg-fg-quaternary [animation-delay:150ms]" />
                                        <span className="size-1.5 animate-bounce rounded-full bg-fg-quaternary [animation-delay:300ms]" />
                                    </div>
                                )}
                                {error && <p className="text-xs text-error-primary">{error}</p>}
                            </div>
                        </div>

                        <form onSubmit={send} className="flex items-center gap-2 border-t border-secondary p-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about a client, template, or prompt…"
                                className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                title="Send"
                                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-solid text-white transition duration-100 ease-linear hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Send01 className="size-4" aria-hidden="true" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="button"
                title="AI assistant"
                onClick={() => setOpen((o) => !o)}
                className="flex size-10 items-center justify-center rounded-full border border-secondary bg-primary text-secondary shadow-sm transition duration-100 ease-linear hover:bg-secondary hover:text-primary"
            >
                <MessageChatCircle className="size-5" aria-hidden="true" />
            </button>
        </div>
    );
};

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy01, Monitor01, Phone01, Settings01, XClose } from "@untitledui/icons";
import { supabase } from "@/lib/supabase";
import { cx } from "@/utils/cx";

/**
 * Welcome Email Flow builder — an AM tool living inside each client dashboard
 * (side-menu section). Three emails (Promotion → Reminder → Last Chance) built
 * from the Canva template structure (2026-07-03). Persists to welcome_flows.
 *
 * Editing UX (WYSIWYG, 2026-07-03): the email preview IS the editor —
 * double-click any text to edit it in place; buttons and images carry a ✎ pen
 * that opens a small popover with the name + link + Save; list sections get
 * inline “+ Add” / “×” controls. No forms, no panels. The HTML copied into
 * GoHighLevel is always rendered clean (no editing chrome).
 */

/* ── Types ───────────────────────────────────────────────────────── */

type FeatureItem = { image_url: string; image_link: string; heading: string };
type ListingItem = { image_url: string; image_link: string; title: string; subheading: string; text: string; cta_text: string; cta_url: string };
type Testimonial = { image_url: string; quote: string; guest: string; property: string };

interface FlowEmail {
    key: string;
    label: string;
    subject: string;
    hero: { heading: string; subheading: string; code: string; image_url: string; image_link: string; body: string; cta_text: string; cta_url: string };
    intro?: { heading: string; body: string };
    features?: { pill: string; heading: string; sub: string; items: FeatureItem[] };
    personal?: { image_url: string; body: string; signature: string; cta_text: string; cta_url: string };
    listings?: { pill: string; heading: string; sub: string; items: ListingItem[] };
    testimonials?: { pill: string; heading: string; sub: string; items: Testimonial[] };
    final_cta?: { heading: string; cta_text: string; cta_url: string };
}

interface FlowSettings {
    brand_color: string;
    heading_font: string;
    logo_url: string;
}

export interface WelcomeFlowData {
    settings: FlowSettings;
    waits: string[];
    emails: FlowEmail[];
}

/* ── Seed (Lagom Retreat example from the Canva file, with placeholders) ── */

const seedFlow = (clientName: string): WelcomeFlowData => {
    const name = clientName || "[brand name]";
    return {
        settings: { brand_color: "#5A7B4F", heading_font: "Georgia, 'Times New Roman', serif", logo_url: "" },
        waits: ["1 day", "1 day"],
        emails: [
            {
                key: "promo",
                label: "Email 1 · Promotion",
                subject: "Claim $100 Off or 10% Off",
                hero: {
                    heading: "Claim Your $150 Off",
                    subheading: "",
                    code: "WELCOME150",
                    image_url: "",
                    image_link: "",
                    body: "Your first stay comes with a little gift — book 2 nights or more and save. Don't wait, the offer expires soon.",
                    cta_text: "Redeem your offer",
                    cta_url: "",
                },
                intro: {
                    heading: `Discover Your Next Dream Vacation with ${name}`,
                    body:
                        `Welcome to ${name}, a [location] sanctuary designed for rest, reconnection, and the quiet beauty of nature.\n\n` +
                        "Whether for a solo reset, romantic escape, or family getaway, it's the perfect place to slow down and recharge. " +
                        "Enjoy [promotion — e.g. $150 off] stays of 3+ nights with code [promocode].",
                },
                features: {
                    pill: "Amenities",
                    heading: "What We Offer",
                    sub: "A few of the touches that make your stay special.",
                    items: [
                        { image_url: "", image_link: "", heading: "Heading — 8 words max" },
                        { image_url: "", image_link: "", heading: "Heading — 8 words max" },
                        { image_url: "", image_link: "", heading: "Heading — 8 words max" },
                        { image_url: "", image_link: "", heading: "Heading — 8 words max" },
                    ],
                },
                personal: {
                    image_url: "",
                    body:
                        "Escape the noise and embrace the art of \"just right\". Whether you are seeking a romantic reset, a solo recharge, " +
                        `or a place to unplug with family, ${name} is your perfect space to rest and reconnect.\n\n` +
                        "Book now and SAVE $150 on your stay of 3 nights or more — use code WELCOME150 at checkout.\n\nWe can't wait to welcome you.",
                    signature: `Warmly,\nThe ${name} Team`,
                    cta_text: "Redeem $150 OFF",
                    cta_url: "",
                },
            },
            {
                key: "reminder",
                label: "Email 2 · Reminder",
                subject: "Reminder — your welcome gift is waiting",
                hero: {
                    heading: "Enjoy $150 Off",
                    subheading: "Your First Stay",
                    code: "WELCOME150",
                    image_url: "",
                    image_link: "",
                    body: `Welcome to ${name}. As a thank you for joining us, enjoy $150 off your first stay of 3 nights or more with code WELCOME150.`,
                    cta_text: "Redeem [discount] OFF →",
                    cta_url: "",
                },
                listings: {
                    pill: "Our Listings",
                    heading: "Explore Our Cabins",
                    sub: "Explore our handpicked selection of top-tier properties available now.",
                    items: [
                        { image_url: "", image_link: "", title: "Listing/Category 1", subheading: "Sub heading — e.g. guest no., total listings", text: "Short description of this listing or category.", cta_text: "View Listings →", cta_url: "" },
                        { image_url: "", image_link: "", title: "Listing/Category 2", subheading: "Sub heading — e.g. guest no., total listings", text: "Short description of this listing or category.", cta_text: "View Listings →", cta_url: "" },
                        { image_url: "", image_link: "", title: "Listing/Category 3", subheading: "Sub heading — e.g. guest no., total listings", text: "Short description of this listing or category.", cta_text: "View Listings →", cta_url: "" },
                    ],
                },
            },
            {
                key: "lastchance",
                label: "Email 3 · Last Chance",
                subject: "Last chance — your offer ends soon",
                hero: {
                    heading: "Time is Running Out",
                    subheading: "",
                    code: "WELCOME150",
                    image_url: "",
                    image_link: "",
                    body: "Your chance to save on an unforgettable getaway is ending soon! Use code WELCOME150 at checkout to get $150 off your first booking of 3 nights or more.",
                    cta_text: "Redeem [discount] OFF",
                    cta_url: "",
                },
                testimonials: {
                    pill: "Testimonials",
                    heading: "Hear from Our Guests",
                    sub: `Don't just take our word for it. See what our guests are saying about their escape with ${name}.`,
                    items: [
                        { image_url: "", quote: "The Stargazer was beautifully designed with thoughtful touches. It was the ultimate lone getaway to relax and recharge.", guest: "Guest Name", property: "Property name" },
                        { image_url: "", quote: "The Stargazer was beautifully designed with thoughtful touches. I am looking forward to making this a yearly refresh.", guest: "Guest Name", property: "Property name" },
                    ],
                },
                final_cta: { heading: "Now, it's your turn to make memories.", cta_text: "Redeem [discount] OFF", cta_url: "" },
            },
        ],
    };
};

/* ── Email HTML renderer (email-safe tables + inline styles) ─────── */

const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nl2br = (s: string) => esc(s).replace(/\n/g, "<br/>");
/** Only sane link schemes make it into hrefs (incl. the HTML exported to GHL). */
const safeHref = (u: string) => {
    const t = (u || "").trim();
    return !t ? "#" : /^(https?:|mailto:|tel:|\/|#)/i.test(t) ? t : "#";
};
const linkWrap = (inner: string, href: string) =>
    href ? `<a href="${esc(safeHref(href))}" target="_blank" style="text-decoration:none;">${inner}</a>` : inner;
/** Settings values are interpolated into style/script blocks — whitelist hard. */
const safeColor = (c: string) => (/^[#a-zA-Z0-9(),.%\s-]{1,40}$/.test(c) ? c : "#5A7B4F");
const safeFont = (f: string) => (f || "").replace(/["<>&{}\\;]/g, "").slice(0, 80) || "Georgia, serif";

/**
 * Render one email. `interactive` adds the in-app WYSIWYG hooks (double-click
 * text editing, ✎ pens on buttons/images, add/remove on list items) — the HTML
 * copied into GoHighLevel is always rendered clean.
 */
export function emailHtml(email: FlowEmail, settings: FlowSettings, interactive = false): string {
    const ia = interactive;
    const brand = safeColor(settings.brand_color || "#5A7B4F");
    const serif = safeFont(settings.heading_font || "Georgia, serif");
    const sans = "Arial, Helvetica, sans-serif";

    /** data attributes for a double-click-editable text node */
    const ed = (path: string, ml = false) => (ia ? ` data-edit="${path}"${ml ? ` data-edit-ml="1"` : ""}` : "");
    /** ✎ pen badge (buttons / images / logo) */
    const pen = (kind: string, path: string, hasLink: boolean) =>
        ia ? `<span class="hgm-pen" data-kind="${kind}" data-path="${esc(path)}" data-haslink="${hasLink ? "1" : "0"}">&#9998;</span>` : "";
    /** × remove badge + wrapper for list items */
    const itemWrap = (inner: string, listPath: string, i: number) =>
        ia ? `<div style="position:relative;">${inner}<span class="hgm-x" data-remove="${listPath}.${i}">&#215;</span></div>` : inner;
    const addBtn = (listPath: string, label: string) => (ia ? `<div class="hgm-add" data-add="${listPath}">+ ${esc(label)}</div>` : "");

    const card = (inner: string) =>
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;margin:0 0 16px 0;"><tr><td style="padding:28px 24px;">${inner}</td></tr></table>`;
    const btn = (text: string, url: string, path: string) => {
        if (!text && !ia) return "";
        return (
            `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:18px auto 0;"><tr>` +
            `<td style="position:relative;background:${brand};border-radius:10px;">` +
            `<a href="${esc(safeHref(url))}" target="_blank" style="display:inline-block;padding:12px 32px;font-family:${sans};font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">${esc(text || "Button")}</a>` +
            pen("btn", path, true) +
            `</td></tr></table>`
        );
    };
    /** image (or edit-mode placeholder) with pen */
    const imgBlock = (url: string, link: string, alt: string, path: string, opts?: { radius?: number; height?: number; hasLink?: boolean }) => {
        const radius = opts?.radius ?? 12;
        const hasLink = opts?.hasLink ?? true;
        const core = url
            ? linkWrap(`<img src="${esc(url)}" alt="${esc(alt)}" width="100%" style="display:block;width:100%;border-radius:${radius}px;" />`, ia ? "" : link)
            : ia
              ? `<div style="height:${opts?.height ?? 140}px;background:#e7ebe2;border-radius:${radius}px;text-align:center;line-height:${opts?.height ?? 140}px;font:bold 12px ${sans};color:#8a9284;">Add image</div>`
              : "";
        if (!core) return "";
        return ia ? `<div style="position:relative;">${core}${pen("img", path, hasLink)}</div>` : core;
    };
    const circleImg = (url: string, path: string, size: number) => {
        const core = url
            ? `<img src="${esc(url)}" alt="" width="${size}" height="${size}" style="border-radius:50%;object-fit:cover;" />`
            : ia
              ? `<div style="display:inline-block;width:${size}px;height:${size}px;border-radius:50%;background:#e7ebe2;text-align:center;line-height:${size}px;font:bold 10px ${sans};color:#8a9284;">photo</div>`
              : "";
        if (!core) return "";
        return ia ? `<span style="position:relative;display:inline-block;">${core}${pen("img", path, false)}</span>` : core;
    };
    const pill = (text: string, path: string) =>
        text || ia
            ? `<div style="text-align:center;margin-bottom:10px;"><span${ed(path)} style="display:inline-block;background:#f2f2ef;border-radius:999px;padding:5px 16px;font-family:${sans};font-size:12px;color:#666;">${esc(text)}</span></div>`
            : "";
    const h2 = (text: string, path: string) =>
        `<h2${ed(path)} style="margin:0 0 8px;font-family:${serif};font-size:24px;font-weight:600;color:#1f2a1d;text-align:center;">${esc(text)}</h2>`;
    const subTxt = (text: string, path: string) =>
        text || ia
            ? `<p${ed(path)} style="margin:0 0 18px;font-family:${sans};font-size:14px;line-height:1.6;color:#666;text-align:center;">${esc(text)}</p>`
            : "";

    const parts: string[] = [];

    // Hero
    const h = email.hero;
    const logoHtml = settings.logo_url
        ? `<div style="text-align:center;margin-bottom:14px;"><span style="position:relative;display:inline-block;"><img src="${esc(settings.logo_url)}" alt="Logo" height="40" style="height:40px;" />${pen("logo", "__logo", false)}</span></div>`
        : ia
          ? `<div style="text-align:center;margin-bottom:14px;"><span style="position:relative;display:inline-block;background:#e7ebe2;border-radius:8px;padding:8px 22px;font:bold 12px ${sans};color:#8a9284;">LOGO${pen("logo", "__logo", false)}</span></div>`
          : "";
    parts.push(
        card(
            logoHtml +
                `<h1${ed("hero.heading")} style="margin:0 0 6px;font-family:${serif};font-size:30px;font-weight:600;color:#1f2a1d;text-align:center;">${esc(h.heading)}</h1>` +
                (h.subheading || ia
                    ? `<p${ed("hero.subheading")} style="margin:0 0 10px;font-family:${sans};font-size:16px;color:#333;text-align:center;">${esc(h.subheading)}</p>`
                    : "") +
                (h.code || ia
                    ? `<div style="text-align:center;margin:12px 0;"><span style="display:inline-block;background:#f1f3ee;border-radius:999px;padding:7px 18px;font-family:${sans};font-size:13px;color:#333;">Use code <b${ed("hero.code")} style="color:#b98a00;">${esc(h.code)}</b> at checkout.</span></div>`
                    : "") +
                `<div style="margin:14px 0 0;">${imgBlock(h.image_url, h.image_link, h.heading, "hero")}</div>` +
                `<p${ed("hero.body", true)} style="margin:18px 0 0;font-family:${sans};font-size:14px;line-height:1.7;color:#333;text-align:center;">${nl2br(h.body)}</p>` +
                btn(h.cta_text, h.cta_url, "hero"),
        ),
    );

    // Intro (email 1)
    if (email.intro) {
        parts.push(
            card(
                h2(email.intro.heading, "intro.heading") +
                    `<p${ed("intro.body", true)} style="margin:10px 0 0;font-family:${sans};font-size:14px;line-height:1.7;color:#333;">${nl2br(email.intro.body)}</p>`,
            ),
        );
    }

    // Features / Amenities (email 1)
    if (email.features) {
        const f = email.features;
        const rows = f.items
            .map((it, i) =>
                itemWrap(
                    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8f3;border-radius:12px;margin:0 0 10px;"><tr>` +
                        `<td width="72" style="padding:10px;">${imgBlock(it.image_url, it.image_link, it.heading, `features.items.${i}`, { radius: 8, height: 64 }) || ""}</td>` +
                        `<td style="padding:10px 14px;"><span${ed(`features.items.${i}.heading`)} style="font-family:${sans};font-size:14px;font-weight:bold;color:#1f2a1d;">${esc(it.heading)}</span></td></tr></table>`,
                    "features.items",
                    i,
                ),
            )
            .join("");
        parts.push(card(pill(f.pill, "features.pill") + h2(f.heading, "features.heading") + subTxt(f.sub, "features.sub") + rows + addBtn("features.items", "Add amenity")));
    }

    // Listings (email 2)
    if (email.listings) {
        const l = email.listings;
        const cards = l.items
            .map((it, i) =>
                itemWrap(
                    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafbf8;border:1px solid #eceee8;border-radius:14px;margin:0 0 14px;"><tr><td style="padding:14px;">` +
                        imgBlock(it.image_url, it.image_link, it.title, `listings.items.${i}`) +
                        `<h3${ed(`listings.items.${i}.title`)} style="margin:12px 0 2px;font-family:${serif};font-size:18px;font-weight:600;color:#1f2a1d;">${esc(it.title)}</h3>` +
                        `<p${ed(`listings.items.${i}.subheading`)} style="margin:0 0 6px;font-family:${sans};font-size:12px;color:#888;">${esc(it.subheading)}</p>` +
                        `<p${ed(`listings.items.${i}.text`, true)} style="margin:0;font-family:${sans};font-size:14px;line-height:1.6;color:#444;">${nl2br(it.text)}</p>` +
                        btn(it.cta_text, it.cta_url, `listings.items.${i}`) +
                        `</td></tr></table>`,
                    "listings.items",
                    i,
                ),
            )
            .join("");
        parts.push(card(pill(l.pill, "listings.pill") + h2(l.heading, "listings.heading") + subTxt(l.sub, "listings.sub") + cards + addBtn("listings.items", "Add listing")));
    }

    // Personal touch (email 1)
    if (email.personal) {
        const p = email.personal;
        parts.push(
            card(
                `<div style="text-align:center;margin-bottom:16px;">${circleImg(p.image_url, "personal", 120)}</div>` +
                    `<p${ed("personal.body", true)} style="margin:0;font-family:${sans};font-size:14px;line-height:1.7;color:#333;">${nl2br(p.body)}</p>` +
                    `<p${ed("personal.signature", true)} style="margin:16px 0 0;font-family:${sans};font-size:14px;line-height:1.7;color:#333;">${nl2br(p.signature)}</p>` +
                    btn(p.cta_text, p.cta_url, "personal"),
            ),
        );
    }

    // Testimonials (email 3)
    if (email.testimonials) {
        const t = email.testimonials;
        const cards = t.items
            .map((it, i) =>
                itemWrap(
                    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8f3;border-radius:14px;margin:0 0 14px;"><tr><td style="padding:20px;text-align:center;">` +
                        circleImg(it.image_url, `testimonials.items.${i}`, 72) +
                        `<div style="margin:8px 0 6px;font-size:16px;color:#f0a800;letter-spacing:2px;">★★★★★</div>` +
                        `<p style="margin:0 0 10px;font-family:${sans};font-size:14px;line-height:1.7;color:#333;">"<span${ed(`testimonials.items.${i}.quote`, true)}>${nl2br(it.quote)}</span>"</p>` +
                        `<p style="margin:0;font-family:${sans};font-size:13px;font-weight:bold;color:${brand};"><span${ed(`testimonials.items.${i}.guest`)}>${esc(it.guest)}</span> — <span${ed(`testimonials.items.${i}.property`)}>${esc(it.property)}</span></p>` +
                        `<p style="margin:6px 0 0;font-family:${sans};font-size:11px;color:#999;">✓ Verified review</p>` +
                        `</td></tr></table>`,
                    "testimonials.items",
                    i,
                ),
            )
            .join("");
        parts.push(card(pill(t.pill, "testimonials.pill") + h2(t.heading, "testimonials.heading") + subTxt(t.sub, "testimonials.sub") + cards + addBtn("testimonials.items", "Add review")));
    }

    // Final CTA (email 3)
    if (email.final_cta) {
        parts.push(card(h2(email.final_cta.heading, "final_cta.heading") + btn(email.final_cta.cta_text, email.final_cta.cta_url, "final_cta")));
    }

    const interactiveExtras = ia
        ? `<style>
[data-edit]{border-radius:4px;}
[data-edit]:hover{outline:1.5px dashed ${brand};outline-offset:2px;cursor:text;}
[data-edit][contenteditable="true"]{outline:2px solid ${brand};outline-offset:2px;background:#fffdf2;}
.hgm-pen{position:absolute;top:-10px;right:-10px;width:24px;height:24px;background:${brand};color:#fff;border-radius:999px;text-align:center;line-height:24px;font:13px ${sans};cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.35);z-index:9;}
.hgm-pen:hover{transform:scale(1.12);}
.hgm-x{position:absolute;top:-8px;left:-8px;width:22px;height:22px;background:#d92d20;color:#fff;border-radius:999px;text-align:center;line-height:20px;font:bold 14px ${sans};cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.35);z-index:9;opacity:0;transition:opacity .12s;}
div:hover>.hgm-x{opacity:1;}
.hgm-add{border:1.5px dashed #b9c2b0;border-radius:10px;padding:9px;text-align:center;color:#8a9284;font:bold 12px ${sans};cursor:pointer;margin-top:4px;}
.hgm-add:hover{border-color:${brand};color:${brand};}
</style>` +
          `<script>(function(){
var K=${JSON.stringify(email.key)};
var send=function(m){m.k=K;parent.postMessage(m,'*')};
document.addEventListener('click',function(e){
  var pen=e.target.closest('.hgm-pen');
  if(pen){e.preventDefault();e.stopPropagation();var r=pen.getBoundingClientRect();
    send({hgm:'pen',kind:pen.getAttribute('data-kind'),path:pen.getAttribute('data-path'),haslink:pen.getAttribute('data-haslink')==='1',x:r.left,y:r.bottom});return;}
  var x=e.target.closest('.hgm-x');
  if(x){e.preventDefault();e.stopPropagation();send({hgm:'remove',path:x.getAttribute('data-remove')});return;}
  var ad=e.target.closest('.hgm-add');
  if(ad){e.preventDefault();send({hgm:'add',path:ad.getAttribute('data-add')});return;}
  var a=e.target.closest('a');
  if(a){e.preventDefault();}
  send({hgm:'bg'});
},true);
document.addEventListener('dblclick',function(e){
  var el=e.target.closest('[data-edit]');if(!el)return;
  e.preventDefault();el.setAttribute('data-orig',el.innerHTML);el.setAttribute('contenteditable','true');el.focus();
  var sel=window.getSelection(),rg=document.createRange();rg.selectNodeContents(el);sel.removeAllRanges();sel.addRange(rg);
});
document.addEventListener('keydown',function(e){
  var el=e.target&&e.target.closest?e.target.closest('[data-edit]'):null;
  if(!el||el.getAttribute('contenteditable')!=='true')return;
  if(e.key==='Enter'&&!el.hasAttribute('data-edit-ml')){e.preventDefault();el.blur();}
  if(e.key==='Escape'){el.innerHTML=el.getAttribute('data-orig')||el.innerHTML;el.setAttribute('data-cancel','1');el.blur();}
},true);
document.addEventListener('blur',function(e){
  var el=e.target;if(!el||!el.getAttribute||el.getAttribute('contenteditable')!=='true')return;
  el.removeAttribute('contenteditable');
  if(el.getAttribute('data-cancel')){el.removeAttribute('data-cancel');return;}
  send({hgm:'text',path:el.getAttribute('data-edit'),ml:el.hasAttribute('data-edit-ml'),value:el.innerText});
},true);
var st;window.addEventListener('scroll',function(){clearTimeout(st);st=setTimeout(function(){send({hgm:'scroll',y:window.scrollY})},80)});
window.addEventListener('message',function(e){if(e.data&&e.data.hgm==='scrollTo'){window.scrollTo(0,e.data.y)}});
})();</script>`
        : "";

    return (
        `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(email.subject)}</title></head>` +
        `<body style="margin:0;padding:0;background:#eef0ec;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0ec;"><tr><td align="center" style="padding:28px 12px;">` +
        `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">` +
        `<tr><td>${parts.join("")}</td></tr>` +
        `</table></td></tr></table>${interactiveExtras}</body></html>`
    );
}

/* ── Path helpers (edit messages address fields by dot-path) ─────── */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Paths come from postMessage — whitelist segments hard (no __proto__/constructor/etc).
const SAFE_SEG = /^(?!__proto__$|constructor$|prototype$)[a-zA-Z0-9_]+$/;
const safePath = (path: string) => path.length > 0 && path.split(".").every((k) => SAFE_SEG.test(k));
const getByPath = (obj: any, path: string): any =>
    safePath(path) ? path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj) : undefined;
const setByPath = (obj: any, path: string, val: unknown) => {
    if (!safePath(path)) return;
    const keys = path.split(".");
    const last = keys.pop()!;
    const target = keys.reduce((o, k) => (o == null ? o : o[k]), obj);
    if (target != null && typeof target === "object") target[last] = val;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const NEW_ITEMS: Record<string, () => unknown> = {
    "features.items": () => ({ image_url: "", image_link: "", heading: "New amenity" }),
    "listings.items": () => ({ image_url: "", image_link: "", title: "New listing", subheading: "", text: "Short description.", cta_text: "View Listings →", cta_url: "" }),
    "testimonials.items": () => ({ image_url: "", quote: "New review", guest: "Guest Name", property: "Property name" }),
};

/* ── Small primitives ────────────────────────────────────────────── */

const inputCls =
    "w-full rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-sm text-primary placeholder:text-placeholder outline-none transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand";

const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-quaternary">{label}</span>
        <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </label>
);

/** ✎ popover state — “change the name, attach a link, save”. */
interface PenState {
    kind: "btn" | "img" | "logo";
    path: string;
    emailKey: string; // which email the pen belongs to (survives tab races)
    hasLink: boolean;
    a: string; // name / image URL / logo URL
    b: string; // link
    x: number;
    y: number;
}

/* ── Main section component ──────────────────────────────────────── */

export const WelcomeFlowSection = ({
    slug,
    clientName,
    isLocked,
    isTemplate,
}: {
    slug?: string;
    clientName: string;
    isLocked: boolean;
    isTemplate: boolean;
}) => {
    const [flow, setFlow] = useState<WelcomeFlowData>(() => seedFlow(clientName));
    const [tab, setTab] = useState(0);
    const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
    const [copied, setCopied] = useState(false);
    const [penPop, setPenPop] = useState<PenState | null>(null);
    const [brandOpen, setBrandOpen] = useState(false);
    // rev bumps re-render the iframe (structure changed); plain text edits happen
    // in place inside the iframe and only sync state — no reload, no flicker.
    const [rev, setRev] = useState(0);
    const hydratedRef = useRef(false);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const previewWrapRef = useRef<HTMLDivElement | null>(null);
    const scrollYRef = useRef(0);
    const flowRef = useRef(flow);
    const tabRef = useRef(tab);
    const brandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    flowRef.current = flow;
    tabRef.current = tab;

    // Load the saved flow for this client.
    useEffect(() => {
        if (!slug || isTemplate) {
            hydratedRef.current = true;
            return;
        }
        supabase
            .from("welcome_flows")
            .select("data")
            .eq("slug", slug)
            .maybeSingle()
            .then(({ data: row, error }) => {
                const d = row?.data as WelcomeFlowData | undefined;
                if (!error && d && Array.isArray(d.emails) && d.emails.length === 3) {
                    setFlow(d);
                    setRev((r) => r + 1);
                }
                hydratedRef.current = true;
            });
    }, [slug, isTemplate]);

    // Debounced autosave while editing.
    useEffect(() => {
        if (!hydratedRef.current || !slug || isTemplate || isLocked) return;
        const t = setTimeout(() => {
            supabase
                .from("welcome_flows")
                .upsert({ slug, client_name: clientName, data: flow, updated_at: new Date().toISOString() }, { onConflict: "slug" })
                .then(({ error }) => {
                    if (error) console.error("[welcome flow autosave]", error);
                });
        }, 800);
        return () => clearTimeout(t);
    }, [flow, slug, isTemplate, isLocked, clientName]);

    const patch = (mutator: (draft: WelcomeFlowData) => void, structural = false) => {
        setFlow((prev) => {
            const next = JSON.parse(JSON.stringify(prev)) as WelcomeFlowData;
            mutator(next);
            return next;
        });
        if (structural) setRev((r) => r + 1);
    };

    // WYSIWYG messages from the preview iframe. Every message carries the email
    // key it was rendered for (m.k), so a blur racing a tab switch can never
    // write into the wrong email — we resolve the target by key, not by tab.
    useEffect(() => {
        const onMsg = (e: MessageEvent) => {
            if (e.source !== iframeRef.current?.contentWindow) return;
            const m = e.data as { hgm?: string; k?: string; path?: string; value?: string; ml?: boolean; kind?: string; haslink?: boolean; x?: number; y?: number };
            if (!m?.hgm) return;
            const emailIdx = flowRef.current.emails.findIndex((em) => em.key === m.k);

            if (m.hgm === "bg") {
                setPenPop(null);
                setBrandOpen(false);
                return;
            }
            if (m.hgm === "scroll") {
                // Ignore trailing scroll reports from a previous email's document.
                if (emailIdx === tabRef.current) scrollYRef.current = m.y ?? 0;
                return;
            }
            if (emailIdx < 0) return;

            if (m.hgm === "text" && m.path) {
                const raw = m.value ?? "";
                const value = m.ml ? raw.replace(/\n+$/, "") : raw.replace(/\s*\n\s*/g, " ").trim();
                patch((d) => setByPath(d.emails[emailIdx], m.path!, value));
                return;
            }
            if (m.hgm === "remove" && m.path) {
                const listPath = m.path.split(".").slice(0, -1).join(".");
                const idx = Number(m.path.split(".").pop());
                setPenPop(null); // any open pen may point at a now-shifted index
                patch((d) => {
                    const list = getByPath(d.emails[emailIdx], listPath) as unknown[] | undefined;
                    if (Array.isArray(list) && Number.isInteger(idx) && idx >= 0 && idx < list.length) list.splice(idx, 1);
                }, true);
                return;
            }
            if (m.hgm === "add" && m.path) {
                const make = NEW_ITEMS[m.path];
                patch((d) => {
                    const list = getByPath(d.emails[emailIdx], m.path!) as unknown[] | undefined;
                    if (Array.isArray(list) && make) list.push(make());
                }, true);
                return;
            }
            if (m.hgm === "pen" && m.path && m.kind) {
                const email = flowRef.current.emails[emailIdx];
                let a = "";
                let b = "";
                if (m.kind === "logo") {
                    a = flowRef.current.settings.logo_url;
                } else if (m.kind === "btn") {
                    const obj = getByPath(email, m.path) as { cta_text?: string; cta_url?: string } | undefined;
                    a = obj?.cta_text ?? "";
                    b = obj?.cta_url ?? "";
                } else {
                    const obj = getByPath(email, m.path) as { image_url?: string; image_link?: string } | undefined;
                    a = obj?.image_url ?? "";
                    b = obj?.image_link ?? "";
                }
                const ifr = iframeRef.current;
                const wrap = previewWrapRef.current;
                const rawX = (ifr?.offsetLeft ?? 0) + (m.x ?? 0) - 130;
                const rawY = (ifr?.offsetTop ?? 0) + (m.y ?? 0) + 8;
                // Real clamps: keep the ~288px-wide popover inside the preview area.
                const maxX = (wrap?.clientWidth ?? 800) - 300;
                const maxY = (wrap?.clientHeight ?? 800) - 290;
                setPenPop({
                    kind: m.kind as PenState["kind"],
                    path: m.path,
                    emailKey: m.k ?? "",
                    hasLink: !!m.haslink && m.kind !== "logo",
                    a,
                    b,
                    x: Math.max(8, Math.min(rawX, maxX)),
                    y: Math.max(8, Math.min(rawY, maxY)),
                });
            }
        };
        window.addEventListener("message", onMsg);
        return () => window.removeEventListener("message", onMsg);
    }, []);

    const savePen = () => {
        if (!penPop) return;
        patch((d) => {
            if (penPop.kind === "logo") {
                d.settings.logo_url = penPop.a.trim();
                return;
            }
            const email = d.emails.find((em) => em.key === penPop.emailKey);
            const obj = email ? (getByPath(email, penPop.path) as Record<string, string> | undefined) : undefined;
            if (!obj) return;
            if (penPop.kind === "btn") {
                obj.cta_text = penPop.a;
                obj.cta_url = penPop.b.trim();
            } else {
                obj.image_url = penPop.a.trim();
                if ("image_link" in obj || penPop.hasLink) obj.image_link = penPop.b.trim();
            }
        }, true);
        setPenPop(null);
    };

    const email = flow.emails[tab];
    // Recompute only on tab switch / structural change / lock toggle — inline text
    // edits keep the iframe document alive so typing never flickers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const previewHtml = useMemo(() => emailHtml(flowRef.current.emails[tab], flowRef.current.settings, !isLocked), [tab, rev, isLocked]);

    const restoreScroll = () => {
        const win = iframeRef.current?.contentWindow;
        if (win && !isLocked) setTimeout(() => win.postMessage({ hgm: "scrollTo", y: scrollYRef.current }, "*"), 30);
    };

    const copyHtml = () => {
        navigator.clipboard.writeText(emailHtml(email, flow.settings)).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    };

    /** Brand & timing changes re-render the preview, debounced so typing stays smooth. */
    const brandPatch = (mutator: (d: WelcomeFlowData) => void) => {
        patch(mutator);
        if (brandTimer.current) clearTimeout(brandTimer.current);
        brandTimer.current = setTimeout(() => setRev((r) => r + 1), 500);
    };

    return (
        <div>
            {/* Heading */}
            <div>
                <h2 className="text-display-xs font-semibold text-primary md:text-display-sm">Welcome Email Flow</h2>
                <p className="mt-1.5 text-md text-tertiary">
                    Three emails — Promotion → Reminder → Last Chance — sent {flow.waits[0] || "1 day"} apart. Copy each finished email into GoHighLevel.
                </p>
            </div>

            {/* Email tabs */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
                {flow.emails.map((e, i) => (
                    <button
                        key={e.key}
                        type="button"
                        onClick={() => {
                            setTab(i);
                            scrollYRef.current = 0;
                            setPenPop(null);
                        }}
                        className={cx(
                            "rounded-lg px-3.5 py-2 text-sm font-semibold transition duration-100 ease-linear",
                            tab === i ? "bg-brand-solid text-white" : "bg-primary text-secondary ring-1 ring-secondary hover:bg-secondary_hover",
                        )}
                    >
                        Email {i + 1}
                    </button>
                ))}
                <span className="ml-1 text-xs text-quaternary">
                    {tab > 0 ? `sent ${flow.waits[tab - 1] || "1 day"} after Email ${tab}` : "sent when the lead signs up"}
                </span>
            </div>

            {/* Edit toolbar */}
            {!isLocked && (
                <div className="mt-4 flex flex-wrap items-end gap-3">
                    <div className="min-w-64 flex-1">
                        <Field label="Subject line" value={email.subject} onChange={(v) => patch((d) => void (d.emails[tab].subject = v))} />
                    </div>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setBrandOpen((o) => !o)}
                            className={cx(
                                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ring-1 transition duration-100 ease-linear",
                                brandOpen ? "bg-brand-solid text-white ring-transparent" : "bg-primary text-secondary ring-secondary hover:bg-secondary_hover",
                            )}
                        >
                            <Settings01 className="size-4" aria-hidden="true" />
                            Brand & timing
                        </button>
                        <AnimatePresence>
                            {brandOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute right-0 z-30 mt-1.5 flex w-72 flex-col gap-2.5 rounded-xl bg-primary p-3.5 shadow-lg ring-1 ring-secondary"
                                >
                                    <Field label="Brand color (buttons)" value={flow.settings.brand_color} onChange={(v) => brandPatch((d) => void (d.settings.brand_color = v))} placeholder="#5A7B4F" />
                                    <Field label="Heading font (brand font)" value={flow.settings.heading_font} onChange={(v) => brandPatch((d) => void (d.settings.heading_font = v))} placeholder="Georgia, serif" />
                                    <Field label="Logo URL" value={flow.settings.logo_url} onChange={(v) => brandPatch((d) => void (d.settings.logo_url = v))} placeholder="https://…" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field label="Wait after Email 1" value={flow.waits[0]} onChange={(v) => patch((d) => void (d.waits[0] = v))} placeholder="1 day" />
                                        <Field label="Wait after Email 2" value={flow.waits[1]} onChange={(v) => patch((d) => void (d.waits[1] = v))} placeholder="1 day" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {!isLocked && (
                <p className="mt-3 text-sm text-tertiary">
                    <span className="font-semibold text-secondary">Double-click</span> any text in the email to edit it · click the{" "}
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand-solid text-[11px] text-white">✎</span> on buttons and
                    images to change the name and link.
                </p>
            )}

            {/* ── Preview = the editor ── */}
            <div className="mt-4 flex flex-col rounded-2xl ring-1 ring-secondary">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-2xl border-b border-secondary bg-primary px-3 py-2">
                    <div className="flex items-center gap-1">
                        {(
                            [
                                { id: "mobile", icon: Phone01 },
                                { id: "desktop", icon: Monitor01 },
                            ] as const
                        ).map((v) => (
                            <button
                                key={v.id}
                                type="button"
                                onClick={() => setDevice(v.id)}
                                className={cx(
                                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition duration-100 ease-linear",
                                    device === v.id ? "bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300" : "text-tertiary hover:text-primary",
                                )}
                            >
                                <v.icon className="size-3.5" aria-hidden="true" />
                                {v.id === "mobile" ? "Mobile" : "Desktop"}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={copyHtml}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-solid px-3 py-1.5 text-xs font-semibold text-white transition duration-100 ease-linear hover:opacity-90"
                    >
                        {copied ? <Check className="size-3.5" /> : <Copy01 className="size-3.5" />}
                        {copied ? "Copied!" : "Copy HTML for GHL"}
                    </button>
                </div>

                <div ref={previewWrapRef} className="relative flex justify-center rounded-b-2xl bg-tertiary p-4" onClick={() => { setBrandOpen(false); setPenPop(null); }}>
                    <iframe
                        ref={iframeRef}
                        title={`${email.label} preview`}
                        srcDoc={previewHtml}
                        sandbox={isLocked ? "" : "allow-scripts"}
                        onLoad={restoreScroll}
                        className="rounded-xl bg-white shadow-lg ring-1 ring-secondary"
                        style={{ width: device === "mobile" ? 375 : 620, height: isLocked ? 640 : 780, border: "0", maxWidth: "100%" }}
                    />

                    {/* ✎ popover — change the name, attach a link, save */}
                    <AnimatePresence>
                        {penPop && !isLocked && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97, y: 4 }}
                                transition={{ duration: 0.12 }}
                                className="absolute z-30 flex w-72 flex-col gap-2.5 rounded-xl bg-primary p-3.5 shadow-lg ring-1 ring-secondary"
                                style={{ left: penPop.x, top: penPop.y }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-wide text-quaternary">
                                        {penPop.kind === "btn" ? "Edit button" : penPop.kind === "logo" ? "Edit logo" : "Edit image"}
                                    </p>
                                    <button type="button" title="Close" onClick={() => setPenPop(null)} className="text-fg-quaternary hover:text-fg-secondary">
                                        <XClose className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                                <Field
                                    label={penPop.kind === "btn" ? "Name" : penPop.kind === "logo" ? "Logo image URL" : "Image URL (from GoHighLevel)"}
                                    value={penPop.a}
                                    onChange={(v) => setPenPop((p) => (p ? { ...p, a: v } : p))}
                                    placeholder={penPop.kind === "btn" ? "Button text" : "https://…"}
                                />
                                {penPop.hasLink && (
                                    <Field label="Link" value={penPop.b} onChange={(v) => setPenPop((p) => (p ? { ...p, b: v } : p))} placeholder="https://…" />
                                )}
                                <button
                                    type="button"
                                    onClick={savePen}
                                    className="mt-0.5 rounded-lg bg-brand-solid px-3 py-2 text-sm font-semibold text-white transition duration-100 ease-linear hover:opacity-90"
                                >
                                    Save
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Read-only note */}
            {isLocked && (
                <p className="mt-3 text-sm text-tertiary">
                    Subject: <span className="font-semibold text-primary">{email.subject}</span>
                </p>
            )}
        </div>
    );
};

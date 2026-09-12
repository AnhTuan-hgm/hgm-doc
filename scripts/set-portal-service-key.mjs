/**
 * Put the PORTAL project's current service_role key on the docs-hgm site.
 *
 * WHY THIS EXISTS. Every help-centre Function calls verifyCaller, which calls
 * portalDb() with SUPABASE_SERVICE_ROLE_KEY. The value deployed today is
 * refused by the portal project (401 "Invalid API key"), so every client gets
 * "Not authorised." no matter who they are. The end-to-end proof reports it as
 * its first failure.
 *
 * It reads the key from Supabase and writes it to Netlify. The value is never
 * printed, never written to a file, and never passed on a command line.
 *
 * It also probes the key against the portal project BEFORE deploying it. The
 * last time this variable was changed, it was changed on the strength of a
 * probe against a MASK - Netlify returns a short placeholder for a variable
 * flagged secret - and a working credential was replaced with a broken one.
 * Proving the key first is what stops that happening twice.
 *
 *   node scripts/set-portal-service-key.mjs
 *
 * Needs SUPABASE_ACCESS_TOKEN and NETLIFY_ACCESS_TOKEN in the environment.
 */
const PORTAL_REF = "iymhjrmmgwrxdggcvmjn";
const SITE = "docs-hgm";

const need = (n) => {
    const v = process.env[n];
    if (!v) throw new Error(`${n} is not set in the environment`);
    return v;
};

const supabaseToken = need("SUPABASE_ACCESS_TOKEN");
const netlifyToken = need("NETLIFY_ACCESS_TOKEN");

const keysRes = await fetch(`https://api.supabase.com/v1/projects/${PORTAL_REF}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${supabaseToken}` },
});
if (!keysRes.ok) throw new Error(`Supabase refused the key listing: HTTP ${keysRes.status}`);
const keys = await keysRes.json();
const serviceKey = keys.find((k) => k.name === "service_role")?.api_key;
if (!serviceKey) throw new Error("the portal project has no service_role key");

const probe = await fetch(`https://${PORTAL_REF}.supabase.co/rest/v1/dashboard_pages?select=slug&limit=1`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
});
if (!probe.ok) throw new Error(`the key Supabase returned does not work against the portal project: HTTP ${probe.status}`);
console.log("the key works against the portal project (HTTP 200) - deploying it");

const sitesRes = await fetch("https://api.netlify.com/api/v1/sites?filter=all", {
    headers: { Authorization: `Bearer ${netlifyToken}` },
});
if (!sitesRes.ok) throw new Error(`Netlify refused the site listing: HTTP ${sitesRes.status}`);
const sites = await sitesRes.json();
const site = sites.find((s) => s.name === SITE);
if (!site) throw new Error(`no Netlify site called ${SITE} on this account`);

const url = `https://api.netlify.com/api/v1/accounts/${site.account_slug}/env/SUPABASE_SERVICE_ROLE_KEY?site_id=${site.id}`;
const put = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${netlifyToken}`, "content-type": "application/json" },
    body: JSON.stringify({ context: "all", value: serviceKey }),
});
if (!put.ok) throw new Error(`Netlify refused the update: HTTP ${put.status} ${(await put.text()).slice(0, 200)}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY updated on ${SITE}. Redeploy for it to take effect.`);

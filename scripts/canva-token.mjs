#!/usr/bin/env node
/**
 * Mint a Canva Connect API user token for CANVA_ACCESS_TOKEN.
 *
 * Canva issues Connect tokens only through OAuth 2.0 with PKCE — there is no personal
 * token to copy out of the Developer Portal. This script runs that flow once from your
 * machine: it opens the Canva consent page, catches the redirect on 127.0.0.1, exchanges
 * the code, and prints the access token plus the `netlify env:set` line to store it.
 *
 * Needs, in the environment (or pasted when prompted):
 *   CANVA_CLIENT_ID      from the integration's Credentials page
 *   CANVA_CLIENT_SECRET  the same page — "Generate secret" if you no longer have it
 *
 * One-time setup in https://www.canva.com/developers → Your integrations → the integration:
 *   Scopes          tick design:content:read and design:meta:read
 *   Authentication  add   http://127.0.0.1:3737/callback   under Authorized redirects
 *
 * Then:  node scripts/canva-token.mjs
 *
 * THE ACCESS TOKEN EXPIRES IN ABOUT FOUR HOURS. A refresh token is printed too, and it
 * rotates on every use, so a static value in Netlify is a stop-gap for testing an import —
 * the durable fix is the connect flow described in netlify/functions/canva-import.mts.
 */
import { exec } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { createInterface } from "node:readline/promises";

const REDIRECT = "http://127.0.0.1:3737/callback";
const SCOPES = "design:content:read design:meta:read";
const AUTHORIZE = "https://www.canva.com/api/oauth/authorize";
const TOKEN = "https://api.canva.com/rest/v1/oauth/token";

const b64url = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (name) => process.env[name] || (await rl.question(`${name}: `)).trim();
const clientId = await ask("CANVA_CLIENT_ID");
const clientSecret = await ask("CANVA_CLIENT_SECRET");
rl.close();
if (!clientId || !clientSecret) {
    console.error("Both CANVA_CLIENT_ID and CANVA_CLIENT_SECRET are required.");
    process.exit(1);
}

const verifier = b64url(randomBytes(64));
const challenge = b64url(createHash("sha256").update(verifier).digest());
const state = b64url(randomBytes(24));

const url = new URL(AUTHORIZE);
url.search = new URLSearchParams({
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: SCOPES,
    response_type: "code",
    client_id: clientId,
    state,
    redirect_uri: REDIRECT,
}).toString();

const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
        const u = new URL(req.url, REDIRECT);
        if (u.pathname !== "/callback") {
            res.writeHead(404).end();
            return;
        }
        const err = u.searchParams.get("error");
        if (err) {
            res.writeHead(400, { "Content-Type": "text/plain" }).end(`Canva returned: ${err}`);
            server.close();
            reject(new Error(err));
            return;
        }
        if (u.searchParams.get("state") !== state) {
            res.writeHead(400, { "Content-Type": "text/plain" }).end("State mismatch — run the script again.");
            return;
        }
        res.writeHead(200, { "Content-Type": "text/plain" }).end("Signed in. You can close this tab and go back to the terminal.");
        server.close();
        resolve(u.searchParams.get("code"));
    });
    server.listen(3737, "127.0.0.1", () => {
        console.log("\nOpen this in a browser signed in to the HiddenGem Canva account:\n\n" + url + "\n");
        // Best effort on macOS; harmless elsewhere.
        exec(`open "${url}"`, () => undefined);
    });
});

const res = await fetch(TOKEN, {
    method: "POST",
    headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code_verifier: verifier, code, redirect_uri: REDIRECT }),
});
const json = await res.json();
if (!res.ok) {
    console.error("Token exchange failed:", JSON.stringify(json, null, 2));
    process.exit(1);
}

const hours = Math.round((json.expires_in ?? 0) / 360) / 10;
console.log(`\nAccess token (expires in ~${hours} h):\n${json.access_token}\n`);
console.log(`Refresh token (single use — keep it if you plan to mint again without signing in):\n${json.refresh_token}\n`);
console.log("Store it on the site:\n");
console.log(`  netlify env:set CANVA_ACCESS_TOKEN "${json.access_token}"\n`);
console.log("Netlify functions read env at invocation, so no redeploy is needed. Repeat this when the token expires.");

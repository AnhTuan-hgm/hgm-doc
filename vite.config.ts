import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    // Dev only. `netlify dev` would serve the functions itself, but its SPA fallback
    // rewrites every route to /index.html and Vite then tries to import-analyse that as a
    // module, so pages render blank. Running the functions alone (`netlify functions:serve
    // --port 9999`) and proxying to them keeps Vite in charge of the page and still lets
    // /.netlify/functions/* work locally. Production is unaffected — Netlify routes these.
    server: {
        proxy: {
            "/.netlify/functions": "http://localhost:9999",
        },
    },
});

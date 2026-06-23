/**
 * /home2 — renders the standalone Globe Loader artifact (HiddenGem Stays),
 * served as a static file from /public/globe-loader.html. It pulls d3 + a
 * world atlas at runtime, so we embed it in an iframe rather than porting it.
 */
export const HomeTwoScreen = () => (
    <iframe
        src="/globe-loader.html"
        title="Globe Loader"
        className="h-dvh w-full border-0"
    />
);

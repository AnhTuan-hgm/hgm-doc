/**
 * Renders the standalone, pre-compiled "SOP Design System" app (served as a
 * static bundle from /public/designsystem) full-screen at /designsystem.
 * It ships its own React bundle, so we embed it in an iframe rather than
 * mounting it inside this SPA.
 */
export const DesignSystemScreen = () => (
    <iframe
        src="/designsystem/index.html"
        title="SOP Design System"
        className="h-dvh w-full border-0"
    />
);

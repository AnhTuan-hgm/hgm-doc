import { useNavigate } from "react-router";
import { motion } from "motion/react";

/** One stripe of the repeating equirectangular globe grid. Scrolled 2× for a seamless loop. */
const GlobeGridStripe = () => (
    <svg
        viewBox="0 0 800 400"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto shrink-0"
        aria-hidden="true"
    >
        {/* Latitude lines */}
        {[-80, -60, -40, -20, 0, 20, 40, 60, 80].map((lat) => {
            const y = ((90 - lat) / 180) * 400;
            return (
                <line
                    key={lat}
                    x1="0"
                    y1={y}
                    x2="800"
                    y2={y}
                    stroke="#4f6eb5"
                    strokeWidth={lat === 0 ? "0.8" : "0.5"}
                    opacity={lat === 0 ? "0.6" : "0.35"}
                />
            );
        })}

        {/* Longitude lines */}
        {Array.from({ length: 13 }, (_, i) => i * (800 / 12)).map((x, i) => (
            <line
                key={i}
                x1={x}
                y1="0"
                x2={x}
                y2="400"
                stroke="#4f6eb5"
                strokeWidth="0.5"
                opacity="0.35"
            />
        ))}
    </svg>
);

const Globe = () => (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {/* Outer glow */}
        <div
            className="absolute rounded-full"
            style={{
                width: "min(85vw, 85vh)",
                height: "min(85vw, 85vh)",
                background:
                    "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.06) 50%, transparent 70%)",
                filter: "blur(24px)",
                transform: "scale(1.25)",
            }}
        />

        {/* Sphere */}
        <div
            className="relative overflow-hidden rounded-full"
            style={{
                width: "min(85vw, 85vh)",
                height: "min(85vw, 85vh)",
                background:
                    "radial-gradient(circle at 38% 36%, rgba(30, 58, 110, 0.55), rgba(10, 18, 44, 0.7) 60%, rgba(4, 8, 22, 0.85))",
                boxShadow:
                    "inset 0 0 80px rgba(0,0,10,0.6), 0 0 60px rgba(59,130,246,0.08)",
            }}
        >
            {/* Scrolling grid — two stripes side-by-side for seamless loop */}
            <div
                className="flex h-full"
                style={{
                    width: "200%",
                    animation: "globe-scroll 28s linear infinite",
                }}
            >
                <GlobeGridStripe />
                <GlobeGridStripe />
            </div>

            {/* Radial vignette overlay to give sphere depth */}
            <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                    background:
                        "radial-gradient(circle at 50% 50%, transparent 42%, rgba(4,8,22,0.55) 72%, rgba(4,8,22,0.9) 100%)",
                }}
            />

            {/* Specular highlight */}
            <div
                className="pointer-events-none absolute"
                style={{
                    top: "8%",
                    left: "14%",
                    width: "26%",
                    height: "20%",
                    background:
                        "radial-gradient(ellipse, rgba(255,255,255,0.07) 0%, transparent 70%)",
                    borderRadius: "50%",
                    filter: "blur(8px)",
                }}
            />
        </div>

        {/* Outer ring */}
        <div
            className="pointer-events-none absolute rounded-full"
            style={{
                width: "min(85vw, 85vh)",
                height: "min(85vw, 85vh)",
                border: "1px solid rgba(99,102,241,0.18)",
            }}
        />
    </div>
);

export const LandingScreen = () => {
    const navigate = useNavigate();

    return (
        <main
            className="relative flex min-h-dvh flex-col items-center overflow-hidden"
            style={{ background: "linear-gradient(160deg, #05080f 0%, #060c1e 60%, #08112a 100%)" }}
        >
            {/* Animated globe fills the background */}
            <Globe />

            {/* Page content — centered over the globe */}
            <motion.div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
            >
                {/* HGM logo — dark version (white text + gold icon) */}
                <motion.img
                    src="/hgm logo/HiddenGem Media Logo - Dark.svg"
                    alt="HiddenGem Media"
                    className="h-10 md:h-12"
                    draggable={false}
                    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
                />

                {/* Title */}
                <motion.h1
                    className="font-semibold tracking-tight"
                    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
                    style={{
                        fontSize: "clamp(2rem, 5vw, 3.5rem)",
                        lineHeight: 1.15,
                        color: "rgba(255,255,255,0.92)",
                        textShadow: "0 0 40px rgba(99,102,241,0.35)",
                        marginTop: "-8px",
                    }}
                >
                    HiddenGem&nbsp;
                    <span style={{ color: "rgba(148,163,255,0.9)" }}>Docs</span>
                </motion.h1>

                {/* Back button */}
                <motion.button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="rounded-xl px-6 py-2.5 text-sm font-medium transition duration-150 ease-linear"
                    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
                    style={{
                        background: "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(255,255,255,0.12)",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
                        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.9)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
                    }}
                >
                    ← Back
                </motion.button>
            </motion.div>
        </main>
    );
};

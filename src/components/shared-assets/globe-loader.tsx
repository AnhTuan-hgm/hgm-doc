import { useEffect, useRef } from "react";

export interface GlobeLoaderProps {
    /** Rotation speed multiplier (1 = default). */
    spinSpeed?: number;
    /** Stroke / fill colour for the globe. Defaults to forest ink. */
    inkColor?: string;
    /** Show the lat/long graticule (meridians + parallels). Default true. */
    showGraticule?: boolean;
    /** Fill the globe with subtle drifting landmasses. Default false. */
    landFill?: boolean;
    /** Explicit pixel size. When omitted, renders as a full-screen overlay. */
    size?: number;
    /** Extra classes for the wrapper. */
    className?: string;
}

const R = 90; // globe radius in viewBox units
const C = 100; // centre
const MERIDIANS = 6;
const PARALLELS = [-60, -30, 0, 30, 60];

export const GlobeLoader = ({
    spinSpeed = 1,
    inkColor = "#1c3b27",
    showGraticule = true,
    landFill = false,
    size,
    className = "",
}: GlobeLoaderProps) => {
    const meridianRefs = useRef<(SVGEllipseElement | null)[]>([]);
    const landRef = useRef<SVGGElement | null>(null);

    // Animate the spin via direct attribute writes (no per-frame React re-render).
    useEffect(() => {
        let raf = 0;
        let start: number | null = null;
        const loop = (t: number) => {
            if (start === null) start = t;
            const phase = ((t - start) / 1000) * spinSpeed * 0.9;
            for (let i = 0; i < MERIDIANS; i++) {
                const el = meridianRefs.current[i];
                if (!el) continue;
                const angle = (i / MERIDIANS) * Math.PI + phase;
                const c = Math.abs(Math.cos(angle));
                el.setAttribute("rx", (c * R).toFixed(2));
                el.setAttribute("opacity", (0.22 + 0.5 * c).toFixed(2));
            }
            if (landRef.current) {
                const span = 2 * R;
                const tx = -(((phase * 26) % span) + span) % span;
                landRef.current.setAttribute("transform", `translate(${tx.toFixed(2)} 0)`);
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [spinSpeed]);

    const parallels = PARALLELS.map((lat) => {
        const rad = (lat * Math.PI) / 180;
        return { key: lat, y: C - R * Math.sin(rad), halfW: R * Math.cos(rad) };
    });

    const landBlob = (
        <g fill={inkColor} opacity={0.16}>
            <path d="M18,92 q14,-26 40,-16 q22,9 11,31 q-13,24 -40,13 q-23,-10 -11,-28 Z" />
            <ellipse cx="122" cy="68" rx="26" ry="18" />
            <ellipse cx="152" cy="120" rx="19" ry="26" />
            <ellipse cx="74" cy="138" rx="22" ry="13" />
        </g>
    );

    const dim = size ? `${size}px` : "min(62vmin, 440px)";

    const svg = (
        <svg viewBox="0 0 200 200" style={{ width: dim, height: dim }} role="img" aria-label="Loading">
            <defs>
                <clipPath id="globe-clip">
                    <circle cx={C} cy={C} r={R} />
                </clipPath>
            </defs>

            {landFill && (
                <g clipPath="url(#globe-clip)">
                    <circle cx={C} cy={C} r={R} fill={inkColor} opacity={0.05} />
                    <g ref={landRef}>
                        {landBlob}
                        <g transform={`translate(${2 * R} 0)`}>{landBlob}</g>
                    </g>
                </g>
            )}

            {showGraticule && (
                <g clipPath="url(#globe-clip)" stroke={inkColor} fill="none" strokeWidth={1.1} strokeLinecap="round">
                    {parallels.map((p) => (
                        <line key={p.key} x1={C - p.halfW} y1={p.y} x2={C + p.halfW} y2={p.y} opacity={0.45} />
                    ))}
                    {Array.from({ length: MERIDIANS }).map((_, i) => (
                        <ellipse
                            key={i}
                            ref={(el) => { meridianRefs.current[i] = el; }}
                            cx={C}
                            cy={C}
                            rx={R}
                            ry={R}
                        />
                    ))}
                </g>
            )}

            {/* Globe edge */}
            <circle cx={C} cy={C} r={R} fill="none" stroke={inkColor} strokeWidth={1.7} />
        </svg>
    );

    if (size) {
        return <span className={className} style={{ display: "inline-flex" }}>{svg}</span>;
    }

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}
            style={{ background: "#f6f6f2" }}
        >
            {svg}
        </div>
    );
};

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Fade-and-rise a block into view as it scrolls into the viewport.
 * Animates only once (no replay when scrolling back up).
 * Under prefers-reduced-motion it renders a plain static div — the complete,
 * motionless experience.
 */
export const Reveal = ({ children, className, delay = 0, y = 24 }: { children: ReactNode; className?: string; delay?: number; y?: number }) => {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            // Fire as soon as the block's top edge nears the viewport (pre-trigger 120px early)
            // so tall sections don't reveal "late" after you've scrolled into blank space.
            viewport={{ once: true, amount: 0, margin: "0px 0px 120px 0px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
        >
            {children}
        </motion.div>
    );
};

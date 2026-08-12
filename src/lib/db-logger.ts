import chalk from "chalk";

/**
 * Colored dev-console logging for Supabase persistence operations.
 * Only runs in dev (console logs in browser dev tools).
 */
export const dbLogger = {
    success: (message: string) => {
        if (import.meta.env.DEV) {
            console.log(chalk.green(`✓`) + ` ${message}`);
        }
    },

    error: (message: string, err?: Error) => {
        if (import.meta.env.DEV) {
            console.error(chalk.red(`✗`) + ` ${message}`);
            if (err) console.error(chalk.dim(err.message));
        }
    },

    warn: (message: string) => {
        if (import.meta.env.DEV) {
            console.warn(chalk.yellow(`⚠️`) + ` ${message}`);
        }
    },
};

import chalk from "chalk";

/**
 * Dual-write + fallback logging for db-sync operations.
 * Only runs in dev (console logs in browser dev tools).
 */
export const dbLogger = {
  dualWrite: (table: string, action: "insert" | "update" | "delete", target: "supabase" | "firebase") => {
    if (import.meta.env.DEV) {
      console.log(
        chalk.cyan(`[DB]`) +
        ` ${table}:${action}` +
        (target === "supabase" ? chalk.blue(` → supabase`) : chalk.yellow(` → firebase`))
      );
    }
  },

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

  fallback: (table: string, reason: string) => {
    if (import.meta.env.DEV) {
      console.warn(
        chalk.yellow(`⚠️  Fallback to Firebase:`) +
        ` ${table} (${reason})`
      );
    }
  },

  warn: (message: string) => {
    if (import.meta.env.DEV) {
      console.warn(chalk.yellow(`⚠️`) + ` ${message}`);
    }
  },
};

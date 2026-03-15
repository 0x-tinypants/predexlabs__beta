/* =========================================================
   PreDEX Structured Logger
   Clean, deduplicated, database-style logging
========================================================= */

type LogLevel =
  | "wallet"
  | "sync"
  | "tx"
  | "warn"
  | "error";

/* ---------------------------------------------------------
   Enable / Disable categories
--------------------------------------------------------- */

const LOG_LEVELS: Record<LogLevel, boolean> = {
  wallet: true,
  sync: true,
  tx: true,
  warn: true,
  error: true
};

/* ---------------------------------------------------------
   Prevent duplicate logs
--------------------------------------------------------- */

const recentLogs = new Set<string>();

function dedupe(key: string) {
  if (recentLogs.has(key)) return false;

  recentLogs.add(key);

  /* auto cleanup */
  setTimeout(() => {
    recentLogs.delete(key);
  }, 2000);

  return true;
}

/* ---------------------------------------------------------
   Base structured logger
--------------------------------------------------------- */

function emit(level: LogLevel, message: string, data?: any) {
  if (!LOG_LEVELS[level]) return;

  const timestamp = new Date().toISOString();

  const logEntry = {
    time: timestamp,
    level,
    message,
    ...(data && { data })
  };

  const dedupeKey = JSON.stringify(logEntry);

  if (!dedupe(dedupeKey)) return;

  console.table([logEntry]);
}

/* =========================================================
   Logger API
========================================================= */

export const logger = {

  wallet(message: string, data?: any) {
    emit("wallet", message, data);
  },

  sync(message: string, data?: any) {
    emit("sync", message, data);
  },

  tx(message: string, data?: any) {
    emit("tx", message, data);
  },

  warn(message: string, data?: any) {
    emit("warn", message, data);
  },

  error(message: string, data?: any) {
    emit("error", message, data);
  }

};
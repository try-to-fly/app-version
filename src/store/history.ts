import Conf from "conf";
import os from "os";
import path from "path";
import dayjs from "dayjs";
import type { HistoryData, HistorySnapshot } from "../types/index.js";

const configDir = path.join(os.homedir(), ".app-version");

const historyStore = new Conf<HistoryData>({
  cwd: configDir,
  configName: "history",
  defaults: {
    lastCheckTime: "",
    snapshots: {},
  },
});

export function getLastCheckTime(): string {
  return historyStore.get("lastCheckTime");
}

export function setLastCheckTime(time: string): void {
  historyStore.set("lastCheckTime", time);
}

export function getSnapshot(key: string): HistorySnapshot | null {
  const snapshots = historyStore.get("snapshots");
  return snapshots[key] || null;
}

export function setSnapshot(key: string, version: string): void {
  const snapshots = historyStore.get("snapshots");
  snapshots[key] = {
    version,
    recordedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
  historyStore.set("snapshots", snapshots);
}

export function getAllSnapshots(): Record<string, HistorySnapshot> {
  return historyStore.get("snapshots");
}

export function updateCheckTime(): void {
  setLastCheckTime(dayjs().format("YYYY-MM-DD HH:mm:ss"));
}

// Append-only execution history for debugging cron/automation.
// JSONL keeps writes simple and resilient (one line per run).
export async function appendRunHistory(entry: Record<string, unknown>): Promise<void> {
  const logPath = path.join(configDir, "cron-history.jsonl");
  const payload = {
    ts: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    ...entry,
  };
  try {
    // Keep this sync + dependency-free at call sites; use Node's createRequire
    // because the bundle runs as ESM and dynamic require("fs") is not supported.
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const fs = require("node:fs") as typeof import("node:fs");

    fs.mkdirSync(configDir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(payload) + "\n", "utf8");
  } catch (err) {
    // Never fail the command due to debug logging.
    if (process.env.APP_VERSION_DEBUG_HISTORY === "1") {
      // eslint-disable-next-line no-console
      console.error("[app-version] appendRunHistory failed:", err);
    }
  }
}

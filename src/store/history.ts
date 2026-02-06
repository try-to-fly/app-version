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

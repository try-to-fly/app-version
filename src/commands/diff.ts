import { getRepos } from "../store/config.js";
import { getLatestVersions } from "../services/version.js";
import {
  appendRunHistory,
  getSnapshot,
  setSnapshot,
  updateCheckTime,
} from "../store/history.js";
import { outputDiffList } from "../utils/output.js";
import type { OutputFormat, DiffResult } from "../types/index.js";

interface DiffOptions {
  format: OutputFormat;
}

function parseLocalTsToMs(ts: string): number {
  // history.ts uses "YYYY-MM-DD HH:mm:ss" (no TZ). Treat as local time.
  // Converting to ISO-ish string keeps Date.parse happy on Node.
  return Date.parse(ts.replace(" ", "T") + ":00");
}

export async function diffCommand(options: DiffOptions): Promise<void> {
  const startedAt = Date.now();
  const repos = getRepos();

  if (repos.length === 0) {
    console.log("仓库列表为空，请使用 add 命令添加仓库");
    await appendRunHistory({
      cmd: "diff",
      ok: true,
      reason: "empty_repos",
      durationMs: Date.now() - startedAt,
    });
    return;
  }

  // diff: fetch latest versions for comparison, but do not write cache.json.
  const releases = await getLatestVersions(repos, true, 8, false);

  const diffs: DiffResult[] = [];
  const toUpdateBaseline: { key: string; version: string; hadSnapshot: boolean; changed: boolean }[] = [];

  for (const release of releases) {
    const key = release.repo.content;
    const snapshot = getSnapshot(key);

    const hadSnapshot = Boolean(snapshot);
    const changed = hadSnapshot ? snapshot!.version !== release.version : false;

    const oldAtMs = hadSnapshot ? parseLocalTsToMs(snapshot!.recordedAt) : NaN;
    const newAtMs = release.date && release.date !== "N/A" ? parseLocalTsToMs(release.date) : NaN;
    const timeWentBackwards =
      hadSnapshot && Number.isFinite(oldAtMs) && Number.isFinite(newAtMs) && newAtMs < oldAtMs;

    // Guardrail: never treat a "backwards" timestamp as an update.
    // This avoids false alerts when upstream returns stale data (e.g. cache) or
    // when tag/release metadata ordering is inconsistent.
    if (changed && timeWentBackwards) {
      // Stale cache / upstream inconsistency: re-fetch once (bypass cache) and decide by time.
      // NOTE: do not write cache from diff; we only want a reliable comparison.
      const [refetched] = await getLatestVersions([release.repo], true, 1, false);
      const refetchAtMs =
        refetched.date && refetched.date !== "N/A" ? parseLocalTsToMs(refetched.date) : NaN;
      const stillBackwards =
        hadSnapshot &&
        Number.isFinite(oldAtMs) &&
        Number.isFinite(refetchAtMs) &&
        refetchAtMs < oldAtMs;

      await appendRunHistory({
        cmd: "diff",
        ok: true,
        reason: "time_went_backwards",
        repo: key,
        snapshotVersion: snapshot!.version,
        releaseVersion: release.version,
        snapshotAt: snapshot!.recordedAt,
        releaseAt: release.date,
        refetchVersion: refetched.version,
        refetchAt: refetched.date,
        resolved: !stillBackwards,
      });

      if (stillBackwards) {
        continue;
      }

      // Use refetched data as the effective release.
      release.version = refetched.version;
      release.date = refetched.date;
    }

    if (changed) {
      diffs.push({
        repo: release.repo,
        oldVersion: snapshot!.version,
        newVersion: release.version,
        oldDate: snapshot!.recordedAt,
        newDate: release.date,
      });
    }

    // Baseline update:
    // - no snapshot: initialize baseline (no push)
    // - changed: update baseline after reporting to avoid duplicate alerts
    if (!hadSnapshot || changed) {
      toUpdateBaseline.push({ key, version: release.version, hadSnapshot, changed });
    }
  }

  if (diffs.length > 0) {
    updateCheckTime();
  }

  for (const u of toUpdateBaseline) {
    if (!u.hadSnapshot || u.changed) {
      setSnapshot(u.key, u.version);
    }
  }

  outputDiffList(diffs, options.format);

  await appendRunHistory({
    cmd: "diff",
    ok: true,
    repoCount: repos.length,
    diffCount: diffs.length,
    durationMs: Date.now() - startedAt,
  });
}

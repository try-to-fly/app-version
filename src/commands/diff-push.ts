import { getRepos } from "../store/config.js";
import { getLatestVersions } from "../services/version.js";
import {
  appendRunHistory,
  getSnapshot,
  setSnapshot,
  updateCheckTime,
} from "../store/history.js";
import { outputDiffList } from "../utils/output.js";
import { sendOpenclawMessage } from "../services/notify.js";
import type { DiffResult, OutputFormat } from "../types/index.js";

interface DiffPushOptions {
  format: OutputFormat;
  channel: string;
  target: string;
  title?: string;
}

function parseLocalTsToMs(ts: string): number {
  return Date.parse(ts.replace(" ", "T") + ":00");
}

export async function diffPushCommand(options: DiffPushOptions): Promise<void> {
  const startedAt = Date.now();
  const repos = getRepos();

  if (repos.length === 0) {
    console.log("仓库列表为空，请使用 add 命令添加仓库");
    await appendRunHistory({
      cmd: "diff-push",
      ok: true,
      reason: "empty_repos",
      durationMs: Date.now() - startedAt,
    });
    return;
  }

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

    if (changed && timeWentBackwards) {
      const [refetched] = await getLatestVersions([release.repo], true, 1, false);
      const refetchAtMs =
        refetched.date && refetched.date !== "N/A" ? parseLocalTsToMs(refetched.date) : NaN;
      const stillBackwards =
        hadSnapshot &&
        Number.isFinite(oldAtMs) &&
        Number.isFinite(refetchAtMs) &&
        refetchAtMs < oldAtMs;

      await appendRunHistory({
        cmd: "diff-push",
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

    if (!hadSnapshot || changed) {
      toUpdateBaseline.push({ key, version: release.version, hadSnapshot, changed });
    }
  }

  // If there are no diffs, keep behaviour consistent with markdown output: emit nothing.
  if (diffs.length === 0 && options.format === "markdown") {
    await appendRunHistory({
      cmd: "diff-push",
      ok: true,
      repoCount: repos.length,
      diffCount: 0,
      durationMs: Date.now() - startedAt,
    });
    return;
  }

  // Render message payload in-process (capture stdout).
  // We want a single send + single baseline update decision.
  let rendered = "";
  if (options.format === "markdown") {
    // markdown output is stable enough; reuse formatter by capturing console.
    const orig = console.log;
    const chunks: string[] = [];
    console.log = (...args: unknown[]) => {
      chunks.push(args.map((a) => String(a)).join(" "));
    };
    try {
      outputDiffList(diffs, "markdown");
    } finally {
      console.log = orig;
    }
    rendered = chunks.join("\n").trim();
  } else {
    // For non-markdown, keep current behaviour: just print and skip pushing.
    // (We can extend later if needed.)
    outputDiffList(diffs, options.format);
    await appendRunHistory({
      cmd: "diff-push",
      ok: true,
      repoCount: repos.length,
      diffCount: diffs.length,
      durationMs: Date.now() - startedAt,
      note: "non_markdown_no_push",
    });
    return;
  }

  if (!rendered) {
    await appendRunHistory({
      cmd: "diff-push",
      ok: true,
      repoCount: repos.length,
      diffCount: diffs.length,
      durationMs: Date.now() - startedAt,
      reason: "empty_render",
    });
    return;
  }

  // Send first; only update baseline when send succeeds.
  sendOpenclawMessage({
    channel: options.channel,
    target: options.target,
    title: options.title,
    message: rendered,
  });

  if (diffs.length > 0) {
    updateCheckTime();
  }

  for (const u of toUpdateBaseline) {
    if (!u.hadSnapshot || u.changed) {
      setSnapshot(u.key, u.version);
    }
  }

  await appendRunHistory({
    cmd: "diff-push",
    ok: true,
    repoCount: repos.length,
    diffCount: diffs.length,
    durationMs: Date.now() - startedAt,
  });
}

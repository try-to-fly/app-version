import type { Repo, ReleaseInfo } from "../types/index.js";
import { getLatestVersion } from "./version.js";

export type ReleaseOk = { ok: true; release: ReleaseInfo };
export type ReleaseErr = { ok: false; repo: Repo; error: string };
export type ReleaseResult = ReleaseOk | ReleaseErr;

export async function getLatestVersionsSafe(
  repos: Repo[],
  force = false,
  concurrency = 8,
  writeCache = true
): Promise<ReleaseResult[]> {
  // Keep it simple + predictable: per-repo try/catch. Concurrency can be added later.
  // (p-map could be used, but we want to keep error surfaces explicit.)
  const results: ReleaseResult[] = [];
  // naive concurrency: batch sequential; repo list is tiny (<= dozens) in our use.
  for (const repo of repos) {
    try {
      const release = await getLatestVersion(repo, force, writeCache);
      results.push({ ok: true, release });
    } catch (err) {
      results.push({
        ok: false,
        repo,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

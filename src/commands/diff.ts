import { getRepos } from "../store/config.js";
import { getLatestVersions } from "../services/version.js";
import {
  getSnapshot,
  setSnapshot,
  updateCheckTime,
} from "../store/history.js";
import { outputDiffList } from "../utils/output.js";
import type { OutputFormat, DiffResult } from "../types/index.js";

interface DiffOptions {
  format: OutputFormat;
}

export async function diffCommand(options: DiffOptions): Promise<void> {
  const repos = getRepos();

  if (repos.length === 0) {
    console.log("仓库列表为空，请使用 add 命令添加仓库");
    return;
  }

  // 获取当前最新版本
  const releases = await getLatestVersions(repos, true);

  // 比对版本变化
  const diffs: DiffResult[] = [];

  for (const release of releases) {
    const key = release.repo.content;
    const snapshot = getSnapshot(key);

    if (snapshot) {
      // 有历史记录，比对版本
      if (snapshot.version !== release.version) {
        diffs.push({
          repo: release.repo,
          oldVersion: snapshot.version,
          newVersion: release.version,
          oldDate: snapshot.recordedAt,
          newDate: release.date,
        });
      }
    }

    // 更新快照
    setSnapshot(key, release.version);
  }

  // 更新检查时间
  updateCheckTime();

  // 输出结果
  outputDiffList(diffs, options.format);
}

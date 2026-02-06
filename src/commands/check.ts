import { getRepos } from "../store/config.js";
import { getLatestVersions } from "../services/version.js";
import { outputVersionList } from "../utils/output.js";
import type { OutputFormat } from "../types/index.js";

interface CheckOptions {
  force: boolean;
  concurrency: number;
  format: OutputFormat;
}

export async function checkCommand(options: CheckOptions): Promise<void> {
  const repos = getRepos();

  if (repos.length === 0) {
    console.log("仓库列表为空，请使用 add 命令添加仓库");
    return;
  }

  const releases = await getLatestVersions(
    repos,
    options.force,
    options.concurrency
  );

  outputVersionList(releases, options.format);
}

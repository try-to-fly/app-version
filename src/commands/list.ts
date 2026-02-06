import { getRepos } from "../store/config.js";
import { outputRepoList } from "../utils/output.js";
import type { OutputFormat } from "../types/index.js";

export function listCommand(format: OutputFormat): void {
  const repos = getRepos();
  if (repos.length === 0) {
    console.log("仓库列表为空，请使用 add 命令添加仓库");
    return;
  }
  outputRepoList(repos, format);
}

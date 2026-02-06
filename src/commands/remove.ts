import { removeRepo, getRepos } from "../store/config.js";

export function removeCommand(content: string): void {
  const repos = getRepos();
  const repo = repos.find((r) => r.content === content);

  if (!repo) {
    console.error(`错误: 未找到仓库 "${content}"`);
    console.log("当前仓库列表:");
    repos.forEach((r) => console.log(`  - ${r.content}`));
    process.exit(1);
  }

  const success = removeRepo(content);
  if (success) {
    console.log(`已删除: ${content}`);
  }
}

import ms from "ms";
import { ReleaseInfo, Repo } from "../utils/type.js";
import { cache } from "../utils/config.js";
import dayjs from "dayjs";
import { getGitVersion } from "./git.js";
import { getVersionFromGithubRelease } from "../utils/index.js";

export async function getLatestRelease(
  repo: Repo,
  force = false,
): Promise<ReleaseInfo> {
  const chacheTime = ms("1h");
  const isCacheValid = (repo: string) => {
    return (
      cache.has(repo) &&
      dayjs().diff(dayjs(cache.get(repo).date), "millisecond") < chacheTime
    );
  };
  const { type, content } = repo;
  if (!force && isCacheValid(content)) {
    return cache.get(content);
  }
  try {
    const data = await getFromCommand(repo);
    if (data) {
      cache.set(content, data);
      return data;
    }

    switch (type) {
      case "Github":
        const { tag_name: version, published_at: date } =
          await getVersionFromGithubRelease(content);
        const data = {
          repo,
          version,
          date: dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
        };
        cache.set(content, data);
        return data;
      default:
        throw new Error(`未知的仓库类型: ${type} ${content})`);
    }
  } catch (error) {
    console.error(`获取 ${repo} 仓库信息失败:`, (error as Error).message);
    return { repo, version: "N/A", date: "N/A" };
  }
}
async function getFromCommand(repo: Repo) {
  switch (repo.command) {
    case "git":
      return {
        repo,
        ...(await getGitVersion()),
      };
  }
}

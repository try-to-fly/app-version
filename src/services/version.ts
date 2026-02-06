import dayjs from "dayjs";
import pMap from "p-map";
import type { Repo, ReleaseInfo } from "../types/index.js";
import { getGithubRelease, getGithubLatestTag } from "./github.js";
import { getBrewInfo } from "./brew.js";
import { getCache, isCacheValid, setCache } from "../store/cache.js";

// 获取单个仓库的最新版本
export async function getLatestVersion(
  repo: Repo,
  force = false
): Promise<ReleaseInfo> {
  const { type, content } = repo;

  // 检查缓存
  if (!force && isCacheValid(content)) {
    const cached = getCache(content)!;
    return {
      repo,
      version: cached.version,
      date: cached.date,
    };
  }

  try {
    let version: string;
    let date: string;

    switch (type) {
      case "github": {
        try {
          const release = await getGithubRelease(content);
          version = release.version;
          date = release.date
            ? dayjs(release.date).format("YYYY-MM-DD HH:mm:ss")
            : "N/A";
        } catch {
          // 如果没有 Release，尝试获取 Tag
          const tag = await getGithubLatestTag(content);
          version = tag.version;
          date = tag.date
            ? dayjs(tag.date).format("YYYY-MM-DD HH:mm:ss")
            : "N/A";
        }
        break;
      }
      case "brew": {
        const info = await getBrewInfo(content);
        version = info.version;
        date = "N/A"; // Homebrew API 不提供发布日期
        break;
      }
      default:
        throw new Error(`未知的仓库类型: ${type}`);
    }

    // 更新缓存
    setCache(content, version, date);

    return { repo, version, date };
  } catch (error) {
    console.error(`获取 ${content} 版本失败:`, (error as Error).message);
    return { repo, version: "N/A", date: "N/A" };
  }
}

// 批量获取版本
export async function getLatestVersions(
  repos: Repo[],
  force = false,
  concurrency = 8
): Promise<ReleaseInfo[]> {
  const results = await pMap(
    repos,
    (repo) => getLatestVersion(repo, force),
    { concurrency }
  );

  // 按日期排序，最新的在前面
  return results.sort((a, b) => {
    if (a.date === "N/A" && b.date === "N/A") return 0;
    if (a.date === "N/A") return 1;
    if (b.date === "N/A") return -1;
    return dayjs(b.date).unix() - dayjs(a.date).unix();
  });
}

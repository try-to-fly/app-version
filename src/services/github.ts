import { Octokit } from "@octokit/rest";
import { getGithubToken } from "../utils/env.js";

let octokit: Octokit | null = null;

function getOctokit(): Octokit {
  if (!octokit) {
    octokit = new Octokit({
      auth: getGithubToken(),
    });
  }
  return octokit;
}

export interface GithubRelease {
  version: string;
  date: string;
}

// 从 GitHub Release 获取最新版本
export async function getGithubRelease(content: string): Promise<GithubRelease> {
  const [owner, repo] = content.split("/");
  const response = await getOctokit().repos.getLatestRelease({
    owner,
    repo,
  });

  return {
    version: response.data.tag_name,
    date: response.data.published_at || "",
  };
}

// 从 GitHub Tags 获取最新版本（用于没有 Release 的仓库）
export async function getGithubLatestTag(content: string): Promise<GithubRelease> {
  const [owner, repo] = content.split("/");
  const response = await getOctokit().repos.listTags({
    owner,
    repo,
    per_page: 1,
  });

  if (response.data.length === 0) {
    return { version: "N/A", date: "N/A" };
  }

  const tag = response.data[0];

  // 获取 tag 对应的 commit 信息以获取日期
  const commitResponse = await getOctokit().repos.getCommit({
    owner,
    repo,
    ref: tag.commit.sha,
  });

  return {
    version: tag.name,
    date: commitResponse.data.commit.committer?.date || "",
  };
}

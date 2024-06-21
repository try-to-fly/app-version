import { Octokit } from "@octokit/rest";

const token = process.env.APP_GITHUB_TOKEN;

if (!token) {
  throw new Error("APP_GITHUB_TOKEN 环境变量未设置");
}

const octokit = new Octokit({
  auth: token,
});

/** 从 Github Release 获取版本 */
export const getVersionFromGithubRelease = async (content: string) => {
  const [owner, repo] = content.split("/");

  const response = await octokit.repos.getLatestRelease({
    owner,
    repo,
  });

  return {
    tag_name: response.data.tag_name,
    published_at: response.data.published_at,
  };
};

/** 获取Github Tags */
export const getTagsFromGithub = async (content: string) => {
  const [owner, repo] = content.split("/");

  const response = await octokit.repos.listTags({
    owner,
    repo,
  });

  return response.data.map((tag) => ({
    name: tag.name,
    commit: {
      sha: tag.commit.sha,
      url: tag.commit.url,
    },
  }));
};

/** 获取Github commit 详情 */
export const getCommitDetailFromGithub = async (
  content: string,
  sha: string,
) => {
  const [owner, repo] = content.split("/");

  const response = await octokit.repos.getCommit({
    owner,
    repo,
    ref: sha,
  });

  return {
    commit: {
      message: response.data.commit.message,
      committer: {
        date: response.data.commit.committer?.date,
      },
    },
  };
};

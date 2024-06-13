import got from "got";

/** 从 Github Release 获取版本 */
export const getVersionFromGithubRelease = async (content: string) => {
  const response = await got(
    `https://api.github.com/repos/${content}/releases/latest`,
    { responseType: "json" },
  ).json<{
    tag_name: string;
    published_at: string;
  }>();
  return response;
};

/** 获取Github Tags */
export const getTagsFromGithub = async (content: string) => {
  const response = await got(`https://api.github.com/repos/${content}/tags`, {
    responseType: "json",
  }).json<
    {
      name: string;
      commit: {
        sha: string;
        url: string;
      };
    }[]
  >();
  return response;
};

/** 获取Github commit 详情 */
export const getCommitDetailFromGithub = async (
  content: string,
  sha: string,
) => {
  const response = await got(
    `https://api.github.com/repos/${content}/commits/${sha}`,
    {
      responseType: "json",
    },
  ).json<{
    commit: {
      message: string;
      committer: {
        date: string;
      };
    };
  }>();

  return response;
};

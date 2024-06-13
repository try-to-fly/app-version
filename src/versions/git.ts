import {
  getCommitDetailFromGithub,
  getInfoFromBrew,
  getTagsFromGithub,
} from "../utils/index.js";

/** 获取 git 版本 */
export const getGitVersion = async () => {
  const {
    versions: { stable: version },
  } = await getInfoFromBrew("git");

  const tags = await getTagsFromGithub("git/git");

  const tag = tags.find((tag) => tag.name === `v${version}`);
  if (!tag) {
    return {
      version,
      date: "N/A",
    };
  }

  const commitInfo = await getCommitDetailFromGithub("git/git", tag.commit.sha);

  return {
    version,
    date: commitInfo.commit.committer.date,
  };
};

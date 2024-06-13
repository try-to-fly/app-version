import got from "got";

/** 从 brew 获取信息 */
export const getInfoFromBrew = async (content: string) => {
  const res = await got(
    `https://formulae.brew.sh/api/formula/${content}.json`,
    {
      responseType: "json",
    },
  ).json<{
    versions: {
      stable: string;
    };
  }>();

  return res;
};

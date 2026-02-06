import got from "got";

export interface BrewInfo {
  version: string;
}

// 从 Homebrew 获取版本信息
export async function getBrewInfo(formula: string): Promise<BrewInfo> {
  const res = await got(
    `https://formulae.brew.sh/api/formula/${formula}.json`,
    {
      responseType: "json",
    }
  ).json<{
    versions: {
      stable: string;
    };
  }>();

  return {
    version: res.versions.stable,
  };
}

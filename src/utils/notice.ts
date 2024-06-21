import got from "got";
import dayjs from "dayjs";
import { ReleaseInfo } from "./type.js";

// 优化后的 notice 函数
export const notice = (newVersions: ReleaseInfo[]) => {
  const key = process.env.PUSH_KEY;
  if (!key) {
    return Promise.reject("PUSH_KEY is not set");
  }

  // 创建标题和内容
  const title = `检测到 ${newVersions.map((val) => val.repo.content).join("  ")} 有版本更新`;
  const content = newVersions
    .map((newVersion) => {
      return `- **名称**: ${newVersion.repo.content}\n  **版本**: ${newVersion.version}\n  **时间**: ${dayjs().diff(dayjs(newVersion.date), "hour")} 小时之前\n`;
    })
    .join("\n");

  const url = `https://api2.pushdeer.com/message/push?pushkey=${key}&text=${title}&desp=${encodeURIComponent(content)}&type=markdown`;

  return got.get(url);
};

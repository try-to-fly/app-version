import { addRepo } from "../store/config.js";
import type { RepoType } from "../types/index.js";

export function addCommand(type: string, content: string): void {
  // 验证类型
  const validTypes = ["github", "brew"];
  const normalizedType = type.toLowerCase() as RepoType;

  if (!validTypes.includes(normalizedType)) {
    console.error(`错误: 无效的仓库类型 "${type}"`);
    console.error(`支持的类型: ${validTypes.join(", ")}`);
    process.exit(1);
  }

  // 处理 GitHub URL
  let normalizedContent = content;
  if (normalizedType === "github") {
    normalizedContent = content
      .replace("https://github.com/", "")
      .replace(/\/$/, "");
  }

  const success = addRepo({
    type: normalizedType,
    content: normalizedContent,
  });

  if (success) {
    console.log(`已添加: ${normalizedType} ${normalizedContent}`);
  } else {
    console.log(`仓库已存在: ${normalizedContent}`);
  }
}

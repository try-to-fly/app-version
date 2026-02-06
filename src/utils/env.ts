// 环境变量验证
export function validateEnv(): void {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("错误: GITHUB_TOKEN 环境变量未设置");
    console.error("请设置 GITHUB_TOKEN 环境变量后重试");
    console.error("示例: export GITHUB_TOKEN=your_token");
    process.exit(1);
  }
}

export function getGithubToken(): string {
  return process.env.GITHUB_TOKEN!;
}

#!/usr/bin/env node

import got from "got";
import Table from "cli-table3";
import dayjs from "dayjs";
import meow from "meow";
import inquirer from "inquirer";
import Conf from "conf";

const config = new Conf({
  projectName: "app-version",
  configName: "repos",
  defaults: { repos: [] },
});
const cache = new Conf({ projectName: "app-version", configName: "cache" });

// 创建表格实例
const table = new Table({
  head: ["名称", "版本", "更新日期", "距离现在"],
  colWidths: [30, 30, 30],
});

// 定义一个异步函数来获取最新版本和发布时间
async function getLatestRelease(repo, force = false) {
  const today = dayjs().format("YYYY-MM-DD");
  if (!force && cache.has(repo) && cache.get(repo).date === today) {
    return cache.get(repo).data;
  }
  try {
    const response = await got(
      `https://api.github.com/repos/${repo}/releases/latest`,
      { responseType: "json" },
    );
    const { tag_name: version, published_at: date } = response.body;
    const data = {
      repo,
      version,
      date: dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
    };
    cache.set(repo, { date: today, data });
    return data;
  } catch (error) {
    console.error(`获取 ${repo} 仓库信息失败:`, error.message);
    return { repo, version: "N/A", date: "N/A" };
  }
}

// 主函数，依次调用 API 并输出表格
async function displayRepos(force = false) {
  const repos = config.get("repos");
  for (const repo of repos) {
    const releaseInfo = await getLatestRelease(repo, force);
    table.push([
      repo,
      releaseInfo.version,
      releaseInfo.date,
      dayjs().diff(dayjs(releaseInfo.date), "day") + "d",
    ]);
    // 按照更新日期排序
    table.sort((a, b) => {
      return dayjs(b[2]).unix() - dayjs(a[2]).unix();
    });
  }
  console.clear();
  console.log(table.toString());
}

// Meow CLI
const cli = meow(
  `
    Usage
      $ cli <command>

    Commands
      list            查看仓库列表
      add             添加仓库
      remove          删除仓库
      force           强制更新缓存
      <default>       显示最新版本和发布时间

    Options
      --help          显示帮助
`,
  {
    importMeta: import.meta,
    flags: {
      force: {
        type: "boolean",
        shortFlag: "f",
      },
    },
  },
);

// 命令处理
(async () => {
  const { input, flags } = cli;
  const command = input[0];

  switch (command) {
    case "list":
      const repos = config.get("repos");
      console.log("仓库列表:");
      repos.forEach((repo) => console.log(repo));
      break;

    case "add":
      const repo = input[1];
      if (!repo) {
        console.log("请提供要添加的仓库 URL");
        return;
      }
      const repoUrl = repo.replace("https://github.com/", "");
      const reposToAdd = config.get("repos");
      if (reposToAdd.includes(repoUrl)) {
        console.log(`仓库 ${repo} 已存在`);
        return;
      }

      reposToAdd.push(repoUrl);
      config.set("repos", reposToAdd);
      console.log(`仓库 ${repo} 已添加`);
      displayRepos(false);
      break;

    case "remove":
      const reposToRemove = config.get("repos");
      const removeAnswers = await inquirer.prompt([
        {
          type: "checkbox",
          name: "repos",
          message: "选择要删除的仓库:",
          choices: reposToRemove,
        },
        {
          type: "confirm",
          name: "confirmRemove",
          message: "确认删除选中的仓库?",
          default: false,
        },
      ]);
      if (removeAnswers.confirmRemove) {
        const remainingRepos = reposToRemove.filter(
          (repo) => !removeAnswers.repos.includes(repo),
        );
        config.set("repos", remainingRepos);
        console.log("选中的仓库已删除");
      } else {
        console.log("取消删除操作");
      }
      break;

    case "force":
      await displayRepos(true);
      break;

    default:
      await displayRepos(flags.force);
      break;
  }
})();

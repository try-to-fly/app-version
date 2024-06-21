#!/usr/bin/env node

import Table from "cli-table3";
import dayjs from "dayjs";
import meow from "meow";
import inquirer from "inquirer";
import ms from "ms";
import _ from "lodash";
import binaryVersion from "binary-version";
import { notice } from "./utils/index.js";
import { config } from "./utils/config.js";
import { getLatestRelease } from "./versions/index.js";
import { ReleaseInfo, Repo } from "./utils/type.js";

const table = new Table({
  head: ["类型", "名称", "版本", "当前版本", "更新日期", "距离现在"],
  colWidths: [10, 30, 30, 30, 30, 10],
});

async function displayRepos(force = false) {
  const repos: Repo[] = config.get("repos");
  for (const repo of repos) {
    const releaseInfo = await getLatestRelease(repo, force);
    const currentRelease = repo.command
      ? await binaryVersion(repo.command).catch(() => "N/A")
      : "N/A";
    table.push([
      repo.type,
      repo,
      releaseInfo.version,
      currentRelease,
      releaseInfo.date,
      releaseInfo.date !== "N/A"
        ? ms(dayjs().diff(dayjs(releaseInfo.date), "millisecond"))
        : "N/A",
    ]);
    table.sort((a: any, b: any) => {
      const dateA = dayjs(a[4]).unix();
      const dateB = dayjs(b[4]).unix();

      const isNaNDateA = isNaN(dateA);
      const isNaNDateB = isNaN(dateB);

      if (isNaNDateA && isNaNDateB) {
        return 0;
      } else if (isNaNDateA) {
        return 1;
      } else if (isNaNDateB) {
        return -1;
      } else {
        return dateB - dateA;
      }
    });
  }
  console.log(table.toString());
}

const cli = meow(
  `
    Usage
      $ cli <command>

    Commands
      list            查看仓库列表
      add             添加仓库
      remove          删除仓库
      force           强制更新缓存
      check           和缓存中的版本比对，检查出新版本列表
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

(async () => {
  const { input, flags } = cli;
  const command = input[0];

  switch (command) {
    case "list":
      const repos: Repo[] = config.get("repos");
      console.log("仓库列表:");
      repos.forEach((repo) => console.log(repo.content));
      break;

    case "add":
      const { type, content } = await inquirer.prompt([
        {
          type: "list",
          name: "type",
          message: "选择添加仓库的方式:",
          choices: ["Github", "Brew"],
        },
        {
          type: "input",
          name: "content",
          message: "请输入URL:",
        },
      ]);

      let val = content;
      switch (type) {
        case "Github":
          val = content.replace("https://github.com/", "");
          break;
      }
      const repoList: Repo[] = config.get("repos");
      const isExist = repoList.find((rep) => _.isEqual(rep, val));
      if (isExist) {
        console.log(`仓库 ${val} 已存在`);
      }
      repoList.push({ type, content: val });
      config.set("repos", repoList);
      displayRepos(false);
      break;

    case "remove":
      const reposToRemove = config
        .get("repos")
        .map((repo: Repo) => repo.content);
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
        const remainingRepos = config
          .get("repos")
          .filter((repo: Repo) => !removeAnswers.repos.includes(repo.content));
        config.set("repos", remainingRepos);
        console.log("选中的仓库已删除");
      } else {
        console.log("取消删除操作");
      }
      break;

    case "check":
      await displayRepos(flags.force);
      const reposToCheck: Repo[] = config.get("repos");
      const newVersions: ReleaseInfo[] = [];
      for (const repo of reposToCheck) {
        const releaseInfo = await getLatestRelease(repo);
        // 获取更新时间小于24小的版本
        const isUpdated = dayjs().diff(dayjs(releaseInfo.date), "hour") < 24;
        if (isUpdated) {
          newVersions.push(releaseInfo);
        }
      }
      if (newVersions.length === 0) {
        console.log("没有新版本");
        return;
      }
      await notice(newVersions);
      break;

    case "force":
      await displayRepos(true);
      break;

    default:
      await displayRepos(flags.force);
      break;
  }
})();

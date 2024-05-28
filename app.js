#!/usr/bin/env node

import got from "got";
import Table from "cli-table3";
import dayjs from "dayjs";
import meow from "meow";
import inquirer from "inquirer";
import Conf from "conf";
import ms from "ms";
import _ from "lodash";
import binaryVersion from "binary-version";
import { notice } from "./notice.js";

const config = new Conf({
  projectName: "app-version",
  configName: "repos",
  defaults: { repos: [] },
});
const cache = new Conf({ projectName: "app-version", configName: "cache" });

// 创建表格实例
const table = new Table({
  head: ["类型", "名称", "版本", "当前版本", "更新日期", "距离现在"],
  colWidths: [10, 30, 30, 30, 30, 10],
});

// 定义一个异步函数来获取最新版本和发布时间
async function getLatestRelease(repo, force = false) {
  // 根据配置的缓存时间来检查
  const chacheTime = ms("1h");
  const today = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const isCacheValid = (repo) => {
    return (
      cache.has(repo) &&
      dayjs().diff(dayjs(cache.get(repo).date), "millisecond") < chacheTime
    );
  };
  const { type, content } = repo;
  if (!force && isCacheValid(content)) {
    return cache.get(content).data;
  }
  try {
    switch (type) {
      case "Github":
        const response = await got(
          `https://api.github.com/repos/${content}/releases/latest`,
          { responseType: "json" },
        );
        const { tag_name: version, published_at: date } = response.body;
        const data = {
          repo,
          version,
          date: dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
        };
        cache.set(content, { date: today, data });
        return data;
      case "Brew":
        const {
          versions: { stable: brewVersion },
        } = await got(`https://formulae.brew.sh/api/formula/${content}.json`, {
          responseType: "json",
        }).json();

        const brewData = { repo, version: brewVersion, date: "N/A" };
        cache.set(content, { date: today, data: brewData });
        return brewData;
      default:
        throw new Error(`未知的仓库类型: ${type} ${content})`);
    }
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
    const currentRelease = await binaryVersion(repo.content).catch(() => "N/A");
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
    // 按照更新日期排序
    table.sort((a, b) => {
      const dateA = dayjs(a[4]).unix();
      const dateB = dayjs(b[4]).unix();

      // 检查是否为 NaN
      const isNaNDateA = isNaN(dateA);
      const isNaNDateB = isNaN(dateB);

      if (isNaNDateA && isNaNDateB) {
        return 0; // 两个都是 NaN，位置不变
      } else if (isNaNDateA) {
        return 1; // a 是 NaN，排到后面
      } else if (isNaNDateB) {
        return -1; // b 是 NaN，排到后面
      } else {
        return dateB - dateA; // 正常比较
      }
    });
  }
  // console.clear();
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

// 命令处理
(async () => {
  const { input, flags } = cli;
  const command = input[0];

  switch (command) {
    case "list":
      const repos = config.get("repos");
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
      const repoList = config.get("repos");
      const isExist = repoList.find((rep) => _.isEqual(rep, val));
      if (isExist) {
        console.log(`仓库 ${val} 已存在`);
      }
      repoList.push({ type, content: val });
      config.set("repos", repoList);
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

    case "check":
      // 比较缓存中的版本和最新版本，然后log出新版本
      const reposToCheck = config.get("repos");
      const newVersions = [];
      for (const repo of reposToCheck) {
        const releaseInfo = await getLatestRelease(repo);
        if (
          cache.has(repo) &&
          cache.get(repo).data.version !== releaseInfo.version &&
          releaseInfo.version !== "N/A"
        ) {
          newVersions.push(releaseInfo);
        }
      }
      if (newVersions.length === 0) {
        console.log("没有新版本");
      } else {
        console.log("新版本:");
        newVersions.forEach((version) => {
          const text = `新版本发布:${version.repo}: ${version.version} `;
          notice(text);
        });
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

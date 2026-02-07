import Table from "cli-table3";
import type { ReleaseInfo, DiffResult, Repo, OutputFormat } from "../types/index.js";

function repoUrl(repo: Repo): string | null {
  if (repo.type === "github") {
    return `https://github.com/${repo.content}`;
  }
  if (repo.type === "brew") {
    // Homebrew formula/cask pages vary; keep null for now.
    return null;
  }
  return null;
}

function githubReleasesUrl(repo: Repo): string | null {
  if (repo.type !== "github") return null;
  return `https://github.com/${repo.content}/releases`;
}

// 输出仓库列表
export function outputRepoList(repos: Repo[], format: OutputFormat): void {
  if (format === "json") {
    console.log(JSON.stringify(repos, null, 2));
    return;
  }

  if (format === "markdown") {
    // Minimal, readable list
    repos.forEach((repo) => {
      const url = repoUrl(repo);
      if (url) {
        console.log(`- [${repo.content}](${url})`);
      } else {
        console.log(`- ${repo.content}`);
      }
    });
    return;
  }

  const table = new Table({
    head: ["类型", "名称"],
    colWidths: [10, 50],
  });

  repos.forEach((repo) => {
    table.push([repo.type, repo.content]);
  });

  console.log(table.toString());
}

// 输出版本检查结果
export function outputVersionList(releases: ReleaseInfo[], format: OutputFormat): void {
  if (format === "json") {
    const data = releases.map((r) => ({
      type: r.repo.type,
      name: r.repo.content,
      version: r.version,
      date: r.date,
    }));
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (format === "markdown") {
    if (releases.length === 0) {
      console.log("(empty)");
      return;
    }
    console.log("*📦 当前追踪版本*");
    console.log("");
    releases.forEach((r) => {
      const url = githubReleasesUrl(r.repo);
      const name = url ? `[${r.repo.content}](${url})` : r.repo.content;
      console.log(`- ${name} \`${r.version}\` (${r.date})`);
    });
    return;
  }

  const table = new Table({
    head: ["类型", "名称", "版本", "更新日期"],
    colWidths: [10, 35, 25, 25],
  });

  releases.forEach((r) => {
    table.push([r.repo.type, r.repo.content, r.version, r.date]);
  });

  console.log(table.toString());
}

// 输出版本比对结果
export function outputDiffList(diffs: DiffResult[], format: OutputFormat): void {
  if (format === "json") {
    const data = diffs.map((d) => ({
      type: d.repo.type,
      name: d.repo.content,
      oldVersion: d.oldVersion,
      newVersion: d.newVersion,
      oldDate: d.oldDate,
      newDate: d.newDate,
    }));
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (diffs.length === 0) {
    if (format === "markdown") {
      // Silence-friendly output (cron can choose to ignore empty output)
      console.log("(no changes)");
    } else {
      console.log("没有版本变化");
    }
    return;
  }

  if (format === "markdown") {
    console.log("*📦 发现软件更新*");
    console.log("");
    diffs.forEach((d) => {
      const url = githubReleasesUrl(d.repo);
      const name = url ? `[${d.repo.content}](${url})` : d.repo.content;
      const date = (d.newDate || "").split(" ")[0];
      console.log(`- ${name} \`${d.oldVersion} -> ${d.newVersion}\` (${date})`);
    });
    console.log("");
    console.log("_详情：运行_ `app-version check`");
    return;
  }

  const table = new Table({
    head: ["类型", "名称", "旧版本", "新版本", "更新日期"],
    colWidths: [10, 30, 20, 20, 25],
  });

  diffs.forEach((d) => {
    table.push([d.repo.type, d.repo.content, d.oldVersion, d.newVersion, d.newDate]);
  });

  console.log(table.toString());
}

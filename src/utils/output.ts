import Table from "cli-table3";
import type { ReleaseInfo, DiffResult, Repo, OutputFormat } from "../types/index.js";

// 输出仓库列表
export function outputRepoList(repos: Repo[], format: OutputFormat): void {
  if (format === "json") {
    console.log(JSON.stringify(repos, null, 2));
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
    console.log("没有版本变化");
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

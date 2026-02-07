#!/usr/bin/env node

import { Command } from "commander";
import { validateEnv } from "./utils/env.js";
import {
  listCommand,
  addCommand,
  removeCommand,
  checkCommand,
  diffCommand,
} from "./commands/index.js";
import type { OutputFormat } from "./types/index.js";

// 验证环境变量
validateEnv();

const program = new Command();

program
  .name("app-version")
  .description("软件版本追踪工具")
  .version("0.1.0")
  .option("--json", "JSON 格式输出")
  .option("--markdown", "Markdown 格式输出（适合 Telegram/Markdown 渠道）");

// check 命令（默认）
program
  .command("check", { isDefault: true })
  .description("检查所有仓库最新版本")
  .option("-f, --force", "强制刷新缓存", false)
  .option("-c, --concurrency <num>", "并发数量", "8")
  .action(async (options) => {
    const opts = program.opts();
    const format: OutputFormat = opts.json ? "json" : opts.markdown ? "markdown" : "table";
    await checkCommand({
      force: options.force,
      concurrency: parseInt(options.concurrency, 10),
      format,
    });
  });

// list 命令
program
  .command("list")
  .description("查看仓库列表")
  .action(() => {
    const opts = program.opts();
    const format: OutputFormat = opts.json ? "json" : opts.markdown ? "markdown" : "table";
    listCommand(format);
  });

// add 命令
program
  .command("add <type> <content>")
  .description("添加仓库 (type: github | brew)")
  .action((type, content) => {
    addCommand(type, content);
  });

// remove 命令
program
  .command("remove <content>")
  .description("删除仓库")
  .action((content) => {
    removeCommand(content);
  });

// diff 命令
program
  .command("diff")
  .description("比对版本变化")
  .action(async () => {
    const opts = program.opts();
    const format: OutputFormat = opts.json ? "json" : opts.markdown ? "markdown" : "table";
    await diffCommand({ format });
  });

program.parse();

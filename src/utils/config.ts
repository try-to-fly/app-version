import Conf from "conf";
import { ReleaseInfo, Repo } from "./type.js";

export const config = new Conf<{
  repos: Repo[];
}>({
  projectName: "app-version",
  configName: "repos",
  defaults: {
    repos: [
      {
        content: "neovim/neovim",
        type: "Github",
        command: "nvim",
      },
      {
        content: "kovidgoyal/kitty",
        type: "Github",
        command: "kitty",
      },
      {
        content: "stevearc/oil.nvim",
        type: "Github",
      },
      {
        content: "git",
        type: "Brew",
        command: "git",
      },
      {
        content: "pnpm/pnpm",
        type: "Github",
        command: "pnpm",
      },
      {
        type: "Github",
        content: "LazyVim/LazyVim",
      },
      {
        type: "Github",
        content: "nodejs/node",
        command: "node",
      },
      {
        type: "Github",
        content: "facebook/react",
      },
      {
        type: "Github",
        content: "vercel/next.js",
      },
      {
        type: "Github",
        content: "microsoft/TypeScript",
      },
      {
        type: "Github",
        content: "teslamate-org/teslamate",
      },
      {
        type: "Github",
        content: "jetify-com/devbox",
      },
      {
        type: "Github",
        content: "tmux/tmux",
      },
      {
        type: "Github",
        content: "triggerdotdev/trigger.dev",
      },
    ],
  },
});

config.clear();

export const cache = new Conf<{
  [key: string]: ReleaseInfo;
}>({ projectName: "app-version", configName: "cache" });

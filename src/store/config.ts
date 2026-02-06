import Conf from "conf";
import os from "os";
import path from "path";
import type { ConfigData, Repo } from "../types/index.js";

const configDir = path.join(os.homedir(), ".app-version");

const configStore = new Conf<ConfigData>({
  cwd: configDir,
  configName: "config",
  defaults: {
    repos: [],
  },
});

export function getRepos(): Repo[] {
  return configStore.get("repos");
}

export function setRepos(repos: Repo[]): void {
  configStore.set("repos", repos);
}

export function addRepo(repo: Repo): boolean {
  const repos = getRepos();
  const exists = repos.some(
    (r) => r.type === repo.type && r.content === repo.content
  );
  if (exists) {
    return false;
  }
  repos.push(repo);
  setRepos(repos);
  return true;
}

export function removeRepo(content: string): boolean {
  const repos = getRepos();
  const index = repos.findIndex((r) => r.content === content);
  if (index === -1) {
    return false;
  }
  repos.splice(index, 1);
  setRepos(repos);
  return true;
}

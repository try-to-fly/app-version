export interface Repo {
  type: string;
  content: string;
  command?: string;
}

export interface ReleaseInfo {
  repo: Repo;
  version: string;
  date?: string;
}

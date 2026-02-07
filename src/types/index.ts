// 仓库类型
export type RepoType = "github" | "brew";

// 仓库配置
export interface Repo {
  type: RepoType;
  content: string;
}

// 版本信息
export interface ReleaseInfo {
  repo: Repo;
  version: string;
  date: string;
}

// 缓存条目
export interface CacheEntry {
  version: string;
  date: string;
  cachedAt: string;
}

// 历史快照
export interface HistorySnapshot {
  version: string;
  recordedAt: string;
}

// 历史记录
export interface HistoryData {
  lastCheckTime: string;
  snapshots: Record<string, HistorySnapshot>;
}

// 配置数据
export interface ConfigData {
  repos: Repo[];
}

// 缓存数据
export interface CacheData {
  [key: string]: CacheEntry;
}

// 版本比对结果
export interface DiffResult {
  repo: Repo;
  oldVersion: string;
  newVersion: string;
  oldDate: string;
  newDate: string;
}

// 输出格式
export type OutputFormat = "table" | "json" | "markdown";

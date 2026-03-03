import { spawnSync } from "node:child_process";

export interface NotifyOptions {
  channel: string;
  target: string;
  title?: string;
  message: string;
}

export function sendOpenclawMessage(opts: NotifyOptions): void {
  const title = opts.title ? `${opts.title}\n\n` : "";
  const full = `${title}${opts.message}`;

  const res = spawnSync(
    "openclaw",
    [
      "message",
      "send",
      "--channel",
      opts.channel,
      "--target",
      opts.target,
      "--message",
      full,
    ],
    { stdio: "inherit" }
  );

  if (res.error) throw res.error;
  if (typeof res.status === "number" && res.status !== 0) {
    throw new Error(`openclaw message send failed with exit code ${res.status}`);
  }
}

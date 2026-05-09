import * as fs from "fs";
import * as path from "path";

export interface BackportConfig {
  apiKey: string;
  gatewayUrl: string;
  targetBackendUrl: string;
  projectName: string;
}

const CONFIG_FILE = "backport.config.json";

export function getConfigPath(): string {
  return path.resolve(process.cwd(), CONFIG_FILE);
}

export function configExists(): boolean {
  return fs.existsSync(getConfigPath());
}

export function readConfig(): BackportConfig | null {
  if (!configExists()) return null;
  try {
    const raw = fs.readFileSync(getConfigPath(), "utf-8");
    return JSON.parse(raw) as BackportConfig;
  } catch {
    return null;
  }
}

export function writeConfig(config: BackportConfig): void {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export const GATEWAY_URL = "https://backport-io.onrender.com";
<<<<<<< HEAD
export const DASHBOARD_URL = "https://backport-io.vercel.app";
=======
export const DASHBOARD_URL = "https://backport.in";
>>>>>>> 369eadd36bd1a259f5b95fb908ea824a3484f6cc

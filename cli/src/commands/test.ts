import chalk from "chalk";
import ora from "ora";
import fetch from "node-fetch";
import { readConfig, GATEWAY_URL } from "../utils/config";

export async function testConnection(): Promise<void> {
  console.log("");
  const config = readConfig();

  if (!config) {
    console.log(
      chalk.red("  ✖ No backport.config.json found.") +
        "\n" +
        chalk.dim("  Run ") +
        chalk.cyan("npx @qureshi-1/backport init") +
        chalk.dim(" first.")
    );
    return;
  }

  console.log(chalk.dim("  Project: ") + chalk.white(config.projectName));
  console.log(chalk.dim("  Gateway: ") + chalk.cyan(config.gatewayUrl));
  console.log(chalk.dim("  Backend: ") + chalk.cyan(config.targetBackendUrl));
  console.log("");

  // Test 1: Gateway Health
  const s1 = ora({ text: chalk.dim("Checking gateway health..."), spinner: "dots12" }).start();
  try {
    const res = await fetch(`${config.gatewayUrl}/health`, { timeout: 10000 } as any);
    const data = await res.json() as any;
    if (res.ok) {
      s1.succeed(chalk.green(`Gateway is online — v${data.version || "?"}`));
    } else {
      s1.fail(chalk.red("Gateway returned error"));
    }
  } catch {
    s1.fail(chalk.red("Gateway unreachable — it may be cold-starting on free tier."));
    console.log(chalk.dim("    Render free tier spins down after inactivity. Wait 30s and retry."));
  }

  // Test 2: API Key Validation via a minimal proxy call
  const s2 = ora({ text: chalk.dim("Validating API key..."), spinner: "dots12" }).start();
  try {
    const res = await fetch(`${config.gatewayUrl}/proxy/__backport_health`, {
      method: "GET",
      headers: { "X-API-Key": config.apiKey },
      timeout: 15000,
    } as any);

    if (res.status === 401) {
      s2.fail(chalk.red("Invalid API key — check your backport.config.json"));
    } else if (res.status === 400) {
      s2.warn(chalk.yellow("API key valid but no target backend URL set in dashboard."));
      console.log(
        chalk.dim("    Set your backend URL in: ") +
          chalk.underline.cyan("https://backport.in/dashboard/settings")
      );
    } else if (res.status === 429) {
      s2.succeed(chalk.green("API key valid! (Rate limit applied — everything working)"));
    } else if (res.status === 502) {
      s2.succeed(chalk.green("API key valid! (Backend may be offline — gateway working correctly)"));
    } else {
      s2.succeed(chalk.green(`API key valid — gateway responded with ${res.status}`));
    }
  } catch {
    s2.warn(chalk.yellow("Could not validate key — gateway may be starting up"));
  }

  console.log("");
  console.log(chalk.dim("  ✅ Connection test complete!"));
  console.log("");
}

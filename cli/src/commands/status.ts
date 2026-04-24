import chalk from "chalk";
import ora from "ora";
import fetch from "node-fetch";
import { readConfig } from "../utils/config";

export async function checkStatus(): Promise<void> {
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

  const spinner = ora({
    text: chalk.dim("Fetching gateway status..."),
    spinner: "dots12",
  }).start();

  try {
    const res = await fetch(`${config.gatewayUrl}/health`, { timeout: 10000 } as any);
    const data = await res.json() as any;

    spinner.succeed(chalk.green("Gateway status retrieved"));
    console.log("");
    console.log(chalk.dim("  ┌─────────────────────────────────────────┐"));
    console.log(chalk.dim("  │ ") + chalk.bold.greenBright("⚡ Backport Gateway Status") + chalk.dim("              │"));
    console.log(chalk.dim("  ├─────────────────────────────────────────┤"));
    console.log(chalk.dim("  │ ") + chalk.white("Status:   ") + chalk.greenBright("● Online") + chalk.dim("                      │"));
    console.log(chalk.dim("  │ ") + chalk.white("Version:  ") + chalk.cyan(data.version || "unknown") + chalk.dim("                       │"));
    console.log(chalk.dim("  │ ") + chalk.white("Project:  ") + chalk.yellow(config.projectName) + chalk.dim(""));
    console.log(chalk.dim("  │ ") + chalk.white("Backend:  ") + chalk.cyan(config.targetBackendUrl));
    console.log(chalk.dim("  └─────────────────────────────────────────┘"));
  } catch {
    spinner.fail(chalk.red("Gateway offline or unreachable"));
    console.log(
      chalk.dim("    Render free tier spins down after inactivity.") +
        "\n" +
        chalk.dim("    Send a request or visit the dashboard to wake it up.")
    );
  }

  console.log("");
}

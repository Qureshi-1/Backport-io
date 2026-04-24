import chalk from "chalk";
import boxen from "boxen";
import { readConfig, getConfigPath, DASHBOARD_URL } from "../utils/config";

export async function whoami(): Promise<void> {
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

  // Mask the API key (show first 6 and last 4 chars)
  const maskedKey =
    config.apiKey.slice(0, 6) +
    "•".repeat(Math.max(0, config.apiKey.length - 10)) +
    config.apiKey.slice(-4);

  console.log(
    boxen(
      chalk.bold.greenBright("⚡ Backport Configuration") +
        "\n\n" +
        chalk.dim("Project:   ") +
        chalk.white(config.projectName) +
        "\n" +
        chalk.dim("API Key:   ") +
        chalk.yellow(maskedKey) +
        "\n" +
        chalk.dim("Gateway:   ") +
        chalk.cyan(config.gatewayUrl) +
        "\n" +
        chalk.dim("Backend:   ") +
        chalk.cyan(config.targetBackendUrl) +
        "\n" +
        chalk.dim("Config:    ") +
        chalk.dim(getConfigPath()) +
        "\n\n" +
        chalk.dim("Dashboard: ") +
        chalk.underline.cyan(`${DASHBOARD_URL}/dashboard`),
      {
        padding: 1,
        margin: 0,
        borderColor: "green",
        borderStyle: "round",
      }
    )
  );
  console.log("");
}

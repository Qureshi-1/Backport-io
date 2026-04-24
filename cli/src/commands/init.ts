import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import boxen from "boxen";
import fetch from "node-fetch";
import { writeConfig, configExists, GATEWAY_URL, DASHBOARD_URL, BackportConfig } from "../utils/config";

export async function initProject(): Promise<void> {
  console.log("");
  console.log(
    boxen(
      chalk.bold.greenBright("⚡ Backport Setup Wizard") +
        "\n\n" +
        chalk.dim("This will create a ") +
        chalk.yellow("backport.config.json") +
        chalk.dim(" in your project\n") +
        chalk.dim("and connect it to your Backport gateway."),
      {
        padding: 1,
        margin: 0,
        borderColor: "green",
        borderStyle: "round",
      }
    )
  );
  console.log("");

  // Check if config already exists
  if (configExists()) {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: chalk.yellow("backport.config.json already exists. Overwrite?"),
        default: false,
      },
    ]);
    if (!overwrite) {
      console.log(chalk.dim("  Setup cancelled."));
      return;
    }
  }

  // Step 1: Get API Key
  console.log(
    chalk.dim("  💡 Get your API key from: ") +
      chalk.underline.cyan(`${DASHBOARD_URL}/dashboard`)
  );
  console.log("");

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "apiKey",
      message: chalk.white("Enter your Backport API key:"),
      validate: (val: string) => {
        if (!val.trim()) return "API key is required";
        if (!val.startsWith("bk_")) return "API key should start with 'bk_'";
        return true;
      },
    },
    {
      type: "input",
      name: "targetBackendUrl",
      message: chalk.white("Enter your backend URL (e.g., http://localhost:3000):"),
      default: "http://localhost:3000",
      validate: (val: string) => {
        try {
          new URL(val);
          return true;
        } catch {
          return "Please enter a valid URL";
        }
      },
    },
    {
      type: "input",
      name: "projectName",
      message: chalk.white("Project name:"),
      default: require("path").basename(process.cwd()),
    },
  ]);

  // Step 2: Verify API Key
  const spinner = ora({
    text: chalk.dim("Verifying API key with Backport gateway..."),
    spinner: "dots12",
  }).start();

  try {
    const res = await fetch(`${GATEWAY_URL}/health`, {
      method: "GET",
      headers: { "X-API-Key": answers.apiKey },
      timeout: 10000,
    } as any);

    if (res.ok) {
      spinner.succeed(chalk.green("Gateway connection verified!"));
    } else {
      spinner.warn(chalk.yellow("Gateway reachable but returned non-200 — API key will be saved anyway."));
    }
  } catch (err: any) {
    spinner.warn(
      chalk.yellow("Could not reach gateway (may be starting up). Config saved — retry with ") +
        chalk.cyan("backport test")
    );
  }

  // Step 3: Write Config
  const config: BackportConfig = {
    apiKey: answers.apiKey,
    gatewayUrl: GATEWAY_URL,
    targetBackendUrl: answers.targetBackendUrl,
    projectName: answers.projectName,
  };

  writeConfig(config);

  // Step 4: Success!
  console.log("");
  console.log(
    boxen(
      chalk.bold.greenBright("✅ Backport initialized successfully!") +
        "\n\n" +
        chalk.white("Config saved to: ") +
        chalk.yellow("backport.config.json") +
        "\n\n" +
        chalk.dim("Next steps:") +
        "\n" +
        chalk.white("  1. ") +
        chalk.dim("Test connection:  ") +
        chalk.cyan("npx @qureshi-1/backport test") +
        "\n" +
        chalk.white("  2. ") +
        chalk.dim("Send a request:   ") +
        chalk.cyan("npx @qureshi-1/backport proxy GET /api/users") +
        "\n" +
        chalk.white("  3. ") +
        chalk.dim("Check status:     ") +
        chalk.cyan("npx @qureshi-1/backport status") +
        "\n\n" +
        chalk.dim("Your gateway URL: ") +
        chalk.underline.cyan(`${GATEWAY_URL}/proxy/`) +
        "\n" +
        chalk.dim("Dashboard:        ") +
        chalk.underline.cyan(`${DASHBOARD_URL}/dashboard`),
      {
        padding: 1,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        borderColor: "green",
        borderStyle: "round",
      }
    )
  );

  // Step 5: Remind to add to .gitignore
  console.log("");
  console.log(
    chalk.dim("  ⚠️  ") +
      chalk.yellow("Add backport.config.json to your .gitignore to keep your API key safe!")
  );
  console.log("");
}

import chalk from "chalk";
import ora from "ora";
import fetch from "node-fetch";
import { readConfig } from "../utils/config";

export async function proxyRequest(
  method: string,
  urlPath: string,
  opts: { data?: string; header?: string[] }
): Promise<void> {
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

  const httpMethod = method.toUpperCase();
  const cleanPath = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;
  const fullUrl = `${config.gatewayUrl}/proxy/${cleanPath}`;

  console.log(
    chalk.dim("  → ") +
      chalk.bold.white(httpMethod) +
      " " +
      chalk.cyan(fullUrl)
  );

  // Build headers
  const headers: Record<string, string> = {
    "X-API-Key": config.apiKey,
    "Content-Type": "application/json",
  };

  if (opts.header) {
    for (const h of opts.header) {
      const [key, ...valParts] = h.split(":");
      if (key && valParts.length) {
        headers[key.trim()] = valParts.join(":").trim();
      }
    }
  }

  const spinner = ora({
    text: chalk.dim(`Sending ${httpMethod} request via Backport gateway...`),
    spinner: "dots12",
  }).start();

  const startTime = Date.now();

  try {
    const fetchOpts: any = {
      method: httpMethod,
      headers,
      timeout: 30000,
    };

    if (opts.data && ["POST", "PUT", "PATCH"].includes(httpMethod)) {
      fetchOpts.body = opts.data;
    }

    const res = await fetch(fullUrl, fetchOpts);
    const latency = Date.now() - startTime;

    const statusColor =
      res.status >= 200 && res.status < 300
        ? chalk.greenBright
        : res.status >= 400 && res.status < 500
        ? chalk.yellow
        : chalk.red;

    spinner.succeed(
      statusColor(`${res.status} ${res.statusText}`) +
        chalk.dim(` (${latency}ms)`)
    );

    // Display response body
    const contentType = res.headers.get("content-type") || "";
    const body = await res.text();

    if (contentType.includes("application/json")) {
      try {
        const json = JSON.parse(body);
        console.log("");
        console.log(chalk.dim("  Response:"));
        console.log(
          chalk.white(
            JSON.stringify(json, null, 2)
              .split("\n")
              .map((line) => "    " + line)
              .join("\n")
          )
        );
      } catch {
        console.log(chalk.dim("  Response: ") + body.slice(0, 500));
      }
    } else {
      if (body.length > 0) {
        console.log(chalk.dim("  Response: ") + body.slice(0, 500));
      }
    }

    // Security indicators
    console.log("");
    const indicators = [];
    if (res.status === 403) indicators.push(chalk.red("🛡️  WAF Blocked"));
    if (res.status === 429) indicators.push(chalk.yellow("⏱️  Rate Limited"));
    if (latency < 5) indicators.push(chalk.greenBright("⚡ Served from Cache"));
    if (indicators.length) {
      console.log(chalk.dim("  Backport: ") + indicators.join(" | "));
    }
  } catch (err: any) {
    spinner.fail(chalk.red(`Request failed: ${err.message}`));
    console.log(
      chalk.dim("    Make sure the gateway is running and your API key is correct.")
    );
  }

  console.log("");
}

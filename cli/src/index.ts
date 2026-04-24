#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import boxen from "boxen";

const program = new Command();

const LOGO = `
  ╔══════════════════════════════════════╗
  ║   ${chalk.bold.greenBright("⚡ Backport CLI")}                     ║
  ║   ${chalk.dim("Shield your API in 30 seconds")}       ║
  ╚══════════════════════════════════════╝
`;

program
  .name("backport")
  .description("Backport CLI — Add Rate Limiting, WAF, Caching & Idempotency to any backend")
  .version("1.0.0")
  .addHelpText("beforeAll", LOGO);

// ─── INIT Command ──────────────────────────────────────────────────────────────
program
  .command("init")
  .description("Initialize Backport in your project")
  .action(async () => {
    const { initProject } = await import("./commands/init");
    await initProject();
  });

// ─── TEST Command ──────────────────────────────────────────────────────────────
program
  .command("test")
  .description("Test your Backport gateway connection")
  .action(async () => {
    const { testConnection } = await import("./commands/test");
    await testConnection();
  });

// ─── STATUS Command ────────────────────────────────────────────────────────────
program
  .command("status")
  .description("Check your Backport gateway status and stats")
  .action(async () => {
    const { checkStatus } = await import("./commands/status");
    await checkStatus();
  });

// ─── PROXY Command ─────────────────────────────────────────────────────────────
program
  .command("proxy <method> <path>")
  .description("Send a proxied request through your Backport gateway")
  .option("-d, --data <json>", "JSON body for POST/PUT/PATCH requests")
  .option("-H, --header <header>", "Additional headers (key:value)", (val: string, prev: string[]) => [...prev, val], [] as string[])
  .action(async (method: string, path: string, opts: any) => {
    const { proxyRequest } = await import("./commands/proxy");
    await proxyRequest(method, path, opts);
  });

// ─── WHOAMI Command ────────────────────────────────────────────────────────────
program
  .command("whoami")
  .description("Show current configuration")
  .action(async () => {
    const { whoami } = await import("./commands/whoami");
    await whoami();
  });

program.parse();

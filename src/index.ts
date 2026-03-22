#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fetchUsage } from "./api.js";
import {
  formatFullUsage,
  formatSessionUsage,
  formatWeeklyLimits,
  formatRateStatus,
} from "./formatter.js";

const server = new McpServer({
  name: "claudeusage-mcp",
  version: "1.0.0",
});

server.tool(
  "get_usage",
  "Get a full dashboard of your Claude Pro/Max subscription usage: session limits, weekly limits (all models, Opus, Sonnet), and extra usage credits.",
  {},
  async () => {
    const result = await fetchUsage();

    if (!result.data) {
      return {
        content: [{ type: "text", text: result.error ?? "Failed to fetch usage data." }],
        isError: true,
      };
    }

    let output = formatFullUsage(result.data, result.source);
    if (result.error) {
      output += `\n\nNote: ${result.error}`;
    }

    return { content: [{ type: "text", text: output }] };
  }
);

server.tool(
  "get_session_usage",
  "Get your current 5-hour session usage window — how much of your burst limit you have used and when it resets.",
  {},
  async () => {
    const result = await fetchUsage();

    if (!result.data) {
      return {
        content: [{ type: "text", text: result.error ?? "Failed to fetch usage data." }],
        isError: true,
      };
    }

    return { content: [{ type: "text", text: formatSessionUsage(result.data) }] };
  }
);

server.tool(
  "get_weekly_limits",
  "Get your 7-day weekly usage limits broken down by model: all models combined, Opus, and Sonnet.",
  {},
  async () => {
    const result = await fetchUsage();

    if (!result.data) {
      return {
        content: [{ type: "text", text: result.error ?? "Failed to fetch usage data." }],
        isError: true,
      };
    }

    return { content: [{ type: "text", text: formatWeeklyLimits(result.data) }] };
  }
);

server.tool(
  "check_rate_status",
  "Check if you are close to being rate limited. Returns a clear status: LOW, MODERATE, or HIGH usage with actionable advice.",
  {},
  async () => {
    const result = await fetchUsage();

    if (!result.data) {
      return {
        content: [{ type: "text", text: result.error ?? "Failed to fetch usage data." }],
        isError: true,
      };
    }

    return { content: [{ type: "text", text: formatRateStatus(result.data) }] };
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Failed to start claudeusage-mcp:", err);
  process.exit(1);
});

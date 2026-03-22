import type { UsageResponse, UsageWindow, ExtraUsage } from "./types.js";
import { getCacheAge } from "./cache.js";

const BAR_WIDTH = 20;

function progressBar(pct: number): string {
  const filled = Math.round((pct / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  return "\u2588".repeat(filled) + "\u2591".repeat(empty);
}

function formatResetTime(resetsAt: string | null): string {
  if (!resetsAt) return "";

  const resetDate = new Date(resetsAt);
  const now = new Date();
  const diffMs = resetDate.getTime() - now.getTime();

  if (diffMs <= 0) return "Resetting now";

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? `Resets in ${parts.join(" ")}` : "Resets in <1m";
}

function statusEmoji(pct: number): string {
  if (pct >= 80) return "[!]";
  if (pct >= 50) return "[~]";
  return "";
}

function formatWindow(label: string, window: UsageWindow | null): string {
  if (!window) return `${label}\n  N/A (not on your plan)\n`;

  const pct = window.utilization;
  const bar = progressBar(pct);
  const reset = formatResetTime(window.resets_at);
  const status = statusEmoji(pct);
  const resetLine = reset ? `  ${reset}` : "";

  return `${label} ${status}\n  ${bar}  ${pct.toFixed(0)}%\n${resetLine}`.trimEnd();
}

export function formatFullUsage(data: UsageResponse, source: string): string {
  const lines: string[] = [];

  lines.push("=== Claude Plan Usage ===");
  lines.push("");

  lines.push(formatWindow("SESSION (5-hour window)", data.five_hour));
  lines.push("");

  lines.push(formatWindow("WEEKLY - All Models (7-day)", data.seven_day));
  lines.push("");

  if (data.seven_day_opus !== undefined) {
    lines.push(formatWindow("WEEKLY - Opus", data.seven_day_opus));
    lines.push("");
  }

  if (data.seven_day_sonnet !== undefined) {
    lines.push(formatWindow("WEEKLY - Sonnet", data.seven_day_sonnet));
    lines.push("");
  }

  lines.push(formatExtraUsage(data.extra_usage));
  lines.push("");

  const cacheAge = getCacheAge();
  if (source === "cache" && cacheAge !== null) {
    lines.push(`(cached ${cacheAge}s ago)`);
  } else if (source === "stale" && cacheAge !== null) {
    lines.push(`(stale cache from ${cacheAge}s ago)`);
  } else {
    lines.push("(live data)");
  }

  return lines.join("\n");
}

export function formatSessionUsage(data: UsageResponse): string {
  const lines: string[] = [];
  lines.push("=== Session Usage (5-hour window) ===");
  lines.push("");
  lines.push(formatWindow("Current Session", data.five_hour));
  return lines.join("\n");
}

export function formatWeeklyLimits(data: UsageResponse): string {
  const lines: string[] = [];
  lines.push("=== Weekly Limits (7-day) ===");
  lines.push("");

  lines.push(formatWindow("All Models", data.seven_day));
  lines.push("");

  if (data.seven_day_opus !== undefined) {
    lines.push(formatWindow("Opus", data.seven_day_opus));
    lines.push("");
  }

  if (data.seven_day_sonnet !== undefined) {
    lines.push(formatWindow("Sonnet", data.seven_day_sonnet));
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function formatExtraUsage(extra: ExtraUsage | null): string {
  if (!extra) return "EXTRA USAGE: N/A";

  if (!extra.is_enabled) return "EXTRA USAGE: Disabled";

  const parts = ["EXTRA USAGE: Enabled"];
  if (extra.monthly_limit !== null) {
    parts.push(`  Monthly limit: $${extra.monthly_limit.toFixed(2)}`);
  }
  if (extra.used_credits !== null) {
    parts.push(`  Used: $${extra.used_credits.toFixed(2)}`);
  }
  if (extra.utilization !== null) {
    parts.push(`  ${progressBar(extra.utilization)}  ${extra.utilization.toFixed(0)}%`);
  }

  return parts.join("\n");
}

export function formatRateStatus(data: UsageResponse): string {
  const lines: string[] = [];
  lines.push("=== Rate Limit Status ===");
  lines.push("");

  const sessionPct = data.five_hour.utilization;
  const weeklyPct = data.seven_day.utilization;

  if (sessionPct >= 80 || weeklyPct >= 80) {
    lines.push("STATUS: HIGH USAGE");
    lines.push("You are likely to experience rate limiting soon.");
  } else if (sessionPct >= 50 || weeklyPct >= 50) {
    lines.push("STATUS: MODERATE USAGE");
    lines.push("You have headroom but are approaching limits.");
  } else {
    lines.push("STATUS: LOW USAGE");
    lines.push("Plenty of capacity available.");
  }

  lines.push("");
  lines.push(`Session: ${sessionPct.toFixed(0)}% | Weekly: ${weeklyPct.toFixed(0)}%`);

  if (sessionPct >= 80) {
    const reset = formatResetTime(data.five_hour.resets_at);
    lines.push(`Session limit approaching. ${reset}`);
  }
  if (weeklyPct >= 80) {
    const reset = formatResetTime(data.seven_day.resets_at);
    lines.push(`Weekly limit approaching. ${reset}`);
  }

  return lines.join("\n");
}

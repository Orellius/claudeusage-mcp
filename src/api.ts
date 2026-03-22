import { getOAuthToken, getCredentialSource } from "./credentials.js";
import { getCached, getStaleCached, setCache } from "./cache.js";
import type { UsageResponse } from "./types.js";

const USAGE_ENDPOINT = "https://api.anthropic.com/api/oauth/usage";
const BETA_HEADER = "oauth-2025-04-20";

export interface FetchResult {
  data: UsageResponse | null;
  source: "live" | "cache" | "stale";
  error: string | null;
}

export async function fetchUsage(): Promise<FetchResult> {
  const fresh = getCached();
  if (fresh) {
    return { data: fresh, source: "cache", error: null };
  }

  const token = getOAuthToken();
  if (!token) {
    const stale = getStaleCached();
    if (stale) {
      return {
        data: stale,
        source: "stale",
        error: `No OAuth token found. Checked: ${getCredentialSource()}. Using stale cache.`,
      };
    }

    return {
      data: null,
      source: "live",
      error: [
        "No OAuth token found.",
        `Checked: ${getCredentialSource()}`,
        "",
        "Fix: Restart Claude Code to trigger a fresh OAuth login.",
        "The token is created automatically when you sign in with your Pro/Max account.",
      ].join("\n"),
    };
  }

  try {
    const response = await fetch(USAGE_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "anthropic-beta": BETA_HEADER,
        "User-Agent": "claudeusage-mcp/1.0.0",
      },
    });

    if (response.status === 429) {
      const stale = getStaleCached();
      if (stale) {
        return {
          data: stale,
          source: "stale",
          error: "Rate limited (429). Serving stale cached data.",
        };
      }

      return {
        data: null,
        source: "live",
        error: "Rate limited by Anthropic (429) and no cached data available. Try again in a minute.",
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        data: null,
        source: "live",
        error: [
          `Authentication failed (${response.status}).`,
          "Your OAuth token may be expired or missing required scopes.",
          "",
          "Fix: Restart Claude Code to get a fresh OAuth token.",
          "Required scopes: user:inference, user:profile",
        ].join("\n"),
      };
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        data: null,
        source: "live",
        error: `API returned ${response.status}: ${body}`,
      };
    }

    const data = (await response.json()) as UsageResponse;
    setCache(data);
    return { data, source: "live", error: null };
  } catch (err) {
    const stale = getStaleCached();
    if (stale) {
      return {
        data: stale,
        source: "stale",
        error: `Network error: ${err instanceof Error ? err.message : String(err)}. Serving stale cache.`,
      };
    }

    return {
      data: null,
      source: "live",
      error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

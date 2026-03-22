export interface UsageWindow {
  utilization: number;
  resets_at: string | null;
}

export interface ExtraUsage {
  is_enabled: boolean;
  monthly_limit: number | null;
  used_credits: number | null;
  utilization: number | null;
}

export interface UsageResponse {
  five_hour: UsageWindow;
  seven_day: UsageWindow;
  seven_day_opus: UsageWindow | null;
  seven_day_sonnet: UsageWindow | null;
  seven_day_oauth_apps: UsageWindow | null;
  seven_day_cowork: UsageWindow | null;
  extra_usage: ExtraUsage | null;
  [key: string]: unknown;
}

export interface CachedUsage {
  data: UsageResponse;
  fetchedAt: number;
}

export interface CredentialStore {
  claudeAiOauth: {
    accessToken: string;
    scopes: string[];
  };
}

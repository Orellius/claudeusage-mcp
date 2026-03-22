import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { CredentialStore } from "./types.js";

const KEYCHAIN_SERVICE = "Claude Code-credentials";
const CREDENTIALS_PATH = join(homedir(), ".claude", ".credentials.json");

function readFromKeychain(): string | null {
  try {
    const raw = execSync(
      `security find-generic-password -s "${KEYCHAIN_SERVICE}" -w`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();

    const creds: CredentialStore = JSON.parse(raw);
    return creds.claudeAiOauth?.accessToken ?? null;
  } catch {
    return null;
  }
}

function readFromFile(): string | null {
  try {
    if (!existsSync(CREDENTIALS_PATH)) {
      return null;
    }

    const raw = readFileSync(CREDENTIALS_PATH, "utf-8");
    const creds: CredentialStore = JSON.parse(raw);
    return creds.claudeAiOauth?.accessToken ?? null;
  } catch {
    return null;
  }
}

export function getOAuthToken(): string | null {
  const platform = process.platform;

  if (platform === "darwin") {
    const token = readFromKeychain();
    if (token) return token;
    return readFromFile();
  }

  return readFromFile();
}

export function getCredentialSource(): string {
  if (process.platform === "darwin") {
    return `macOS Keychain (service: "${KEYCHAIN_SERVICE}") or ${CREDENTIALS_PATH}`;
  }
  return CREDENTIALS_PATH;
}

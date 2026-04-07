import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const FIREBASE_CLI_CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLI_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";
const FIREBASE_CLI_TOKEN_URL = "https://www.googleapis.com/oauth2/v3/token";

interface FirebaseToolsConfig {
  tokens?: {
    access_token?: string;
    refresh_token?: string;
  };
}

async function readFirebaseToolsConfig(): Promise<FirebaseToolsConfig> {
  const path = join(homedir(), ".config", "configstore", "firebase-tools.json");
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as FirebaseToolsConfig;
}

async function refreshFirebaseCliAccessToken(
  refreshToken: string,
): Promise<string> {
  const body = new URLSearchParams({
    client_id: FIREBASE_CLI_CLIENT_ID,
    client_secret: FIREBASE_CLI_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(FIREBASE_CLI_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to refresh Firebase CLI access token: ${response.status} ${await response.text()}`,
    );
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google OAuth refresh response did not include an access token.");
  }

  return data.access_token;
}

export async function getFirebaseCliAccessToken(): Promise<string> {
  const config = await readFirebaseToolsConfig();
  const refreshToken = config.tokens?.refresh_token;
  const accessToken = config.tokens?.access_token;

  if (refreshToken) {
    return refreshFirebaseCliAccessToken(refreshToken);
  }

  if (accessToken) {
    return accessToken;
  }

  throw new Error(
    "No Firebase CLI credentials found. Run `npx -y firebase-tools@latest login` first.",
  );
}

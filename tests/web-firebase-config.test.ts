import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_FIREBASE_WEB_CONFIG,
  resolveFirebaseWebConfig,
} from "../src/lib/firebase-config";

test("resolveFirebaseWebConfig returns the current project defaults", () => {
  const config = resolveFirebaseWebConfig({});

  assert.deepEqual(config, DEFAULT_FIREBASE_WEB_CONFIG);
});

test("resolveFirebaseWebConfig prefers explicit env overrides", () => {
  const config = resolveFirebaseWebConfig({
    VITE_FIREBASE_PROJECT_ID: "custom-project",
    VITE_FIREBASE_API_KEY: "custom-key",
  });

  assert.equal(config.projectId, "custom-project");
  assert.equal(config.apiKey, "custom-key");
  assert.equal(
    config.authDomain,
    DEFAULT_FIREBASE_WEB_CONFIG.authDomain,
  );
});

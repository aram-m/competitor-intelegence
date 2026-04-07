import assert from "node:assert/strict";
import test from "node:test";

import {
  getCompetitorInitials,
  getCompetitorLogoUrl,
} from "../src/lib/competitor-presentation";

test("getCompetitorLogoUrl prefers an explicit logoUrl", () => {
  assert.equal(
    getCompetitorLogoUrl({
      id: "figment",
      name: "Figment",
      slug: "figment",
      website: "https://figment.io",
      logoUrl: "https://cdn.example.com/figment.svg",
      category: "staking",
      isActive: true,
      createdAt: {} as never,
    }),
    "https://cdn.example.com/figment.svg",
  );
});

test("getCompetitorLogoUrl falls back to a website favicon", () => {
  assert.equal(
    getCompetitorLogoUrl({
      id: "kiln",
      name: "Kiln",
      slug: "kiln",
      website: "https://kiln.fi",
      category: "staking",
      isActive: true,
      createdAt: {} as never,
    }),
    "https://www.google.com/s2/favicons?sz=128&domain_url=https%3A%2F%2Fkiln.fi",
  );
});

test("getCompetitorInitials builds readable initials", () => {
  assert.equal(getCompetitorInitials("Chaos Labs"), "CL");
  assert.equal(getCompetitorInitials("Figment"), "F");
});

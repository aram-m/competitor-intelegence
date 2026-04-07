import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveMobileCarouselSelection,
  resolveSwipeDeckTargetIndex,
} from "../src/lib/company-carousel";

test("resolveMobileCarouselSelection preserves the active company when it still exists", () => {
  const selection = resolveMobileCarouselSelection({
    currentCompetitorId: "kiln",
    currentIndex: 2,
    competitorIds: ["figment", "kiln", "yield-xyz"],
  });

  assert.deepEqual(selection, {
    activeCompetitorId: "kiln",
    activeIndex: 1,
  });
});

test("resolveMobileCarouselSelection clamps to a valid index when the active company disappears", () => {
  const selection = resolveMobileCarouselSelection({
    currentCompetitorId: "chorus-one",
    currentIndex: 4,
    competitorIds: ["blockdaemon", "gauntlet"],
  });

  assert.deepEqual(selection, {
    activeCompetitorId: "gauntlet",
    activeIndex: 1,
  });
});

test("resolveMobileCarouselSelection resets cleanly for an empty carousel", () => {
  const selection = resolveMobileCarouselSelection({
    currentCompetitorId: "kiln",
    currentIndex: 1,
    competitorIds: [],
  });

  assert.deepEqual(selection, {
    activeCompetitorId: null,
    activeIndex: 0,
  });
});

test("resolveSwipeDeckTargetIndex advances when dragged far enough to the left", () => {
  assert.equal(
    resolveSwipeDeckTargetIndex({
      activeIndex: 1,
      cardCount: 4,
      cardWidth: 320,
      deltaX: -90,
    }),
    2,
  );
});

test("resolveSwipeDeckTargetIndex goes back when dragged far enough to the right", () => {
  assert.equal(
    resolveSwipeDeckTargetIndex({
      activeIndex: 2,
      cardCount: 4,
      cardWidth: 320,
      deltaX: 90,
    }),
    1,
  );
});

test("resolveSwipeDeckTargetIndex snaps back when the drag is below threshold", () => {
  assert.equal(
    resolveSwipeDeckTargetIndex({
      activeIndex: 1,
      cardCount: 4,
      cardWidth: 320,
      deltaX: -40,
    }),
    1,
  );
});

test("resolveSwipeDeckTargetIndex clamps at the ends of the deck", () => {
  assert.equal(
    resolveSwipeDeckTargetIndex({
      activeIndex: 0,
      cardCount: 4,
      cardWidth: 320,
      deltaX: 120,
    }),
    0,
  );
  assert.equal(
    resolveSwipeDeckTargetIndex({
      activeIndex: 3,
      cardCount: 4,
      cardWidth: 320,
      deltaX: -120,
    }),
    3,
  );
});

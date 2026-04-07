export interface MobileCarouselSelectionInput {
  currentCompetitorId: string | null;
  currentIndex: number;
  competitorIds: string[];
}

export interface MobileCarouselSelection {
  activeCompetitorId: string | null;
  activeIndex: number;
}

export interface SwipeDeckTargetIndexInput {
  activeIndex: number;
  cardCount: number;
  cardWidth: number;
  deltaX: number;
}

const SWIPE_DECK_THRESHOLD_RATIO = 0.18;

export function resolveMobileCarouselSelection({
  currentCompetitorId,
  currentIndex,
  competitorIds,
}: MobileCarouselSelectionInput): MobileCarouselSelection {
  if (competitorIds.length === 0) {
    return {
      activeCompetitorId: null,
      activeIndex: 0,
    };
  }

  if (currentCompetitorId) {
    const preservedIndex = competitorIds.indexOf(currentCompetitorId);
    if (preservedIndex !== -1) {
      return {
        activeCompetitorId: currentCompetitorId,
        activeIndex: preservedIndex,
      };
    }
  }

  const clampedIndex = Math.min(
    Math.max(currentIndex, 0),
    competitorIds.length - 1,
  );

  return {
    activeCompetitorId: competitorIds[clampedIndex],
    activeIndex: clampedIndex,
  };
}

export function resolveSwipeDeckTargetIndex({
  activeIndex,
  cardCount,
  cardWidth,
  deltaX,
}: SwipeDeckTargetIndexInput): number {
  if (cardCount <= 0) {
    return 0;
  }

  const threshold = Math.max(cardWidth * SWIPE_DECK_THRESHOLD_RATIO, 48);

  if (deltaX <= -threshold) {
    return Math.min(activeIndex + 1, cardCount - 1);
  }

  if (deltaX >= threshold) {
    return Math.max(activeIndex - 1, 0);
  }

  return activeIndex;
}

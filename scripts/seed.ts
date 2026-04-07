/**
 * Seed script — run with: npx tsx scripts/seed.ts
 * Populates Firestore with competitors and crawl sources using the local
 * Firebase CLI session for authenticated REST writes.
 */
import { COMPETITOR_SEEDS } from "../src/lib/competitor-seeds";
import { getCompetitorLogoUrl } from "../src/lib/competitor-presentation";
import { getFirebaseCliAccessToken } from "./lib/firebase-cli-auth";

const PROJECT_ID = "p2p-hackathon";
const DATABASE_ID = "(default)";
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

function encodeSegment(value: string): string {
  return encodeURIComponent(value);
}

function sourceIdFor(competitorSlug: string, index: number, type: string): string {
  return `${competitorSlug}-${type}-${index + 1}`;
}

function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    return { stringValue: value };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const fields = Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        toFirestoreValue(nestedValue),
      ]),
    );
    return { mapValue: { fields } };
  }

  throw new Error(`Unsupported Firestore value: ${String(value)}`);
}

async function upsertDocument(
  accessToken: string,
  collectionName: string,
  documentId: string,
  data: Record<string, unknown>,
) {
  const fields = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)]),
  );

  const response = await fetch(
    `${FIRESTORE_BASE_URL}/${encodeSegment(collectionName)}/${encodeSegment(documentId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to write ${collectionName}/${documentId}: ${response.status} ${body}`,
    );
  }
}

type FirestoreListDocument = {
  name: string;
  fields?: Record<string, { stringValue?: string }>;
};

async function listCollectionDocuments(
  accessToken: string,
  collectionName: string,
): Promise<FirestoreListDocument[]> {
  const documents: FirestoreListDocument[] = [];
  let pageToken = "";

  do {
    const url = new URL(`${FIRESTORE_BASE_URL}/${encodeSegment(collectionName)}`);
    url.searchParams.set("pageSize", "500");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to list ${collectionName}: ${response.status} ${body}`,
      );
    }

    const data = (await response.json()) as {
      documents?: FirestoreListDocument[];
      nextPageToken?: string;
    };

    documents.push(...(data.documents ?? []));
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  return documents;
}

async function deactivateObsoleteSources(
  accessToken: string,
  competitorId: string,
  activeSourceIds: Set<string>,
) {
  const sources = await listCollectionDocuments(accessToken, "sources");

  for (const source of sources) {
    const sourceId = source.name.split("/").pop() || "";
    const sourceCompetitorId = source.fields?.competitorId?.stringValue;

    if (
      sourceCompetitorId === competitorId &&
      sourceId &&
      !activeSourceIds.has(sourceId)
    ) {
      await upsertDocument(accessToken, "sources", sourceId, {
        isActive: false,
      });
      console.log(`    Deactivated obsolete source: ${sourceId}`);
    }
  }
}

async function seed() {
  const accessToken = await getFirebaseCliAccessToken();
  const now = new Date();

  console.log("=== Seeding Competitors And Sources ===\n");

  for (const comp of COMPETITOR_SEEDS) {
    const competitorId = comp.slug;
    const sourceIds = new Set<string>();

    await upsertDocument(accessToken, "competitors", competitorId, {
      name: comp.name,
      slug: comp.slug,
      category: comp.category,
      logoUrl: getCompetitorLogoUrl({
        website: comp.website,
        logoUrl: comp.logoUrl,
      }),
      website: comp.website,
      isActive: true,
      createdAt: now,
    });

    console.log(`  Competitor: ${comp.name} (${competitorId})`);

    for (const [index, source] of comp.sources.entries()) {
      const sourceId = sourceIdFor(comp.slug, index, source.type);
      sourceIds.add(sourceId);
      await upsertDocument(accessToken, "sources", sourceId, {
        competitorId,
        competitorName: comp.name,
        type: source.type,
        url: source.url,
        config: source.config ?? {},
        isActive: true,
        createdAt: now,
      });
      console.log(`    Source: ${source.type} — ${source.url}`);
    }

    await deactivateObsoleteSources(accessToken, competitorId, sourceIds);
  }

  console.log(
    `\nDone! Seeded ${COMPETITOR_SEEDS.length} competitors and their live crawl sources.`,
  );
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

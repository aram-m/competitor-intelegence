/**
 * Cleanup script — run with: npx tsx scripts/cleanup-signals.ts
 * Removes duplicate signals by canonical identity and drops invalid hiring rows.
 */
import { getFirebaseCliAccessToken } from "./lib/firebase-cli-auth";
import {
  planSignalCleanup,
  type CleanupSignalRecord,
  type CleanupSourceRecord,
} from "./lib/signal-cleanup";

const PROJECT_ID = "p2p-hackathon";
const DATABASE_ID = "(default)";
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

interface FirestoreDocument {
  name: string;
  fields?: Record<
    string,
    {
      stringValue?: string;
      timestampValue?: string;
      booleanValue?: boolean;
      mapValue?: {
        fields?: Record<string, { stringValue?: string }>;
      };
    }
  >;
}

interface FirestoreListResponse {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
}

function stringField(
  fields: FirestoreDocument["fields"],
  key: string,
): string {
  return fields?.[key]?.stringValue ?? "";
}

function timestampField(
  fields: FirestoreDocument["fields"],
  key: string,
): string {
  return fields?.[key]?.timestampValue ?? "";
}

function booleanField(
  fields: FirestoreDocument["fields"],
  key: string,
): boolean {
  return fields?.[key]?.booleanValue ?? false;
}

function nestedStringField(
  fields: FirestoreDocument["fields"],
  key: string,
  nestedKey: string,
): string {
  return fields?.[key]?.mapValue?.fields?.[nestedKey]?.stringValue ?? "";
}

async function listCollection(
  accessToken: string,
  collectionName: string,
): Promise<FirestoreDocument[]> {
  const documents: FirestoreDocument[] = [];
  let pageToken = "";

  do {
    const url = new URL(`${FIRESTORE_BASE_URL}/${collectionName}`);
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
      throw new Error(
        `Failed to list ${collectionName}: ${response.status} ${await response.text()}`,
      );
    }

    const data = (await response.json()) as FirestoreListResponse;
    documents.push(...(data.documents ?? []));
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  return documents;
}

async function deleteDocument(accessToken: string, documentName: string) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/${documentName}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to delete ${documentName}: ${response.status} ${await response.text()}`);
  }
}

async function cleanup() {
  const accessToken = await getFirebaseCliAccessToken();
  const [signalDocs, sourceDocs] = await Promise.all([
    listCollection(accessToken, "signals"),
    listCollection(accessToken, "sources"),
  ]);

  const signalsById = new Map<string, FirestoreDocument>();
  const signals: CleanupSignalRecord[] = signalDocs
    .map((doc) => {
      const id = doc.name.split("/").pop() || "";
      signalsById.set(id, doc);

      return {
        id,
        competitorId: stringField(doc.fields, "competitorId"),
        sourceId: stringField(doc.fields, "sourceId"),
        sourceType: stringField(doc.fields, "sourceType"),
        url: stringField(doc.fields, "url"),
        updatedAt: timestampField(doc.fields, "updatedAt"),
        createdAt: timestampField(doc.fields, "createdAt"),
      };
    })
    .filter((signal) => signal.id && signal.competitorId && signal.sourceId && signal.url);

  const sources: CleanupSourceRecord[] = sourceDocs
    .map((doc) => ({
      id: doc.name.split("/").pop() || "",
      type: stringField(doc.fields, "type"),
      isActive: booleanField(doc.fields, "isActive"),
      allowedUrlPattern: nestedStringField(doc.fields, "config", "allowedUrlPattern"),
    }))
    .filter((source) => source.id && source.type);

  const deletions = planSignalCleanup({ signals, sources });

  for (const deletion of deletions) {
    const doc = signalsById.get(deletion.id);
    if (!doc) continue;

    await deleteDocument(accessToken, doc.name);
    console.log(`Deleted ${doc.name} (${deletion.reason})`);
  }

  console.log(`Cleanup complete. Removed ${deletions.length} stale or duplicate signal(s).`);
}

cleanup().catch((error) => {
  console.error("Cleanup failed:", error);
  process.exit(1);
});

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { StoredCompanySummary } from "@/types";

export function useCompanySummaries() {
  const [companySummaries, setCompanySummaries] = useState<StoredCompanySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "company_summaries"),
      orderBy("competitorName", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StoredCompanySummary[];

      setCompanySummaries(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { companySummaries, loading };
}

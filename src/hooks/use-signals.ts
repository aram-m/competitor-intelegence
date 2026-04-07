import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Signal } from "@/types";

export function useSignals(competitorId?: string) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints = [
      where("isArchived", "==", false),
      orderBy("createdAt", "desc"),
      limit(500),
    ];

    if (competitorId) {
      constraints.unshift(where("competitorId", "==", competitorId));
    }

    const q = query(collection(db, "signals"), ...constraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Signal[];
      setSignals(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [competitorId]);

  return { signals, loading };
}

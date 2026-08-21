import { getMobProducts, MobProduct } from "@/services/api";
import { useCallback, useEffect, useState } from "react";

// Cache is keyed by "catId-subCatId" since products are always fetched
// scoped to a specific category+subcategory pair, unlike categories
// which are fetched globally in one shot.
const cache = new Map<string, MobProduct[]>();
const inFlight = new Map<string, Promise<MobProduct[]>>();

function keyFor(catId: number, subCatId: number) {
  return `${catId}-${subCatId}`;
}

async function fetchProducts(
  catId: number,
  subCatId: number,
  force = false,
): Promise<MobProduct[]> {
  const key = keyFor(catId, subCatId);

  if (!force && cache.has(key)) return cache.get(key)!;
  if (!force && inFlight.has(key)) return inFlight.get(key)!;

  const promise = getMobProducts(catId, subCatId)
    .then((data) => {
      cache.set(key, data);
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

export function useMobProducts(catId: number, subCatId: number) {
  const key = keyFor(catId, subCatId);

  const [products, setProducts] = useState<MobProduct[]>(cache.get(key) ?? []);
  const [loading, setLoading] = useState(!cache.has(key));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!catId || !subCatId) return;
      try {
        if (force) setRefreshing(true);
        else setLoading(true);
        setError(null);
        const data = await fetchProducts(catId, subCatId, force);
        setProducts(data);
      } catch (err: any) {
        setError(err?.message || "Unable to load products.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [catId, subCatId],
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catId, subCatId]);

  return {
    products,
    loading,
    refreshing,
    error,
    refetch: () => load(true),
  };
}

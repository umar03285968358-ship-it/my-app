import { getMobProducts, MobProduct } from "@/services/api";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";

// Cache is keyed by "catId-subCatId" since products are always fetched
// scoped to a specific category+subcategory pair.
const cache = new Map<string, MobProduct[]>();

// Keeps track of requests currently running for each key.
const inFlight = new Map<string, Promise<MobProduct[]>>();

// Keeps track of the latest request number for each key.
// This prevents an older API response from overwriting
// a newer API response.
const requestVersions = new Map<string, number>();

function keyFor(catId: number, subCatId: number) {
  return `${catId}-${subCatId}`;
}

async function fetchProducts(
  catId: number,
  subCatId: number,
  force = false,
): Promise<MobProduct[]> {
  const key = keyFor(catId, subCatId);

  /*
   * Normal request:
   *
   * If we already have cached data, use it.
   */
  if (!force && cache.has(key)) {
    return cache.get(key)!;
  }

  /*
   * Normal request:
   *
   * If the same request is already running,
   * use that request instead of creating another one.
   */
  if (!force && inFlight.has(key)) {
    return inFlight.get(key)!;
  }

  /*
   * Every new request gets a new version.
   *
   * This is especially important for forced refreshes.
   */
  const currentVersion = (requestVersions.get(key) ?? 0) + 1;

  requestVersions.set(key, currentVersion);

  const promise = getMobProducts(catId, subCatId)
    .then((data) => {
      /*
       * Only the newest request is allowed to update
       * the global cache.
       *
       * If an older request finishes after a newer request,
       * its response is ignored.
       */
      if (requestVersions.get(key) === currentVersion) {
        cache.set(key, data);
      }

      return data;
    })
    .finally(() => {
      /*
       * Only remove the in-flight reference if this is
       * still the current request.
       */
      if (inFlight.get(key) === promise) {
        inFlight.delete(key);
      }
    });

  inFlight.set(key, promise);

  return promise;
}

export function useMobProducts(
  catId: number | null,
  subCatId: number,
) {
  const key = keyFor(catId ?? 0, subCatId);

  const [products, setProducts] = useState<MobProduct[]>(
    cache.get(key) ?? [],
  );

  const [loading, setLoading] = useState(!cache.has(key));

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /*
   * Load products.
   */
  const load = useCallback(
    async (force = false) => {
      if (!catId || !subCatId) return;

      try {
        if (force) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const data = await fetchProducts(
          catId,
          subCatId,
          force,
        );

        /*
         * Update the products displayed by this screen
         * with the response returned by the request.
         */
        setProducts(data);
      } catch (err: any) {
        setError(
          err?.message || "Unable to load products.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [catId, subCatId],
  );

  /*
   * Initial load.
   *
   * If cached data exists, fetchProducts() returns the
   * cached data and does not make another API request.
   */
  useEffect(() => {
    load();
  }, [load]);

  /*
   * Forced refresh.
   *
   * This function remains stable and can safely be used
   * inside the screen's focus effect.
   */
  const refetch = useCallback(() => {
    return load(true);
  }, [load]);

  /*
   * SILENT REFRESH WHEN SCREEN GETS FOCUS
   * --------------------------------------------------------------
   *
   * This does NOT depend on any ref/mount-lifecycle tracking in the
   * screen. useFocusEffect fires every single time this hook's
   * screen becomes focused, regardless of whether the component was
   * kept mounted (e.g. returning from a detail screen pushed on top)
   * or fully unmounted/remounted (e.g. returning via a tab or a
   * different route). That mount-lifecycle difference was the root
   * cause of stale data only showing up in some navigation cases.
   *
   * This intentionally does NOT use:
   *
   * setLoading(true)
   *
   * so there's no flicker — the existing list stays visible while
   * the request happens, and gets replaced once fresh data arrives.
   */
  useFocusEffect(
    useCallback(() => {
      if (!catId || !subCatId) return;

      let active = true;

      const silentRefresh = async () => {
        try {
          const data = await fetchProducts(catId, subCatId, true);

          if (!active) return;

          setProducts(data);
          setError(null);
        } catch (err: any) {
          // Do not disturb the existing UI during a silent refresh.
          console.log(
            "[PRODUCTS] Silent refresh failed:",
            err,
          );
        }
      };

      silentRefresh();

      return () => {
        active = false;
      };
    }, [catId, subCatId]),
  );

  return {
    products,
    loading,
    refreshing,
    error,
    refetch,
  };
}
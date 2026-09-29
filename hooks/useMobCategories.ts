import { getMobCategories, MobCategory } from "@/services/api";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";

let cache: MobCategory[] | null = null;

let inFlight: Promise<MobCategory[]> | null = null;

async function fetchCategories(
  force = false
): Promise<MobCategory[]> {
  if (cache && !force) return cache;

  // Never allow multiple requests to run at the same time.
  // This also keeps focus refresh + initial loading safe.
  if (inFlight) return inFlight;

  inFlight = getMobCategories()
    .then((data) => {
      cache = data;
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function useMobCategories() {
  const [categories, setCategories] =
    useState<MobCategory[]>(cache ?? []);

  const [loading, setLoading] =
    useState(!cache);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      try {
        if (force) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const data = await fetchCategories(force);

        setCategories(data);
      } catch (err: any) {
        setError(
          err?.message ||
            "Unable to load categories."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // --------------------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------------------

  useEffect(() => {
    load();
  }, [load]);

  // --------------------------------------------------------------
  // SILENT REFRESH WHEN SCREEN GETS FOCUS
  // --------------------------------------------------------------
  //
  // This is the important part.
  //
  // When the user:
  //
  // Home -> Categories
  //
  // Categories becomes focused and we fetch the latest categories
  // from the backend.
  //
  // This refresh intentionally does NOT use:
  //
  // setLoading(true)
  // setRefreshing(true)
  //
  // Therefore there is no spinner or refresh indicator.
  //
  // The existing list stays visible while the request happens.
  //
  // Once the API responds, the list is replaced with the newest
  // categories.
  //
  // --------------------------------------------------------------

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const silentRefresh = async () => {
        try {
          const data = await fetchCategories(true);

          if (!active) return;

          setCategories(data);
          setError(null);
        } catch (err: any) {
          // Do not disturb the existing UI during a silent refresh.
          console.log(
            "[CATEGORIES] Silent refresh failed:",
            err
          );
        }
      };

      silentRefresh();

      return () => {
        active = false;
      };
    }, [])
  );

  const mainCategories = categories.filter(
    (c) => c.type === "Cat"
  );

  const getCategoryById = (catId: number) =>
    categories.find(
      (c) =>
        c.type === "Cat" &&
        c.id === catId
    );

  const getSubcategoriesByCategory = (
    parentId: number
  ) =>
    categories.filter(
      (c) =>
        c.type === "SubCat" &&
        c.parentId === parentId
    );

  return {
    categories,
    mainCategories,
    getCategoryById,
    getSubcategoriesByCategory,

    loading,
    refreshing,
    error,

    // Existing manual refetch behavior
    refetch: () => load(true),

    // Existing pull-to-refresh behavior
    refresh: () => load(true),
  };
}
import { getMobCategories, MobCategory } from "@/services/api";
import { useCallback, useEffect, useState } from "react";

let cache: MobCategory[] | null = null;
let inFlight: Promise<MobCategory[]> | null = null;

async function fetchCategories(force = false): Promise<MobCategory[]> {
  if (cache && !force) return cache;
  if (inFlight && !force) return inFlight;

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
  const [categories, setCategories] = useState<MobCategory[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await fetchCategories(force);
      setCategories(data);
    } catch (err: any) {
      setError(err?.message || "Unable to load categories.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mainCategories = categories.filter((c) => c.type === "Cat");

  const getCategoryById = (catId: number) =>
    categories.find((c) => c.type === "Cat" && c.id === catId);

  const getSubcategoriesByCategory = (parentId: number) =>
    categories.filter((c) => c.type === "SubCat" && c.parentId === parentId);

  return {
    categories,
    mainCategories,
    getCategoryById,
    getSubcategoriesByCategory,
    loading,
    refreshing,
    error,
    refetch: () => load(true),
  };
}

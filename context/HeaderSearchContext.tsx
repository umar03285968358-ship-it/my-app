import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type HeaderSearchContextValue = {
  hasSearchScreen: boolean;
  isSearchOpen: boolean;
  registerSearch: (id: string) => void;
  unregisterSearch: (id: string) => void;
  openSearch: () => void;
  closeSearch: () => void;
};

const HeaderSearchContext = createContext<HeaderSearchContextValue | null>(
  null,
);

export function HeaderSearchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Registry of every screen currently claiming "I have a search bar".
  // A Set (rather than a single boolean) means one screen's unregister
  // can never wipe out another screen's registration that's already
  // in flight — no more "last effect to run wins" race between the
  // leaving screen's cleanup and the entering screen's registration.
  const registeredIdsRef = useRef<Set<string>>(new Set());

  const [hasSearchScreen, setHasSearchScreen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const registerSearch = useCallback((id: string) => {
    registeredIdsRef.current.add(id);
    setHasSearchScreen(true);
    // Registering (or re-registering, e.g. on refocus) always starts
    // collapsed — satisfies "hidden by default" / "reset on every visit".
    setIsSearchOpen(false);
  }, []);

  const unregisterSearch = useCallback((id: string) => {
    registeredIdsRef.current.delete(id);
    // Only flip hasSearchScreen to false if NO screen is registered
    // anymore. If another screen already registered before this
    // cleanup ran, the Set is non-empty and we leave hasSearchScreen
    // as true — this is what kills the flicker.
    if (registeredIdsRef.current.size === 0) {
      setHasSearchScreen(false);
      setIsSearchOpen(false);
    }
  }, []);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const value = useMemo(
    () => ({
      hasSearchScreen,
      isSearchOpen,
      registerSearch,
      unregisterSearch,
      openSearch,
      closeSearch,
    }),
    [
      hasSearchScreen,
      isSearchOpen,
      registerSearch,
      unregisterSearch,
      openSearch,
      closeSearch,
    ],
  );

  return (
    <HeaderSearchContext.Provider value={value}>
      {children}
    </HeaderSearchContext.Provider>
  );
}

export function useHeaderSearch() {
  const ctx = useContext(HeaderSearchContext);
  if (!ctx) {
    throw new Error("useHeaderSearch must be used within HeaderSearchProvider");
  }
  return ctx;
}

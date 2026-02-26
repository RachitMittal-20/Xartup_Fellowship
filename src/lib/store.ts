"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CompanyNote,
  CompanyList,
  SavedSearch,
  SearchFilters,
  EnrichmentData,
} from "./types";

// ── Generic localStorage hook ──────────────────────────────

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [key]);

  const set = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (prev: T) => T)(prev)
            : updater;
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  return [value, set, loaded] as const;
}

// ── Notes ──────────────────────────────────────────────────

export function useNotes(companyId: string) {
  const [notes, setNotes, loaded] = useLocalStorage<CompanyNote[]>(
    "vc-scout-notes",
    []
  );

  const companyNotes = notes
    .filter((n) => n.companyId === companyId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const addNote = (content: string) => {
    const note: CompanyNote = {
      id: crypto.randomUUID(),
      companyId,
      content,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [...prev, note]);
  };

  const deleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const updateNote = (noteId: string, content: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, content } : n))
    );
  };

  return { notes: companyNotes, addNote, deleteNote, updateNote, loaded };
}

// ── Lists ──────────────────────────────────────────────────

export function useLists() {
  const [lists, setLists, loaded] = useLocalStorage<CompanyList[]>(
    "vc-scout-lists",
    []
  );

  const createList = (name: string, description?: string) => {
    const list: CompanyList = {
      id: crypto.randomUUID(),
      name,
      description,
      companyIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLists((prev) => [...prev, list]);
    return list;
  };

  const deleteList = (listId: string) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
  };

  const renameList = (listId: string, name: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, name, updatedAt: new Date().toISOString() }
          : l
      )
    );
  };

  const updateListDescription = (listId: string, description: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, description: description || undefined, updatedAt: new Date().toISOString() }
          : l
      )
    );
  };

  const addCompanyToList = (listId: string, companyId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId && !l.companyIds.includes(companyId)
          ? {
              ...l,
              companyIds: [...l.companyIds, companyId],
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
  };

  const removeCompanyFromList = (listId: string, companyId: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              companyIds: l.companyIds.filter((id) => id !== companyId),
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
  };

  const addCompaniesToList = (listId: string, companyIds: string[]) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const existing = new Set(l.companyIds);
        const newIds = companyIds.filter((id) => !existing.has(id));
        if (newIds.length === 0) return l;
        return {
          ...l,
          companyIds: [...l.companyIds, ...newIds],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const duplicateList = (listId: string) => {
    const original = lists.find((l) => l.id === listId);
    if (!original) return;
    const list: CompanyList = {
      id: crypto.randomUUID(),
      name: `${original.name} (copy)`,
      description: original.description,
      companyIds: [...original.companyIds],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLists((prev) => [...prev, list]);
    return list;
  };

  const getListsForCompany = (companyId: string) => {
    return lists.filter((l) => l.companyIds.includes(companyId));
  };

  return {
    lists,
    createList,
    deleteList,
    renameList,
    updateListDescription,
    addCompanyToList,
    addCompaniesToList,
    removeCompanyFromList,
    duplicateList,
    getListsForCompany,
    loaded,
  };
}

// ── Saved Searches ─────────────────────────────────────────

export function useSavedSearches() {
  const [searches, setSearches, loaded] = useLocalStorage<SavedSearch[]>(
    "vc-scout-saved-searches",
    []
  );

  const saveSearch = (name: string, query: string, filters: SearchFilters) => {
    const search: SavedSearch = {
      id: crypto.randomUUID(),
      name,
      query,
      filters,
      createdAt: new Date().toISOString(),
    };
    setSearches((prev) => [...prev, search]);
    return search;
  };

  const deleteSearch = (searchId: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== searchId));
  };

  const renameSearch = (searchId: string, name: string) => {
    setSearches((prev) =>
      prev.map((s) => (s.id === searchId ? { ...s, name } : s))
    );
  };

  const duplicateSearch = (searchId: string) => {
    const original = searches.find((s) => s.id === searchId);
    if (!original) return;
    const search: SavedSearch = {
      id: crypto.randomUUID(),
      name: `${original.name} (copy)`,
      query: original.query,
      filters: { ...original.filters },
      createdAt: new Date().toISOString(),
    };
    setSearches((prev) => [...prev, search]);
    return search;
  };

  const updateSearch = (
    searchId: string,
    updates: { name?: string; query?: string; filters?: SearchFilters }
  ) => {
    setSearches((prev) =>
      prev.map((s) =>
        s.id === searchId ? { ...s, ...updates } : s
      )
    );
  };

  return {
    searches,
    saveSearch,
    deleteSearch,
    renameSearch,
    duplicateSearch,
    updateSearch,
    loaded,
  };
}

// ── Enrichment Cache ───────────────────────────────────────

export function useEnrichmentCache() {
  const [cache, setCache, loaded] = useLocalStorage<
    Record<string, EnrichmentData>
  >("vc-scout-enrichment-cache", {});

  const getCached = (companyId: string): EnrichmentData | null => {
    return cache[companyId] ?? null;
  };

  const setCached = (companyId: string, data: EnrichmentData) => {
    setCache((prev) => ({ ...prev, [companyId]: data }));
  };

  const clearCached = (companyId: string) => {
    setCache((prev) => {
      const next = { ...prev };
      delete next[companyId];
      return next;
    });
  };

  return { getCached, setCached, clearCached, loaded };
}

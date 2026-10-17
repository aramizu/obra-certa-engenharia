"use client";

import { useEffect } from "react";
import { SELECTED_PROJECT_STORAGE_KEYS } from "@/lib/domain-data";

export function StaleSelectionCleaner({ validProjectIds }: { validProjectIds: string[] }) {
  useEffect(() => {
    const valid = new Set(validProjectIds);
    const scrub = (storage: Storage) => {
      for (const key of SELECTED_PROJECT_STORAGE_KEYS) {
        const value = storage.getItem(key);
        if (value && !valid.has(value)) storage.removeItem(key);
      }
    };
    try {
      scrub(window.localStorage);
      scrub(window.sessionStorage);
    } catch {
      // storage indisponível
    }
  }, [validProjectIds]);

  return null;
}

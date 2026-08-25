"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export interface QuoteLineItem {
  productId: string;
  productTitle: string;
  productImageUrl: string | null;
  variantId: string;
  variantTitle: string | null;
  b2cPrice: number;
  quantity: number;
}

interface QuoteContextValue {
  items: QuoteLineItem[];
  addItem: (item: QuoteLineItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
}

const QuoteContext = createContext<QuoteContextValue | null>(null);

const STORAGE_KEY = "kakawa-quote";
const listeners = new Set<() => void>();

// Client-only, per-browser cart backed by localStorage. Nothing here is
// persisted server-side — see docs/build-plan.md's "Quotes are not
// persisted" note. useSyncExternalStore (rather than useState+useEffect)
// keeps server/client renders consistent with no hydration mismatch:
// getServerSnapshot always returns "empty", and the real value hydrates
// in on the client's first read.

function readRaw(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function getServerSnapshot(): string {
  return "[]";
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function writeItems(items: QuoteLineItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full/unavailable - in-memory listeners still update the UI
    // for this tab, it just won't survive a reload.
  }
  listeners.forEach((l) => l());
}

function parseItems(raw: string): QuoteLineItem[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  const items = useMemo(() => parseItems(raw), [raw]);

  const addItem = useCallback((item: QuoteLineItem) => {
    const current = parseItems(readRaw());
    const existing = current.find((i) => i.variantId === item.variantId);
    const next = existing
      ? current.map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      : [...current, item];
    writeItems(next);
  }, []);

  const removeItem = useCallback((variantId: string) => {
    writeItems(parseItems(readRaw()).filter((i) => i.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    const safeQty = Math.max(1, Math.floor(quantity) || 1);
    writeItems(
      parseItems(readRaw()).map((i) =>
        i.variantId === variantId ? { ...i, quantity: safeQty } : i
      )
    );
  }, []);

  const clear = useCallback(() => writeItems([]), []);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clear }),
    [items, addItem, removeItem, updateQuantity, clear]
  );

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote must be used within a QuoteProvider");
  return ctx;
}

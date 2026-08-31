"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Client-only quote history, mirroring quote-context.tsx's localStorage
// pattern (see that file's comment - quotes were a deliberate "no
// server-side persistence" decision, so history lives the same way: this
// browser, this device, not synced anywhere). No schema change needed.

export interface SavedQuoteLineItem {
  productTitle: string;
  variantTitle: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** Set when this line item came from a customization request the
   * customer chose to link in - see submitCustomizationRequest's
   * "Include in quote?" checkbox. Soft link, not enforced. */
  customizationReference?: string;
}

export interface SavedQuote {
  id: string;
  createdAt: string; // ISO
  companyName: string;
  quoteDate: string; // pre-formatted, matches the PDF
  validUntil: string; // pre-formatted, matches the PDF
  items: SavedQuoteLineItem[];
  grandTotal: number;
}

const HISTORY_KEY = "kakawa-quote-history";
const MAX_HISTORY = 50;
const listeners = new Set<() => void>();

function readRaw(): string {
  try {
    return window.localStorage.getItem(HISTORY_KEY) ?? "[]";
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

function parseHistory(raw: string): SavedQuote[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(quotes: SavedQuote[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(quotes));
  } catch {
    // Storage full/unavailable - in-memory listeners still update this tab.
  }
  listeners.forEach((l) => l());
}

/** Called right after a successful PDF download - see QuoteBuilder. */
export function saveQuoteToHistory(quote: Omit<SavedQuote, "id" | "createdAt">) {
  const current = parseHistory(readRaw());
  const entry: SavedQuote = {
    ...quote,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  // Newest first, capped so localStorage doesn't grow unbounded.
  writeHistory([entry, ...current].slice(0, MAX_HISTORY));
}

export function useQuoteHistory() {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  const quotes = useMemo(() => parseHistory(raw), [raw]);

  const removeQuote = useCallback((id: string) => {
    writeHistory(parseHistory(readRaw()).filter((q) => q.id !== id));
  }, []);

  return { quotes, removeQuote };
}

"use client";

import { useSyncExternalStore } from "react";

// Soft link between a customization request and a quote - client-only,
// same "no schema change" reasoning as quote-history.tsx. Not enforced:
// the customer opts in via a checkbox on the request form, and either
// side can exist without the other.
//
// Keyed by request id (not product id) so the customization detail page
// can look itself up reliably on every visit, in this browser.

export interface CustomizationLink {
  requestId: string;
  productId: string;
  reference: string;
  linkedAt: string; // ISO
}

const LINKS_KEY = "kakawa-customization-links";
const listeners = new Set<() => void>();

function readRaw(): string {
  try {
    return window.localStorage.getItem(LINKS_KEY) ?? "[]";
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

function parseAll(raw: string): CustomizationLink[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(links: CustomizationLink[]) {
  try {
    window.localStorage.setItem(LINKS_KEY, JSON.stringify(links));
  } catch {
    // Storage full/unavailable - link just won't persist, non-fatal.
  }
  listeners.forEach((l) => l());
}

/** Derives a human-facing reference like "CUSTOM-2026-A1B2C3D4" from a real request id - no counter/sequence needed, no schema change. */
export function referenceForRequest(requestId: string): string {
  const year = new Date().getFullYear();
  return `CUSTOM-${year}-${requestId.slice(0, 8).toUpperCase()}`;
}

/** Called once, client-side, right after a customization request is submitted with "Include in quote?" checked. */
export function recordCustomizationLink(requestId: string, productId: string): CustomizationLink {
  const links = parseAll(readRaw()).filter((l) => l.requestId !== requestId);
  const entry: CustomizationLink = {
    requestId,
    productId,
    reference: referenceForRequest(requestId),
    linkedAt: new Date().toISOString(),
  };
  writeAll([entry, ...links]);
  return entry;
}

/** Reactive read for the customization detail page - updates automatically once recordCustomizationLink() writes, no manual setState needed. */
export function useCustomizationLink(requestId: string): CustomizationLink | null {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerSnapshot);
  return parseAll(raw).find((l) => l.requestId === requestId) ?? null;
}

/**
 * Most recently linked customization for a given product, if any - used by
 * the quote page to annotate a line item. Plain (non-hook) read: QuoteBuilder
 * calls this once per line item inside a loop/useMemo, where hooks aren't
 * allowed - the quote page doesn't need live reactivity here since the link
 * is always written from a separate page/flow before the quote is viewed.
 */
export function getLinkForProduct(productId: string): CustomizationLink | null {
  const matches = parseAll(readRaw()).filter((l) => l.productId === productId);
  if (matches.length === 0) return null;
  return matches.reduce((latest, l) => (l.linkedAt > latest.linkedAt ? l : latest));
}

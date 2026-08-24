/**
 * Pricing engine — pure functions, no I/O, unit-testable.
 *
 * Stacking rule (locked with Nik 2026-08-24):
 *   finalUnitPrice = b2cPrice * (1 - tierDiscount) * (1 - volumeDiscount)
 * i.e. tier discount applied first, then the best-matching volume discount
 * applied on top of the already-discounted price (sequential, not additive
 * percentages).
 */

export interface VolumeDiscount {
  minQuantity: number;
  additionalDiscountPercent: number; // 0..1
}

export interface Tier {
  baseDiscountPercent: number; // 0..1
  volumeDiscounts: VolumeDiscount[];
}

export interface PriceBreakdown {
  b2cPrice: number;
  quantity: number;
  tierDiscountPercent: number;
  volumeDiscountPercent: number;
  unitPrice: number;
  totalPrice: number;
  savingsVsB2c: number;
}

/** Picks the richest volume discount whose min_quantity <= quantity. */
export function bestVolumeDiscount(
  volumeDiscounts: VolumeDiscount[],
  quantity: number
): VolumeDiscount | null {
  const eligible = volumeDiscounts.filter((v) => quantity >= v.minQuantity);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, v) =>
    v.additionalDiscountPercent > best.additionalDiscountPercent ? v : best
  );
}

export function calcPrice(
  b2cPrice: number,
  tier: Tier | null,
  quantity: number
): PriceBreakdown {
  const safeQty = Math.max(0, Math.floor(quantity || 0));
  const tierDiscountPercent = tier?.baseDiscountPercent ?? 0;
  const volumeMatch = tier
    ? bestVolumeDiscount(tier.volumeDiscounts, safeQty)
    : null;
  const volumeDiscountPercent = volumeMatch?.additionalDiscountPercent ?? 0;

  const unitPrice =
    b2cPrice * (1 - tierDiscountPercent) * (1 - volumeDiscountPercent);
  const totalPrice = unitPrice * safeQty;
  const savingsVsB2c = (b2cPrice - unitPrice) * safeQty;

  return {
    b2cPrice,
    quantity: safeQty,
    tierDiscountPercent,
    volumeDiscountPercent,
    unitPrice: round2(unitPrice),
    totalPrice: round2(totalPrice),
    savingsVsB2c: round2(savingsVsB2c),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

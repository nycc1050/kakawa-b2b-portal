import { describe, it, expect } from "vitest";
import { calcPrice, bestVolumeDiscount } from "./pricing";

const tier = {
  baseDiscountPercent: 0.5, // pays 50% of B2C price
  volumeDiscounts: [
    { minQuantity: 100, additionalDiscountPercent: 0.05 },
    { minQuantity: 500, additionalDiscountPercent: 0.1 },
  ],
};

describe("calcPrice", () => {
  it("applies only the tier discount below any volume threshold", () => {
    const r = calcPrice(10, tier, 10);
    expect(r.unitPrice).toBe(5); // 10 * 0.5
    expect(r.volumeDiscountPercent).toBe(0);
    expect(r.totalPrice).toBe(50);
  });

  it("applies the single matching volume discount on top of the tier discount", () => {
    const r = calcPrice(10, tier, 100);
    // 10 * (1-0.5) * (1-0.05) = 4.75
    expect(r.unitPrice).toBe(4.75);
    expect(r.totalPrice).toBe(475);
  });

  it("picks the richest volume discount when multiple thresholds are crossed", () => {
    const r = calcPrice(10, tier, 500);
    // 10 * 0.5 * 0.9 = 4.5
    expect(r.unitPrice).toBe(4.5);
  });

  it("handles a boundary quantity exactly at a threshold", () => {
    const r = calcPrice(10, tier, 99);
    expect(r.volumeDiscountPercent).toBe(0);
    const r2 = calcPrice(10, tier, 100);
    expect(r2.volumeDiscountPercent).toBe(0.05);
  });

  it("returns full B2C price with no tier assigned", () => {
    const r = calcPrice(10, null, 50);
    expect(r.unitPrice).toBe(10);
    expect(r.tierDiscountPercent).toBe(0);
  });

  it("handles a tier with 0% base discount", () => {
    const r = calcPrice(10, { baseDiscountPercent: 0, volumeDiscounts: [] }, 10);
    expect(r.unitPrice).toBe(10);
  });

  it("floors negative or fractional quantities to a safe non-negative integer", () => {
    const r = calcPrice(10, tier, -5);
    expect(r.quantity).toBe(0);
    expect(r.totalPrice).toBe(0);
  });
});

describe("bestVolumeDiscount", () => {
  it("returns null when quantity is below every threshold", () => {
    expect(bestVolumeDiscount(tier.volumeDiscounts, 10)).toBeNull();
  });

  it("returns the richest eligible discount, not just the first match", () => {
    const match = bestVolumeDiscount(tier.volumeDiscounts, 500);
    expect(match?.minQuantity).toBe(500);
  });
});

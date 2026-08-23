import { Product } from "../models/product";
import { Vendor } from "../models/vendor";
import { VelocityResult } from "./salesVelocity";

export interface ReorderResult {
  reorderNeeded: boolean;
  daysUntilEmpty: number;
  recommendedQty: number;
}

export function checkReorder(
  product: Product,
  vendor: Vendor,
  velocity: VelocityResult,
  safetyBufferDays: number = 2
): ReorderResult {
  const avgDailySales = velocity.avgDailySales;

  // avoid divide-by-zero if nothing selling
  const daysUntilEmpty = avgDailySales > 0
    ? product.currentStock / avgDailySales
    : Infinity;

  const reorderThreshold = vendor.leadTimeDays + safetyBufferDays;
  const reorderNeeded = daysUntilEmpty <= reorderThreshold;

  // recommended qty covers lead time + buffer, minus what's already in stock
  const targetStock = avgDailySales * (vendor.leadTimeDays + safetyBufferDays) * 1.2;
  const recommendedQty = reorderNeeded
    ? Math.max(0, Math.ceil(targetStock - product.currentStock))
    : 0;

  return { reorderNeeded, daysUntilEmpty, recommendedQty };
}
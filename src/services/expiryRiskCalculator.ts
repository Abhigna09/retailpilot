import { Product } from "../models/product";
import { ExpiryBatch } from "../models/expiryBatch";
import { VelocityResult } from "./salesVelocity";

export interface ExpiryRiskResult {
  batchId: string;
  unitsExpiring: number;
  daysUntilExpiry: number;
  predictedUnitsSold: number;
  unitsAtRisk: number;
  rupeeAtRisk: number;
}

export function checkExpiryRisk(
  product: Product,
  batch: ExpiryBatch,
  velocity: VelocityResult
): ExpiryRiskResult {
  const expiryDate = new Date(batch.expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.max(
    0,
    Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  const predictedUnitsSold = velocity.avgDailySales * daysUntilExpiry;
  const unitsAtRisk = Math.max(0, batch.quantity - predictedUnitsSold);
  const rupeeAtRisk = unitsAtRisk * product.costPrice;

  return {
    batchId: batch.batchId,
    unitsExpiring: batch.quantity,
    daysUntilExpiry,
    predictedUnitsSold,
    unitsAtRisk,
    rupeeAtRisk,
  };
}
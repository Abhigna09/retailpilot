import { Sale } from "../models/sale";

export interface VelocityResult {
  avgDailySales: number;
  trend: "increasing" | "decreasing" | "stable";
}

export function calculateVelocity(sales: Sale[], windowDays: number = 14): VelocityResult {
  const sorted = [...sales].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-windowDays);

  const totalUnits = recent.reduce((sum, s) => sum + s.unitsSold, 0);
  const avgDailySales = recent.length > 0 ? totalUnits / recent.length : 0;

  const half = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, half);
  const secondHalf = recent.slice(half);

  const avgFirst = firstHalf.length > 0
    ? firstHalf.reduce((s, x) => s + x.unitsSold, 0) / firstHalf.length
    : 0;
  const avgSecond = secondHalf.length > 0
    ? secondHalf.reduce((s, x) => s + x.unitsSold, 0) / secondHalf.length
    : 0;

  let trend: "increasing" | "decreasing" | "stable" = "stable";
  if (avgSecond > avgFirst * 1.1) trend = "increasing";
  else if (avgSecond < avgFirst * 0.9) trend = "decreasing";

  return { avgDailySales, trend };
}
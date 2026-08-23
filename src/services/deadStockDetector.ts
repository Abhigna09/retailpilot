import { Product } from "../models/product";
import { Sale } from "../models/sale";

export interface DeadStockResult {
  isDeadStock: boolean;
  daysSinceLastSale: number;
  moneyTiedUp: number;
}

export function checkDeadStock(
  product: Product,
  sales: Sale[],
  inactivityThresholdDays: number = 30
): DeadStockResult {
  const productSales = sales.filter(s => s.productId === product.productId);

  if (productSales.length === 0) {
    return {
      isDeadStock: true,
      daysSinceLastSale: Infinity,
      moneyTiedUp: product.currentStock * product.costPrice,
    };
  }

  const sorted = [...productSales].sort((a, b) => a.date.localeCompare(b.date));
  const lastSaleDate = new Date(sorted[sorted.length - 1]!.date);
  const today = new Date();
  const daysSinceLastSale = Math.floor(
    (today.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isDeadStock = daysSinceLastSale >= inactivityThresholdDays;
  const moneyTiedUp = isDeadStock ? product.currentStock * product.costPrice : 0;

  return { isDeadStock, daysSinceLastSale, moneyTiedUp };
}
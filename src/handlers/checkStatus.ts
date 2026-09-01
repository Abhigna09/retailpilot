import "dotenv/config";
import { getItem } from "../services/dbClient";
import { Product } from "../models/product";
import { Vendor } from "../models/vendor";
import { calculateVelocity } from "../services/salesVelocity";
import { checkReorder } from "../services/reorderDetector";
import { checkDeadStock } from "../services/deadStockDetector";
import { jsonResponse } from "../shared/response";

export async function handler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    const productId = event.queryStringParameters?.productId;

    if (!userId || !productId) {
      return jsonResponse(400, { error: "userId and productId are required" });
    }

    const product = await getItem(`USER#${userId}`, `PRODUCT#${productId}`) as Product | undefined;
    if (!product) {
      return jsonResponse(404, { error: "Product not found" });
    }

    const { listSales } = await import("../services/salesService");
    const sales = await listSales(userId, productId);
    const velocity = calculateVelocity(sales);

    const vendor = await getItem(`USER#${userId}`, `VENDOR#${product.vendorId}`) as Vendor | undefined;
    const reorder = vendor ? checkReorder(product, vendor, velocity) : { reorderNeeded: false, daysUntilEmpty: 0, recommendedQty: 0 };
    const deadStock = checkDeadStock(product, sales);

    return jsonResponse(200, {
      productId,
      name: product.name,
      currentStock: product.currentStock,
      reorderNeeded: reorder.reorderNeeded,
      recommendedQty: reorder.recommendedQty,
      isDeadStock: deadStock.isDeadStock,
      daysSinceLastSale: deadStock.daysSinceLastSale === Infinity ? null : deadStock.daysSinceLastSale,
    });
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}
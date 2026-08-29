import "dotenv/config";
import { getItem } from "../services/dbClient";
import { Product } from "../models/product";
import { Vendor } from "../models/vendor";
import { Sale } from "../models/sale";
import { ExpiryBatch } from "../models/expiryBatch";
import { analyzeProduct } from "./analyzeProduct";
import { decideApprovalRoute } from "../services/approvalService";
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

    const vendor = await getItem(`USER#${userId}`, `VENDOR#${product.vendorId}`) as Vendor | undefined;
    if (!vendor) {
      return jsonResponse(404, { error: "Vendor not found" });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const sales: Sale[] = body.sales || [];
    const expiryBatches: ExpiryBatch[] = body.expiryBatches || [];

    const analysis = await analyzeProduct({ product, vendor, sales, expiryBatches });

    let approval = null;
    if (analysis.reorder.result.reorderNeeded) {
      approval = decideApprovalRoute(product, analysis.reorder.result);
    }

    return jsonResponse(200, { product, vendor, analysis, approval });
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}
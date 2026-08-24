import "dotenv/config";
import { getItem, queryByPrefix } from "../services/dbClient";
import { Product } from "../models/product";
import { Vendor } from "../models/vendor";
import { Sale } from "../models/sale";
import { ExpiryBatch } from "../models/expiryBatch";
import { analyzeProduct } from "./analyzeProduct";
import { decideApprovalRoute } from "../services/approvalService";

export async function handler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    const productId = event.queryStringParameters?.productId;

    if (!userId || !productId) {
      return { statusCode: 400, body: JSON.stringify({ error: "userId and productId are required" }) };
    }

    const product = await getItem(`USER#${userId}`, `PRODUCT#${productId}`) as Product | undefined;
    if (!product) {
      return { statusCode: 404, body: JSON.stringify({ error: "Product not found" }) };
    }

    const vendor = await getItem(`USER#${userId}`, `VENDOR#${product.vendorId}`) as Vendor | undefined;
    if (!vendor) {
      return { statusCode: 404, body: JSON.stringify({ error: "Vendor not found" }) };
    }

    // sales and expiry batches still come from request body for now
    // (real sales-tracking module is future work, not in this build's scope)
    const body = event.body ? JSON.parse(event.body) : {};
    const sales: Sale[] = body.sales || [];
    const expiryBatches: ExpiryBatch[] = body.expiryBatches || [];

    const analysis = await analyzeProduct({ product, vendor, sales, expiryBatches });

    let approval = null;
    if (analysis.reorder.result.reorderNeeded) {
      approval = decideApprovalRoute(product, analysis.reorder.result);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ product, vendor, analysis, approval }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    };
  }
}
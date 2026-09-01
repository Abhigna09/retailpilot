import "dotenv/config";
import { recordSale, listSales } from "../services/salesService";
import { addExpiryBatch, listExpiryBatches } from "../services/expiryService";
import { jsonResponse } from "../shared/response";

export async function recordSaleHandler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const sale = await recordSale(body);
    return jsonResponse(200, sale);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}

export async function listSalesHandler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    const productId = event.queryStringParameters?.productId;
    if (!userId || !productId) {
      return jsonResponse(400, { error: "userId and productId are required" });
    }
    const sales = await listSales(userId, productId);
    return jsonResponse(200, sales);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}

export async function addExpiryHandler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const batch = await addExpiryBatch(body);
    return jsonResponse(200, batch);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}

export async function listExpiryHandler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    const productId = event.queryStringParameters?.productId;
    if (!userId || !productId) {
      return jsonResponse(400, { error: "userId and productId are required" });
    }
    const batches = await listExpiryBatches(userId, productId);
    return jsonResponse(200, batches);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}
export async function listAllSalesHandler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return jsonResponse(400, { error: "userId is required" });
    }
    const { listAllSales } = await import("../services/salesService");
    const sales = await listAllSales(userId);
    return jsonResponse(200, sales);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}

export async function listAllExpiryHandler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return jsonResponse(400, { error: "userId is required" });
    }
    const { listAllExpiryBatches } = await import("../services/expiryService");
    const batches = await listAllExpiryBatches(userId);
    return jsonResponse(200, batches);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}
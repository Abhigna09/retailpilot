import "dotenv/config";
import { previewSafetyChecks } from "../services/paymentService";
import { jsonResponse } from "../shared/response";

export async function handler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const { product, vendor, request, recentOrders, poAmount, maxAutoSpend } = body;

    const checks = previewSafetyChecks(product, vendor, request, recentOrders, poAmount, maxAutoSpend);

    return jsonResponse(200, { checks, allPassed: checks.every(c => c.passed) });
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}
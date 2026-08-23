import "dotenv/config";
import { Product } from "../models/product";
import { Vendor } from "../models/vendor";
import { ReorderRequest } from "../services/safetyChecks";
import { executeVendorPayment } from "../services/paymentService";

export interface ExecutePaymentInput {
  product: Product;
  vendor: Vendor;
  request: ReorderRequest;
  recentOrders: ReorderRequest[];
  poAmount: number;
}

// AWS Lambda entry point — API Gateway calls this when owner approves (or auto-trigger fires)
export async function handler(event: any) {
  try {
    const body: ExecutePaymentInput = JSON.parse(event.body);
    const { product, vendor, request, recentOrders, poAmount } = body;

    const auditEntry = await executeVendorPayment(
      product,
      vendor,
      request,
      recentOrders,
      poAmount
    );

    return {
      statusCode: auditEntry.success ? 200 : 403,
      body: JSON.stringify(auditEntry),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
    };
  }
}
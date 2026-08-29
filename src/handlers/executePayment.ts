import "dotenv/config";
import { Product } from "../models/product";
import { Vendor } from "../models/vendor";
import { ReorderRequest } from "../services/safetyChecks";
import { executeVendorPayment } from "../services/paymentService";
import { jsonResponse } from "../shared/response";

export interface ExecutePaymentInput {
  product: Product;
  vendor: Vendor;
  request: ReorderRequest;
  recentOrders: ReorderRequest[];
  poAmount: number;
}

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

    let notification = null;
    if (auditEntry.success) {
      const { notifyVendor } = await import("../services/notificationService");
      notification = notifyVendor(vendor, product, request.quantity, poAmount);
    }

    return jsonResponse(auditEntry.success ? 200 : 403, { ...auditEntry, notification });
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}
import Razorpay from "razorpay";
import { Product } from "../models/product";
import { Vendor } from "../models/vendor";
import { ReorderRequest, runAllSafetyChecks, SafetyCheckResult } from "./safetyChecks";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface AuditLogEntry {
  timestamp: string;
  productId: string;
  vendorId: string;
  action: string;
  amount: number;
  safetyChecks: SafetyCheckResult[];
  success: boolean;
  reason: string;
  razorpayOrderId?: string;
}

export async function executeVendorPayment(
  product: Product,
  vendor: Vendor,
  request: ReorderRequest,
  recentOrders: ReorderRequest[],
  poAmount: number
): Promise<AuditLogEntry> {
  const checks = runAllSafetyChecks(product, vendor, request, recentOrders, poAmount);
  const allPassed = checks.every(c => c.passed);

  const baseLog: Omit<AuditLogEntry, "success" | "reason" | "razorpayOrderId"> = {
    timestamp: new Date().toISOString(),
    productId: product.productId,
    vendorId: vendor.vendorId,
    action: "vendor_payment",
    amount: poAmount,
    safetyChecks: checks,
  };

  // if any safety check fails, block payment entirely — no exceptions
  if (!allPassed) {
    const failedReasons = checks.filter(c => !c.passed).map(c => c.reason).join(" | ");
    return {
      ...baseLog,
      success: false,
      reason: `Payment blocked by safety checks: ${failedReasons}`,
    };
  }

  // all checks passed — proceed with real Razorpay call
  try {
    const order = await razorpay.orders.create({
      amount: poAmount * 100, // Razorpay expects paise, not rupees
      currency: "INR",
      notes: {
        productId: product.productId,
        vendorId: vendor.vendorId,
        quantity: request.quantity.toString(),
      },
    });

    return {
      ...baseLog,
      success: true,
      reason: "Payment order created successfully after all safety checks passed.",
      razorpayOrderId: order.id,
    };
  } catch (err) {
    return {
      ...baseLog,
      success: false,
      reason: `Razorpay error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
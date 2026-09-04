import Razorpay from "razorpay";
import { Product } from "../models/product";
import { Vendor } from "../models/vendor";
import {
  ReorderRequest,
  runAllSafetyChecks,
  SafetyCheckResult,
} from "./safetyChecks";

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
  razorpayKeyId?: string;
}

export async function executeVendorPayment(
  product: Product,
  vendor: Vendor,
  request: ReorderRequest,
  recentOrders: ReorderRequest[],
  poAmount: number
): Promise<AuditLogEntry> {
  const checks = runAllSafetyChecks(
    product,
    vendor,
    request,
    recentOrders,
    poAmount
  );

  const allPassed = checks.every((c) => c.passed);

  const baseLog: Omit<
    AuditLogEntry,
    "success" | "reason" | "razorpayOrderId"
  > = {
    timestamp: new Date().toISOString(),
    productId: product.productId,
    vendorId: vendor.vendorId,
    action: "vendor_payment",
    amount: poAmount,
    safetyChecks: checks,
  };

  if (!allPassed) {
    const failedReasons = checks
      .filter((c) => !c.passed)
      .map((c) => c.reason)
      .join(" | ");

    return {
      ...baseLog,
      success: false,
      reason: `Payment blocked by safety checks: ${failedReasons}`,
    };
  }

  try {
    const order = await razorpay.orders.create({
      amount: poAmount * 100,
      currency: "INR",
      notes: {
        productId: product.productId,
        vendorId: vendor.vendorId,
        quantity: request.quantity.toString(),
      },
    });

    // Current demo behavior:
    // increase stock when the procurement order is created.
    const { putItem } = await import("./dbClient");

    const newStock =
      product.currentStock + request.quantity;

    await putItem({
      PK: `USER#${product.userId}`,
      SK: `PRODUCT#${product.productId}`,
      ...product,
      currentStock: newStock,
    });

    return {
      ...baseLog,
      success: true,
      reason:
        "Payment order created successfully after all safety checks passed.",
      razorpayOrderId: order.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (err: any) {
    console.error("Razorpay error:", err);

    const razorpayError = err?.error;

    const reason =
      razorpayError?.description ||
      razorpayError?.reason ||
      err?.message ||
      "Unknown Razorpay error";

    return {
      ...baseLog,
      success: false,
      reason: `Razorpay error: ${reason}`,
    };
  }
}

export function previewSafetyChecks(
  product: Product,
  vendor: Vendor,
  request: ReorderRequest,
  recentOrders: ReorderRequest[],
  poAmount: number,
  maxAutoSpend: number = 10000
): SafetyCheckResult[] {
  return runAllSafetyChecks(
    product,
    vendor,
    request,
    recentOrders,
    poAmount,
    maxAutoSpend
  );
}
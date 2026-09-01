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
  actionId?: string;
  actionCreatedAt?: string;
}

export async function handler(event: any) {
  try {
    const body: ExecutePaymentInput = JSON.parse(event.body);
    const { product, vendor, request, recentOrders, poAmount, actionId, actionCreatedAt } = body;

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

    // Update the persisted AgentAction with real safety-check and execution events,
    // if this payment was triggered from one (per the agent lifecycle).
    if (actionId && actionCreatedAt) {
      const { appendEvent } = await import("../services/agentActionService");

      const checkSummary = auditEntry.safetyChecks
        .map(c => `${c.passed ? "✓" : "✗"} ${c.reason}`)
        .join(" | ");

      await appendEvent(
        product.userId,
        actionId,
        actionCreatedAt,
        { type: "safety_checked", detail: checkSummary },
        { safetyCheckResults: auditEntry.safetyChecks }
      );

      if (auditEntry.success) {
        await appendEvent(
          product.userId,
          actionId,
          actionCreatedAt,
          { type: "executed", detail: `Payment sent — Razorpay order ${auditEntry.razorpayOrderId}` },
          { status: "completed", razorpayOrderId: auditEntry.razorpayOrderId }
        );
      } else {
        await appendEvent(
          product.userId,
          actionId,
          actionCreatedAt,
          { type: "blocked", detail: auditEntry.reason },
          { status: "blocked", decisionOutcome: "blocked" }
        );
      }
    }

    return jsonResponse(auditEntry.success ? 200 : 403, { ...auditEntry, notification });
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}
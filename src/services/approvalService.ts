import { Product } from "../models/product";
import { ReorderResult } from "./reorderDetector";

export interface ApprovalDecision {
  autoApproved: boolean;
  reason: string;
  orderAmount: number;
}

export function decideApprovalRoute(
  product: Product,
  reorder: ReorderResult
): ApprovalDecision {
  const orderAmount = reorder.recommendedQty * product.costPrice;

  if (!product.autopayEnabled) {
    return {
      autoApproved: false,
      reason: "Autopay is off for this product. Manual approval required.",
      orderAmount,
    };
  }

  if (orderAmount > product.autopayThreshold) {
    return {
      autoApproved: false,
      reason: `Order amount ₹${orderAmount} exceeds autopay threshold of ₹${product.autopayThreshold}. Manual approval required.`,
      orderAmount,
    };
  }

  return {
    autoApproved: true,
    reason: `Autopay enabled and order is within ₹${product.autopayThreshold} threshold. Proceeding automatically.`,
    orderAmount,
  };
}
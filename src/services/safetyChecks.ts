import { Product } from "../models/product";
import { Vendor } from "../models/vendor";

export interface ReorderRequest {
  productId: string;
  vendorId: string;
  quantity: number;
  unitCost: number;
  requestedAt: string; // ISO timestamp
}

export interface SafetyCheckResult {
  passed: boolean;
  reason: string;
}

// Rule 1: never spend above a fixed limit without human approval
export function checkSpendLimit(
  request: ReorderRequest,
  maxAutoSpend: number = 10000
): SafetyCheckResult {
  const totalCost = request.quantity * request.unitCost;

  if (totalCost > maxAutoSpend) {
    return {
      passed: false,
      reason: `Order total ₹${totalCost} exceeds auto-spend limit of ₹${maxAutoSpend}. Needs human approval.`,
    };
  }

  return { passed: true, reason: "Within auto-spend limit." };
}

// Rule 2: vendor on the order must match the product's known vendor
export function checkVendorMatch(
  product: Product,
  vendor: Vendor,
  request: ReorderRequest
): SafetyCheckResult {
  if (request.vendorId !== product.vendorId) {
    return {
      passed: false,
      reason: `Vendor mismatch: product ${product.name} is registered to a different vendor.`,
    };
  }

  if (vendor.vendorId !== request.vendorId) {
    return {
      passed: false,
      reason: `Vendor ID does not match vendor record.`,
    };
  }

  return { passed: true, reason: "Vendor verified." };
}

// Rule 3: block reordering the same product twice within a short window
export function checkDuplicateOrder(
  request: ReorderRequest,
  recentOrders: ReorderRequest[],
  windowHours: number = 24
): SafetyCheckResult {
  const requestTime = new Date(request.requestedAt).getTime();

  const duplicate = recentOrders.find(o => {
    if (o.productId !== request.productId) return false;
    const orderTime = new Date(o.requestedAt).getTime();
    const hoursSince = (requestTime - orderTime) / (1000 * 60 * 60);
    return hoursSince >= 0 && hoursSince < windowHours;
  });

  if (duplicate) {
    return {
      passed: false,
      reason: `Duplicate order blocked: this product was already reordered within the last ${windowHours} hours.`,
    };
  }

  return { passed: true, reason: "No duplicate order detected." };
}

// Rule 4: the amount we're about to pay must exactly match the purchase order amount
export function checkAmountMatch(
  request: ReorderRequest,
  poAmount: number
): SafetyCheckResult {
  const expectedAmount = request.quantity * request.unitCost;

  if (expectedAmount !== poAmount) {
    return {
      passed: false,
      reason: `Amount mismatch: PO says ₹${poAmount}, calculated order total is ₹${expectedAmount}.`,
    };
  }

  return { passed: true, reason: "Amount matches purchase order." };
}

// Run all checks together — payment only proceeds if every single one passes
export function runAllSafetyChecks(
  product: Product,
  vendor: Vendor,
  request: ReorderRequest,
  recentOrders: ReorderRequest[],
  poAmount: number,
  maxAutoSpend: number = 10000
): SafetyCheckResult[] {
  return [
    checkSpendLimit(request, maxAutoSpend),
    checkVendorMatch(product, vendor, request),
    checkDuplicateOrder(request, recentOrders),
    checkAmountMatch(request, poAmount),
  ];
}
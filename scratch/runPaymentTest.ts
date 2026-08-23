import "dotenv/config";
import { executeVendorPayment } from "../src/services/paymentService";
import { products, vendors } from "../data/seedData";
import { ReorderRequest } from "../src/services/safetyChecks";

async function main() {
  const product = products[0]!; // Orange Juice 1L
  const vendor = vendors[0]!;   // FreshJuice Distributors

  const request: ReorderRequest = {
    productId: product.productId,
    vendorId: vendor.vendorId,
    quantity: 30,
    unitCost: product.costPrice,
    requestedAt: new Date().toISOString(),
  };

  const poAmount = request.quantity * request.unitCost; // should match exactly

  console.log("\n===== TEST 1: Valid payment (should succeed) =====");
  const result1 = await executeVendorPayment(product, vendor, request, [], poAmount);
  console.log(JSON.stringify(result1, null, 2));

  console.log("\n===== TEST 2: Duplicate order (should be blocked) =====");
  const result2 = await executeVendorPayment(product, vendor, request, [request], poAmount);
  console.log(JSON.stringify(result2, null, 2));

  console.log("\n===== TEST 3: Spend limit exceeded (should be blocked) =====");
  const bigRequest: ReorderRequest = { ...request, quantity: 5000 };
  const bigPoAmount = bigRequest.quantity * bigRequest.unitCost;
  const result3 = await executeVendorPayment(product, vendor, bigRequest, [], bigPoAmount);
  console.log(JSON.stringify(result3, null, 2));

  console.log("\n===== TEST 4: Amount mismatch (should be blocked) =====");
  const result4 = await executeVendorPayment(product, vendor, request, [], poAmount + 500);
  console.log(JSON.stringify(result4, null, 2));
}

main().catch(err => console.error("TEST FAILED:", err));
import "dotenv/config";
import { analyzeProduct } from "../src/handlers/analyzeProduct";
import { products, vendors, sales, expiryBatches } from "../data/seedData";

async function main() {
  for (const product of products) {
    const vendor = vendors.find(v => v.vendorId === product.vendorId)!;

    console.log(`\n===== ${product.name} =====`);

    const result = await analyzeProduct({
      product,
      vendor,
      sales,
      expiryBatches,
    });

    console.log("Velocity:", result.velocity);
    console.log("\nReorder check:", result.reorder.result);
    console.log("Reorder explanation:\n", result.reorder.explanation);

    console.log("\nDead stock check:", result.deadStock.result);
    console.log("Dead stock explanation:\n", result.deadStock.explanation);

    for (const risk of result.expiryRisks) {
      console.log("\nExpiry risk check:", risk.result);
      console.log("Expiry explanation:\n", risk.explanation);
    }
  }
}

main().catch(err => console.error("TEST FAILED:", err));
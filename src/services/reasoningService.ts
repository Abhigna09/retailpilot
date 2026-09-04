import { GoogleGenAI } from "@google/genai";
import { Product } from "../models/product";
import { ReorderResult } from "./reorderDetector";
import { DeadStockResult } from "./deadStockDetector";
import { ExpiryRiskResult } from "./expiryRiskCalculator";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// --------------------------------------------------
// REORDER
// --------------------------------------------------

export async function explainReorder(
  product: Product,
  reorder: ReorderResult
): Promise<string> {
  if (!reorder.reorderNeeded) {
    return `${product.name} has enough stock for now. No action needed.`;
  }

  const fallback =
    `${product.name} is likely to run out in about ` +
    `${reorder.daysUntilEmpty.toFixed(1)} days based on recent sales. ` +
    `Reordering now can help avoid a stockout. ` +
    `Recommended: reorder ${reorder.recommendedQty} units now.`;

  const prompt = `You are a retail inventory assistant. Explain this situation to a store owner in 2-3 short, plain sentences, then give a clear recommendation.

Product: ${product.name}
Current stock: ${product.currentStock} units
Days until stock runs out: ${reorder.daysUntilEmpty.toFixed(1)}
Recommended reorder quantity: ${reorder.recommendedQty} units

Keep it simple, no jargon, end with a clear "Recommended: reorder X units now" line.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return response.text ?? fallback;
  } catch (err) {
    console.warn(
      "Gemini reorder explanation unavailable. Using fallback.",
      err
    );

    return fallback;
  }
}

// --------------------------------------------------
// DEAD STOCK
// --------------------------------------------------

export async function explainDeadStock(
  product: Product,
  deadStock: DeadStockResult
): Promise<string> {
  if (!deadStock.isDeadStock) {
    return `${product.name} is selling normally. No action needed.`;
  }

  const fallback =
    `${product.name} has not sold for ${deadStock.daysSinceLastSale} days, ` +
    `with ₹${deadStock.moneyTiedUp.toFixed(0)} currently tied up in stock. ` +
    `Consider reducing the price or bundling the product to improve sales.`;

  const prompt = `You are a retail inventory assistant. Explain this situation to a store owner in 2-3 short, plain sentences, then give a clear recommendation (discount %, bundle idea, or stop reordering).

Product: ${product.name}
Days since last sale: ${deadStock.daysSinceLastSale}
Current stock: ${product.currentStock} units
Money tied up: ₹${deadStock.moneyTiedUp.toFixed(0)}

Keep it simple, no jargon, end with one clear recommendation line.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return response.text ?? fallback;
  } catch (err) {
    console.warn(
      "Gemini dead-stock explanation unavailable. Using fallback.",
      err
    );

    return fallback;
  }
}

// --------------------------------------------------
// EXPIRY RISK
// --------------------------------------------------

export async function explainExpiryRisk(
  product: Product,
  expiryRisk: ExpiryRiskResult
): Promise<string> {
  if (expiryRisk.unitsAtRisk <= 0) {
    return `${product.name} batch is on track to sell before expiry. No action needed.`;
  }

  const fallback =
    `${expiryRisk.unitsAtRisk.toFixed(0)} units of ${product.name} ` +
    `may not sell before expiry, putting approximately ` +
    `₹${expiryRisk.rupeeAtRisk.toFixed(0)} at risk. ` +
    `Consider a discount or promotion to move the stock before expiry.`;

  const prompt = `You are a retail inventory assistant. Explain this situation to a store owner in 2-3 short, plain sentences, then give a clear recommendation.

Product: ${product.name}
Units expiring in ${expiryRisk.daysUntilExpiry} days: ${expiryRisk.unitsExpiring}
Predicted units sold before expiry: ${expiryRisk.predictedUnitsSold.toFixed(0)}
Units at risk of becoming a loss: ${expiryRisk.unitsAtRisk.toFixed(0)}
Money at risk: ₹${expiryRisk.rupeeAtRisk.toFixed(0)}

Keep it simple, no jargon, end with a clear discount % recommendation line.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return response.text ?? fallback;
  } catch (err) {
    console.warn(
      "Gemini expiry explanation unavailable. Using fallback.",
      err
    );

    return fallback;
  }
}
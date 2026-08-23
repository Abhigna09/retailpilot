import { GoogleGenAI } from "@google/genai";
import { Product } from "../models/product";
import { ReorderResult } from "./reorderDetector";
import { DeadStockResult } from "./deadStockDetector";
import { ExpiryRiskResult } from "./expiryRiskCalculator";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Reorder situation → plain-language explanation + recommendation
export async function explainReorder(
  product: Product,
  reorder: ReorderResult
): Promise<string> {
  if (!reorder.reorderNeeded) {
    return `${product.name} has enough stock for now. No action needed.`;
  }

  const prompt = `You are a retail inventory assistant. Explain this situation to a store owner in 2-3 short, plain sentences, then give a clear recommendation.

Product: ${product.name}
Current stock: ${product.currentStock} units
Days until stock runs out: ${reorder.daysUntilEmpty.toFixed(1)}
Recommended reorder quantity: ${reorder.recommendedQty} units

Keep it simple, no jargon, end with a clear "Recommended: reorder X units now" line.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

  return response.text ?? "Could not generate explanation.";
}

// Dead stock situation → plain-language explanation + recommendation
export async function explainDeadStock(
  product: Product,
  deadStock: DeadStockResult
): Promise<string> {
  if (!deadStock.isDeadStock) {
    return `${product.name} is selling normally. No action needed.`;
  }

  const prompt = `You are a retail inventory assistant. Explain this situation to a store owner in 2-3 short, plain sentences, then give a clear recommendation (discount %, bundle idea, or stop reordering).

Product: ${product.name}
Days since last sale: ${deadStock.daysSinceLastSale}
Current stock: ${product.currentStock} units
Money tied up: ₹${deadStock.moneyTiedUp.toFixed(0)}

Keep it simple, no jargon, end with one clear recommendation line.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

  return response.text ?? "Could not generate explanation.";
}

// Expiry risk situation → plain-language explanation + recommendation
export async function explainExpiryRisk(
  product: Product,
  expiryRisk: ExpiryRiskResult
): Promise<string> {
  if (expiryRisk.unitsAtRisk <= 0) {
    return `${product.name} batch is on track to sell before expiry. No action needed.`;
  }

  const prompt = `You are a retail inventory assistant. Explain this situation to a store owner in 2-3 short, plain sentences, then give a clear recommendation.

Product: ${product.name}
Units expiring in ${expiryRisk.daysUntilExpiry} days: ${expiryRisk.unitsExpiring}
Predicted units sold before expiry: ${expiryRisk.predictedUnitsSold.toFixed(0)}
Units at risk of becoming a loss: ${expiryRisk.unitsAtRisk.toFixed(0)}
Money at risk: ₹${expiryRisk.rupeeAtRisk.toFixed(0)}

Keep it simple, no jargon, end with a clear discount % recommendation line.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

  return response.text ?? "Could not generate explanation.";
}
import "dotenv/config";
import { jsonResponse } from "../shared/response";
import { Product } from "../models/product";
import { Vendor } from "../models/vendor";
import { Sale } from "../models/sale";
import { ExpiryBatch } from "../models/expiryBatch";
import { calculateVelocity } from "../services/salesVelocity";
import { checkReorder } from "../services/reorderDetector";
import { checkDeadStock } from "../services/deadStockDetector";
import { checkExpiryRisk } from "../services/expiryRiskCalculator";
import {
  explainReorder,
  explainDeadStock,
  explainExpiryRisk,
} from "../services/reasoningService";

export interface AnalyzeInput {
  product: Product;
  vendor: Vendor;
  sales: Sale[];
  expiryBatches: ExpiryBatch[];
}

export interface AnalyzeOutput {
  productId: string;
  productName: string;
  velocity: ReturnType<typeof calculateVelocity>;
  reorder: {
    result: ReturnType<typeof checkReorder>;
    explanation: string;
  };
  deadStock: {
    result: ReturnType<typeof checkDeadStock>;
    explanation: string;
  };
  expiryRisks: {
    result: ReturnType<typeof checkExpiryRisk>;
    explanation: string;
  }[];
}

export async function analyzeProduct(
  input: AnalyzeInput
): Promise<AnalyzeOutput> {
  const { product, vendor, sales, expiryBatches } = input;

  // Fast local calculations
  const productSales = sales.filter(
    (s) => s.productId === product.productId
  );

  const velocity = calculateVelocity(productSales);

  const reorderResult = checkReorder(
    product,
    vendor,
    velocity
  );

  const deadStockResult = checkDeadStock(
    product,
    sales
  );

  const productBatches = expiryBatches.filter(
    (b) => b.productId === product.productId
  );

  // Run independent AI explanations in parallel
  const [
    reorderExplanation,
    deadStockExplanation,
    expiryRisks,
  ] = await Promise.all([
    explainReorder(
      product,
      reorderResult
    ),

    explainDeadStock(
      product,
      deadStockResult
    ),

    Promise.all(
      productBatches.map(async (batch) => {
        const result = checkExpiryRisk(
          product,
          batch,
          velocity
        );

        const explanation =
          await explainExpiryRisk(
            product,
            result
          );

        return {
          result,
          explanation,
        };
      })
    ),
  ]);

  return {
    productId: product.productId,
    productName: product.name,
    velocity,

    reorder: {
      result: reorderResult,
      explanation: reorderExplanation,
    },

    deadStock: {
      result: deadStockResult,
      explanation: deadStockExplanation,
    },

    expiryRisks,
  };
}

export async function handler(event: any) {
  try {
    const body: AnalyzeInput = JSON.parse(
      event.body
    );

    const output = await analyzeProduct(body);

    return jsonResponse(200, output);
  } catch (err) {
    return jsonResponse(500, {
      error:
        err instanceof Error
          ? err.message
          : String(err),
    });
  }
}
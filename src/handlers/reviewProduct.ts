import "dotenv/config";
import { getItem, queryByPrefix } from "../services/dbClient";
import { Product } from "../models/product";
import { Vendor } from "../models/vendor";
import { Sale } from "../models/sale";
import { ExpiryBatch } from "../models/expiryBatch";
import { ProductVariant } from "../models/variant";
import { analyzeProduct } from "./analyzeProduct";
import { decideApprovalRoute } from "../services/approvalService";
import { jsonResponse } from "../shared/response";

export async function handler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    const productId = event.queryStringParameters?.productId;

    if (!userId || !productId) {
      return jsonResponse(400, {
        error: "userId and productId are required",
      });
    }

    const product = (await getItem(
      `USER#${userId}`,
      `PRODUCT#${productId}`
    )) as Product | undefined;

    if (!product) {
      return jsonResponse(404, {
        error: "Product not found",
      });
    }

    const vendor = (await getItem(
      `USER#${userId}`,
      `VENDOR#${product.vendorId}`
    )) as Vendor | undefined;

    if (!vendor) {
      return jsonResponse(404, {
        error: "Vendor not found",
      });
    }

    // Load sales and expiry data
    const { listSales } = await import("../services/salesService");
    const { listExpiryBatches } = await import("../services/expiryService");

    const sales: Sale[] = await listSales(userId, productId);
    const expiryBatches: ExpiryBatch[] = await listExpiryBatches(
      userId,
      productId
    );

    // Analyze the product
    const analysis = await analyzeProduct({
      product,
      vendor,
      sales,
      expiryBatches,
    });

    let approval = null;
    let action = null;

    if (analysis.reorder.result.reorderNeeded) {
      // Get variants so procurement uses the actual variant cost price.
      const variantItems = await queryByPrefix(
        `USER#${userId}`,
        "VARIANT#"
      );

      const variants = (variantItems as ProductVariant[]).filter(
        (variant) => variant.productId === productId
      );

      if (variants.length === 0) {
        return jsonResponse(400, {
          error:
            "This product needs a reorder, but no variant with a cost price was found.",
        });
      }

      // For the current hackathon flow, use the first variant
      // as the procurement variant.
      const procurementVariant = variants[0];

      const procurementProduct: Product = {
        ...product,
        costPrice: Number(procurementVariant.costPrice),
      };

      approval = decideApprovalRoute(
        procurementProduct,
        analysis.reorder.result
      );

      const { createAction } = await import(
        "../services/agentActionService"
      );

      action = await createAction({
        userId,
        productId: product.productId,
        productName: product.name,
        vendorId: vendor.vendorId,
        type: "reorder",
        reasoning: analysis.reorder.explanation,
        recommendedQty: analysis.reorder.result.recommendedQty,
        orderAmount: approval.orderAmount,
        decisionOutcome: approval.autoApproved
          ? "autonomous"
          : "approval_required",
        status: "awaiting_approval",
      });

      // Return the procurement price to the frontend.
      // This keeps the payment flow consistent with approval.
      return jsonResponse(200, {
        product: procurementProduct,
        vendor,
        analysis,
        approval,
        action,
        procurementVariant,
      });
    }

    return jsonResponse(200, {
      product,
      vendor,
      analysis,
      approval,
      action,
    });
  } catch (err) {
    return jsonResponse(500, {
      error:
        err instanceof Error
          ? err.message
          : String(err),
    });
  }
}
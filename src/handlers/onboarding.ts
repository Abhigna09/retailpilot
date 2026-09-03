import "dotenv/config";
import { addProduct, addVendor, listProducts, listVendors } from "../services/onboardingService";
import { jsonResponse } from "../shared/response";

export async function addProductHandler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const product = await addProduct(body);
    return jsonResponse(200, product);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}

export async function addVendorHandler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const vendor = await addVendor(body);
    return jsonResponse(200, vendor);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}

export async function listProductsHandler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return jsonResponse(400, { error: "userId is required" });
    }
    const products = await listProducts(userId);
    return jsonResponse(200, products);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}

export async function listVendorsHandler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return jsonResponse(400, { error: "userId is required" });
    }
    const vendors = await listVendors(userId);
    return jsonResponse(200, vendors);
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}
export async function deleteProductHandler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    const productId = event.queryStringParameters?.productId;
    if (!userId || !productId) {
      return jsonResponse(400, { error: "userId and productId are required" });
    }
    const { deleteProduct } = await import("../services/onboardingService");
    await deleteProduct(userId, productId);
    return jsonResponse(200, { success: true });
  } catch (err) {
    return jsonResponse(500, { error: err instanceof Error ? err.message : String(err) });
  }
}
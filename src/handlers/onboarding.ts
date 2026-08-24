import "dotenv/config";
import { addProduct, addVendor, listProducts, listVendors } from "../services/onboardingService";

export async function addProductHandler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const product = await addProduct(body);
    return { statusCode: 200, body: JSON.stringify(product) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    };
  }
}

export async function addVendorHandler(event: any) {
  try {
    const body = JSON.parse(event.body);
    const vendor = await addVendor(body);
    return { statusCode: 200, body: JSON.stringify(vendor) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    };
  }
}

export async function listProductsHandler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: "userId is required" }) };
    }
    const products = await listProducts(userId);
    return { statusCode: 200, body: JSON.stringify(products) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    };
  }
}

export async function listVendorsHandler(event: any) {
  try {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: "userId is required" }) };
    }
    const vendors = await listVendors(userId);
    return { statusCode: 200, body: JSON.stringify(vendors) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    };
  }
}
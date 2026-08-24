import { Vendor } from "../models/vendor";
import { Product } from "../models/product";

export interface NotificationResult {
  sent: boolean;
  channel: string;
  message: string;
}

// Simulated — no real WhatsApp/email sent. In production this would call
// the WhatsApp Business API or an email service after separate approval/setup.
export function notifyVendor(
  vendor: Vendor,
  product: Product,
  quantity: number,
  amount: number
): NotificationResult {
  const message = `Order confirmed: ${quantity} units of ${product.name} for ₹${amount}. Payment processed.`;

  return {
    sent: true,
    channel: `simulated - WhatsApp to ${vendor.contactPhone}`,
    message,
  };
}
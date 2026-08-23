export interface Vendor {
  vendorId: string;
  name: string;
  leadTimeDays: number;     // days to deliver after order
  paymentMethod: string;    // e.g. "razorpay"
  contactEmail: string;
}
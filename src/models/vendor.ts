export interface Vendor {
  vendorId: string;
  userId: string;
  name: string;
  leadTimeDays: number;
  paymentMethod: string;
  contactEmail: string;
  contactPhone: string;       // for simulated WhatsApp notification
  bankAccountLast4: string;   // simulated - last 4 digits shown for display only
}
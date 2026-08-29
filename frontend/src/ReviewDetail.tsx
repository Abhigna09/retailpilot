import { useEffect, useState } from "react";
import { reviewProduct, executePayment } from "./api";

interface Props {
  userId: string;
  productId: string;
  onBack: () => void;
}

// Demo sales generator — real sales-tracking module is future scope (see HLD).
import { generateDemoSales, generateDemoExpiry } from "./demoData";

export default function ReviewDetail({ userId, productId, onBack }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  useEffect(() => {
    load();
  }, [productId]);

    async function load() {
    setLoading(true);
    const sales = generateDemoSales(productId);
    const expiryBatches = generateDemoExpiry(productId, 100);
    const result = await reviewProduct(userId, productId, sales, expiryBatches);
    setData(result);
    setLoading(false);
  }

  async function handleApprove() {
    if (!data) return;
    setPaying(true);

    const result = await executePayment({
      product: data.product,
      vendor: data.vendor,
      request: {
        productId: data.product.productId,
        vendorId: data.vendor.vendorId,
        quantity: data.analysis.reorder.result.recommendedQty,
        unitCost: data.product.costPrice,
        requestedAt: new Date().toISOString(),
      },
      recentOrders: [],
      poAmount: data.approval.orderAmount,
    });

    setPaymentResult(result);
    setPaying(false);
  }

  if (loading) return <div className="dashboard"><p>Analyzing...</p></div>;
  if (!data) return <div className="dashboard"><p>Could not load product.</p></div>;

  const { product, analysis, approval } = data;

  return (
    <div className="dashboard">
      <div className="detail-header">
        <span className="back-link" onClick={onBack}>‹ Back</span>
        <h2>{product.name}</h2>
      </div>

      <div className="card">
        <h3>Sales Velocity</h3>
        <p>{analysis.velocity.avgDailySales.toFixed(1)} units/day — trend: {analysis.velocity.trend}</p>
      </div>

      <div className={`card ${analysis.reorder.result.reorderNeeded ? "alert" : "ok"}`}>
        <h3>Reorder Check</h3>
        <p>{analysis.reorder.explanation}</p>

        {analysis.reorder.result.reorderNeeded && approval && !paymentResult && (
          <>
            <div className="order-summary">
              <div>Ordering: {analysis.reorder.result.recommendedQty} units</div>
              <div>Amount: ₹{approval.orderAmount}</div>
              <div>Vendor: {data.vendor.name}</div>
              <div>Paid to account ending: {data.vendor.bankAccountLast4}</div>
            </div>
            {approval.autoApproved ? (
              <div className="autopay-note">
                <p className="hint">{approval.reason}</p>
                <button onClick={handleApprove} disabled={paying}>
                  {paying ? "Processing..." : "Confirm auto-approved order"}
                </button>
              </div>
            ) : (
              <div className="approve-reject-row">
                <button onClick={handleApprove} disabled={paying}>
                  {paying ? "Processing..." : "Approve"}
                </button>
                <button className="reject-btn" onClick={onBack}>Reject</button>
              </div>
            )}
          </>
        )}
      </div>

      <div className={`card ${analysis.deadStock.result.isDeadStock ? "alert" : "ok"}`}>
        <h3>Dead Stock Check</h3>
        <p>{analysis.deadStock.explanation}</p>
      </div>

            {paymentResult && (
        <div className={`card audit ${paymentResult.success ? "ok" : "alert"}`}>
          <h3>Payment Result</h3>
          <p className="payment-headline">
            {paymentResult.success ? "Payment approved and sent" : "Payment blocked — needs your review"}
          </p>
          {paymentResult.razorpayOrderId && <p className="hint">Razorpay Order ID: {paymentResult.razorpayOrderId}</p>}
          {paymentResult.notification && (
            <p className="hint">{paymentResult.notification.channel} — "{paymentResult.notification.message}"</p>
          )}
          <div className="checks">
            {paymentResult.safetyChecks.map((c: any, i: number) => (
              <div key={i} className={c.passed ? "check-pass" : "check-fail"}>
                {c.passed ? "✓" : "✗"} {c.reason}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
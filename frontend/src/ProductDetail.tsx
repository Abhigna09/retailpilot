import { useEffect, useState } from "react";
import { reviewProduct, previewChecks, executePayment } from "./api";

interface Props {
  userId: string;
  productId: string;
  onBack: () => void;
}

export default function ProductDetail({ userId, productId, onBack }: Props) {
  const [data, setData] = useState<any>(null);
  const [checks, setChecks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  useEffect(() => {
    load();
  }, [productId]);

  async function load() {
    setLoading(true);
    const result = await reviewProduct(userId, productId, [], []);
    setData(result);

    if (result.analysis?.reorder?.result?.reorderNeeded && result.approval) {
      const request = {
        productId: result.product.productId,
        vendorId: result.vendor.vendorId,
        quantity: result.analysis.reorder.result.recommendedQty,
        unitCost: result.product.costPrice,
        requestedAt: new Date().toISOString(),
      };
      const previewResult = await previewChecks(result.product, result.vendor, request, [], result.approval.orderAmount);
      setChecks(previewResult);
    }

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
      actionId: data.action?.actionId,
      actionCreatedAt: data.action?.createdAt,
    });

    setPaymentResult(result);
    setPaying(false);
  }

  if (loading) return <div className="page"><p className="hint">Analyzing...</p></div>;
  if (!data) return <div className="page"><p className="hint">Could not load product.</p></div>;

  const { product, analysis, approval } = data;
  const needsAction = analysis.reorder.result.reorderNeeded;
  const severity = needsAction ? "Critical" : "";

  return (
    <div className="page">
      <div className="back-row">
        <span className="back-link" onClick={onBack}>‹ Back to Analysis</span>
      </div>

      <div className="detail-title-row">
        <div>
          <div className="detail-label">PRODUCT</div>
          <h1 className="page-title-sm">{product.name}</h1>
          <div className="page-subtitle">{product.category} · ₹{product.costPrice}</div>
        </div>
        {needsAction && <span className="badge badge-critical">{severity}</span>}
      </div>

      <div className="section-card">
        <div className="section-card-header">Situation {needsAction && <span className="badge badge-medium">Stockout risk</span>}</div>
        <p className="body-text">{analysis.reorder.explanation}</p>
        <div className="stat-row">
          <div>
            <div className="stat-label">Current stock</div>
            <div className="stat-mid">{product.currentStock} {product.unit || "units"}</div>
          </div>
          <div>
            <div className="stat-label">Daily sales</div>
            <div className="stat-mid">{analysis.velocity.avgDailySales.toFixed(1)} {product.unit || "units"}</div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-header">Why this is happening</div>
        <p className="body-text">{analysis.reorder.explanation}</p>
      </div>

      {needsAction && (
        <div className="section-card">
          <div className="section-card-header">Agent Recommendation</div>
          <p className="body-text">Reorder {analysis.reorder.result.recommendedQty} {product.unit || "units"} now, at a cost of ₹{approval.orderAmount}.</p>
        </div>
      )}

      {needsAction && checks && (
        <div className="section-card">
          <div className="section-card-header">
            Agent Decision
            <span className={`badge ${checks.allPassed ? "badge-healthy" : "badge-critical"}`}>
              {checks.allPassed ? "Ready" : "Blocked"}
            </span>
          </div>
          {checks.checks.map((c: any, i: number) => (
            <div key={i} className={`check-row ${c.passed ? "check-ok" : "check-fail"}`}>
              {c.passed ? "✓" : "✗"} {c.reason}
            </div>
          ))}
        </div>
      )}

      {needsAction && !paymentResult && (
        <div className="section-card">
          {checks?.allPassed ? (
            <button className="btn-primary" onClick={handleApprove} disabled={paying}>
              {paying ? "Processing..." : "Approve order"}
            </button>
          ) : (
            <p className="body-text">The agent could not proceed automatically because one or more safety checks failed. Please review and resolve manually.</p>
          )}
        </div>
      )}

      {paymentResult && (
        <div className={`section-card ${paymentResult.success ? "" : ""}`}>
          <div className="section-card-header">
            {paymentResult.success ? "Action completed" : "Action blocked"}
          </div>
          <p className="body-text">{paymentResult.reason}</p>
          {paymentResult.razorpayOrderId && <p className="hint">Order ID: {paymentResult.razorpayOrderId}</p>}
        </div>
      )}
    </div>
  );
}
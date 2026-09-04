import { useEffect, useState } from "react";
import { reviewProduct, previewChecks, executePayment } from "./api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Props {
  userId: string;
  productId: string;
  onBack: () => void;
}

export default function ProductDetail({
  userId,
  productId,
  onBack,
}: Props) {
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

    try {
      const result = await reviewProduct(userId, productId, [], []);

      setData(result);

      if (
        result.analysis?.reorder?.result?.reorderNeeded &&
        result.approval
      ) {
        const request = {
          productId: result.product.productId,
          vendorId: result.vendor.vendorId,
          quantity: result.analysis.reorder.result.recommendedQty,
          unitCost: result.product.costPrice,
          requestedAt: new Date().toISOString(),
        };

        const previewResult = await previewChecks(
          result.product,
          result.vendor,
          request,
          [],
          result.approval.orderAmount
        );

        setChecks(previewResult);
      }
    } catch (err) {
      console.error("Product analysis failed:", err);

      setData({
        error:
          err instanceof Error
            ? err.message
            : "Product analysis failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!data) return;

    setPaying(true);

    try {
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

      if (!result.success) {
        setPaymentResult(result);
        setPaying(false);
        return;
      }

      const options = {
        key: result.razorpayKeyId,
        amount: data.approval.orderAmount * 100,
        currency: "INR",
        name: "RetailPilot",
        description: `Procurement order — ${data.product.name}`,
        order_id: result.razorpayOrderId,

        handler: function (response: any) {
          setPaymentResult({
            success: true,
            reason: "Payment completed successfully.",
            razorpayOrderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
          });

          setPaying(false);
        },

        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setPaymentResult({
        success: false,
        reason:
          err instanceof Error
            ? err.message
            : "Payment could not be started.",
      });

      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="hint">Analyzing...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <p className="hint">Could not load product.</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="page">
        <h2>Analysis failed</h2>

        <p className="hint">{data.error}</p>

        <button className="secondary-btn" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  const { product, analysis, approval } = data;

  const needsAction = analysis.reorder.result.reorderNeeded;
  const severity = needsAction ? "Critical" : "";

  return (
    <div className="page">
      <div className="back-row">
        <span className="back-link" onClick={onBack}>
          ‹ Back to Analysis
        </span>
      </div>

      <div className="detail-title-row">
        <div>
          <div className="detail-label">PRODUCT</div>

          <h1 className="page-title-sm">
            {product.name}
          </h1>

          <div className="page-subtitle">
            {product.category} · ₹{product.costPrice}
          </div>
        </div>

        {needsAction && (
          <span className="badge badge-critical">
            {severity}
          </span>
        )}
      </div>

      <div className="section-card">
        <div className="section-card-header">
          Situation{" "}
          {needsAction && (
            <span className="badge badge-medium">
              Stockout risk
            </span>
          )}
        </div>

        <p className="body-text">
          {analysis.reorder.explanation}
        </p>

        <div className="stat-row">
          <div>
            <div className="stat-label">
              Current stock
            </div>

            <div className="stat-mid">
              {product.currentStock}{" "}
              {product.unit || "units"}
            </div>
          </div>

          <div>
            <div className="stat-label">
              Daily sales
            </div>

            <div className="stat-mid">
              {analysis.velocity.avgDailySales.toFixed(1)}{" "}
              {product.unit || "units"}
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-header">
          Why this is happening
        </div>

        <p className="body-text">
          {analysis.reorder.explanation}
        </p>
      </div>

      {needsAction && (
        <div className="section-card">
          <div className="section-card-header">
            Agent Recommendation
          </div>

          <p className="body-text">
            Reorder{" "}
            {analysis.reorder.result.recommendedQty}{" "}
            {product.unit || "units"} now, at a cost of ₹
            {approval.orderAmount}.
          </p>
        </div>
      )}

      {needsAction && checks && (
        <div className="section-card">
          <div className="section-card-header">
            Agent Decision

            <span
              className={`badge ${
                checks.allPassed
                  ? "badge-healthy"
                  : "badge-critical"
              }`}
            >
              {checks.allPassed ? "Ready" : "Blocked"}
            </span>
          </div>

          {checks.checks.map((c: any, i: number) => (
            <div
              key={i}
              className={`check-row ${
                c.passed
                  ? "check-ok"
                  : "check-fail"
              }`}
            >
              {c.passed ? "✓" : "✗"} {c.reason}
            </div>
          ))}
        </div>
      )}

      {needsAction && !paymentResult && (
        <div className="section-card">
          {checks?.allPassed ? (
            <button
              className="btn-primary"
              onClick={handleApprove}
              disabled={paying}
            >
              {paying
                ? "Processing..."
                : "Approve order"}
            </button>
          ) : (
            <p className="body-text">
              The agent could not proceed automatically
              because one or more safety checks failed.
              Please review and resolve manually.
            </p>
          )}
        </div>
      )}

      {paymentResult && (
  <div className="section-card">
    {paymentResult.success ? (
      <>
        <div className="section-card-header">
          <span>Procurement payment completed</span>
          <span className="badge badge-healthy">
            Paid
          </span>
        </div>

        <p className="body-text">
          The procurement order was successfully initiated
          through Razorpay after the agent's safety checks
          passed.
        </p>

        <div className="stat-row">
          <div>
            <div className="stat-label">Product</div>
            <div className="stat-mid">
              {product.name}
            </div>
          </div>

          <div>
            <div className="stat-label">Quantity</div>
            <div className="stat-mid">
              {analysis.reorder.result.recommendedQty}{" "}
              {product.unit || "units"}
            </div>
          </div>

          <div>
            <div className="stat-label">Amount</div>
            <div className="stat-mid">
              ₹{approval.orderAmount}
            </div>
          </div>
        </div>

        <div className="check-row check-ok">
          ✓ Safety checks passed
        </div>

        <div className="check-row check-ok">
          ✓ Owner approved procurement
        </div>

        <div className="check-row check-ok">
          ✓ Razorpay payment completed
        </div>

        {paymentResult.razorpayOrderId && (
          <div className="receipt-block">
            <div className="stat-label">
              Razorpay Order ID
            </div>
            <div className="hint">
              {paymentResult.razorpayOrderId}
            </div>
          </div>
        )}

        {paymentResult.paymentId && (
          <div className="receipt-block">
            <div className="stat-label">
              Payment ID
            </div>
            <div className="hint">
              {paymentResult.paymentId}
            </div>
          </div>
        )}

        <div className="receipt-block">
          <div className="stat-label">
            Next step
          </div>
          <p className="body-text">
            Purchase order is ready for vendor fulfilment.
          </p>
        </div>
      </>
    ) : (
      <>
        <div className="section-card-header">
          <span>Action blocked</span>
          <span className="badge badge-critical">
            Blocked
          </span>
        </div>

        <p className="body-text">
          {paymentResult.reason}
        </p>
      </>
    )}
  </div>
)}
    </div>
  );
}
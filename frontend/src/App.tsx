import { useState } from "react";
import { products, vendors, sales, expiryBatches, API_BASE } from "./data";
import "./App.css";

interface AnalysisResult {
  productId: string;
  productName: string;
  velocity: { avgDailySales: number; trend: string };
  reorder: { result: any; explanation: string };
  deadStock: { result: any; explanation: string };
  expiryRisks: { result: any; explanation: string }[];
}

interface PaymentResult {
  success: boolean;
  reason: string;
  amount: number;
  safetyChecks: { passed: boolean; reason: string }[];
  razorpayOrderId?: string;
}

function App() {
  const [selectedId, setSelectedId] = useState(products[0].productId);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [paying, setPaying] = useState(false);

  const selectedProduct = products.find(p => p.productId === selectedId)!;
  const selectedVendor = vendors.find(v => v.vendorId === selectedProduct.vendorId)!;

  async function runAnalysis() {
    setLoading(true);
    setAnalysis(null);
    setPayment(null);
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: selectedProduct,
          vendor: selectedVendor,
          sales,
          expiryBatches,
        }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      alert("Analysis failed: " + err);
    }
    setLoading(false);
  }

  async function approveReorder() {
    if (!analysis) return;
    setPaying(true);
    try {
      const res = await fetch(`${API_BASE}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: selectedProduct,
          vendor: selectedVendor,
          request: {
            productId: selectedProduct.productId,
            vendorId: selectedVendor.vendorId,
            quantity: analysis.reorder.result.recommendedQty,
            unitCost: selectedProduct.costPrice,
            requestedAt: new Date().toISOString(),
          },
          recentOrders: [],
          poAmount: analysis.reorder.result.recommendedQty * selectedProduct.costPrice,
        }),
      });
      const data = await res.json();
      setPayment(data);
    } catch (err) {
      alert("Payment failed: " + err);
    }
    setPaying(false);
  }

  return (
    <div className="dashboard">
      <h1>RetailPilot</h1>
      <p className="subtitle">AI agent for inventory reordering &amp; vendor payments</p>

      <div className="controls">
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          {products.map(p => (
            <option key={p.productId} value={p.productId}>{p.name}</option>
          ))}
        </select>
        <button onClick={runAnalysis} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {analysis && (
        <div className="results">
          <div className="card">
            <h3>Sales Velocity</h3>
            <p>{analysis.velocity.avgDailySales.toFixed(1)} units/day — trend: {analysis.velocity.trend}</p>
          </div>

          <div className={`card ${analysis.reorder.result.reorderNeeded ? "alert" : "ok"}`}>
            <h3>Reorder Check</h3>
            <p>{analysis.reorder.explanation}</p>
            {analysis.reorder.result.reorderNeeded && (
              <button onClick={approveReorder} disabled={paying}>
                {paying ? "Processing..." : `Approve reorder (${analysis.reorder.result.recommendedQty} units)`}
              </button>
            )}
          </div>

          <div className={`card ${analysis.deadStock.result.isDeadStock ? "alert" : "ok"}`}>
            <h3>Dead Stock Check</h3>
            <p>{analysis.deadStock.explanation}</p>
          </div>

          {analysis.expiryRisks.map((risk, i) => (
            <div key={i} className={`card ${risk.result.unitsAtRisk > 0 ? "alert" : "ok"}`}>
              <h3>Expiry Risk</h3>
              <p>{risk.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {payment && (
        <div className={`card audit ${payment.success ? "ok" : "alert"}`}>
          <h3>Payment Result</h3>
          <p>{payment.reason}</p>
          {payment.razorpayOrderId && <p>Razorpay Order ID: {payment.razorpayOrderId}</p>}
          <div className="checks">
            {payment.safetyChecks.map((c, i) => (
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

export default App;
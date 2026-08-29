import { useState } from "react";
import { addProduct } from "./api";

interface Vendor {
  vendorId: string;
  name: string;
}

interface Props {
  userId: string;
  vendors: Vendor[];
  onAdded: () => void;
}

export default function AddProduct({ userId, vendors, onAdded }: Props) {
  const [name, setName] = useState("");
  const [vendorId, setVendorId] = useState(vendors[0]?.vendorId || "");
  const [category, setCategory] = useState("perishable");
  const [costPrice, setCostPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [autopayThreshold, setAutopayThreshold] = useState("5000");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await addProduct({
      userId,
      name,
      vendorId,
      category,
      costPrice: Number(costPrice),
      sellPrice: Number(sellPrice),
      currentStock: Number(currentStock),
      autopayEnabled,
      autopayThreshold: Number(autopayThreshold),
    });

    setLoading(false);
    setName("");
    setCostPrice("");
    setSellPrice("");
    setCurrentStock("");
    onAdded();
  }

  if (vendors.length === 0) {
    return <p className="hint">Add a vendor first before adding products.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h3>Add Product</h3>
      <input type="text" placeholder="Product name" value={name} onChange={e => setName(e.target.value)} required />

      <select value={vendorId} onChange={e => setVendorId(e.target.value)}>
        {vendors.map(v => <option key={v.vendorId} value={v.vendorId}>{v.name}</option>)}
      </select>

      <select value={category} onChange={e => setCategory(e.target.value)}>
        <option value="perishable">Perishable</option>
        <option value="dairy">Dairy</option>
        <option value="dry-goods">Dry goods</option>
        <option value="other">Other</option>
      </select>

      <input type="number" placeholder="Cost price (₹)" value={costPrice} onChange={e => setCostPrice(e.target.value)} required />
      <input type="number" placeholder="Sell price (₹)" value={sellPrice} onChange={e => setSellPrice(e.target.value)} required />
      <input type="number" placeholder="Current stock" value={currentStock} onChange={e => setCurrentStock(e.target.value)} required />

      <label className="checkbox-row">
        <input type="checkbox" checked={autopayEnabled} onChange={e => setAutopayEnabled(e.target.checked)} />
        Enable autopay
      </label>

      {autopayEnabled && (
        <input type="number" placeholder="Autopay threshold (₹)" value={autopayThreshold} onChange={e => setAutopayThreshold(e.target.value)} />
      )}

      <button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Product"}</button>
    </form>
  );
}
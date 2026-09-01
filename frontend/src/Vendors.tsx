import { useEffect, useState } from "react";
import { listVendors, addVendor } from "./api";

interface Props {
  userId: string;
}

export default function Vendors({ userId }: Props) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const v = await listVendors(userId);
    setVendors(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await addVendor({
      userId,
      name,
      leadTimeDays: Number(leadTimeDays),
      contactEmail: "",
      contactPhone,
      bankAccountLast4: "0000",
    });

    setLoading(false);
    setName("");
    setContactPhone("");
    setLeadTimeDays("");
    refresh();
  }

  return (
    <div className="page">
      <h1 className="page-title-sm">Vendors</h1>
      <p className="page-subtitle">Suppliers you order from and their delivery lead times.</p>

      <div className="section-card">
        <div className="section-card-header">Add a vendor</div>
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-field">
            <label>Vendor name</label>
            <input type="text" placeholder="Fresh Dairy Co." value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Contact</label>
            <input type="tel" placeholder="+91 98200 11111" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>Lead time (days)</label>
            <input type="number" placeholder="3" value={leadTimeDays} onChange={e => setLeadTimeDays(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            + {loading ? "Adding..." : "Add vendor"}
          </button>
        </form>
      </div>

      <div className="vendor-grid">
        {vendors.map((v: any) => (
          <div key={v.vendorId} className="vendor-card">
            <div className="vendor-card-name">{v.name}</div>
            <div className="vendor-card-detail">{v.contactPhone}</div>
            <div className="vendor-card-detail">Lead time: <strong>{v.leadTimeDays} days</strong></div>
          </div>
        ))}
      </div>
    </div>
  );
}
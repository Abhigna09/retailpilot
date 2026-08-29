import { useState } from "react";
import { addVendor } from "./api";

interface Props {
  userId: string;
  onAdded: () => void;
}

export default function AddVendor({ userId, onAdded }: Props) {
  const [name, setName] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [bankAccountLast4, setBankAccountLast4] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await addVendor({
      userId,
      name,
      leadTimeDays: Number(leadTimeDays),
      contactEmail,
      contactPhone,
      bankAccountLast4,
    });

    setLoading(false);
    setName("");
    setLeadTimeDays("");
    setContactEmail("");
    setContactPhone("");
    setBankAccountLast4("");
    onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h3>Add Vendor</h3>
      <input type="text" placeholder="Vendor name" value={name} onChange={e => setName(e.target.value)} required />
      <input type="number" placeholder="Lead time (days)" value={leadTimeDays} onChange={e => setLeadTimeDays(e.target.value)} required />
      <input type="email" placeholder="Contact email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required />
      <input type="tel" placeholder="Contact phone (with country code)" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required />
      <input type="text" placeholder="Bank account last 4 digits" value={bankAccountLast4} onChange={e => setBankAccountLast4(e.target.value)} maxLength={4} required />
      <button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Vendor"}</button>
    </form>
  );
}
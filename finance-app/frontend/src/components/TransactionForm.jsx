import { useEffect, useState } from "react";
import api from "../api/axios";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "other", label: "Other" },
];

export default function TransactionForm({ initial, onSubmit, onCancel, submitLabel = "Save" }) {
  const [type, setType] = useState(initial?.type || "expense");
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    amount: initial?.amount || "",
    category: initial?.category?._id || initial?.category || "",
    description: initial?.description || "",
    date: initial?.date ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    paymentMethod: initial?.paymentMethod || "other",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await api.get(`/categories?type=${type}`);
      setCategories(data);
      if (!data.find((c) => c._id === form.category)) {
        setForm((f) => ({ ...f, category: data[0]?._id || "" }));
      }
    };
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!form.category) {
      setError("Please select a category");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ ...form, type, amount: Number(form.amount) });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-2.5 text-sm text-coral-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-ink-800 p-1">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`rounded-lg py-2 text-sm font-semibold transition ${
            type === "expense" ? "bg-coral-500 text-ink-950" : "text-mist-400 hover:text-mist-100"
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`rounded-lg py-2 text-sm font-semibold transition ${
            type === "income" ? "bg-mint-500 text-ink-950" : "text-mist-400 hover:text-mist-100"
          }`}
        >
          Income
        </button>
      </div>

      <div>
        <label className="label-text">Amount</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          className="input-field"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
      </div>

      <div>
        <label className="label-text">Category</label>
        <select
          className="input-field"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-text">Description</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Grocery shopping at Whole Foods"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-text">Date</label>
          <input
            type="date"
            className="input-field"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div>
          <label className="label-text">Payment Method</label>
          <select
            className="input-field"
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Repeat, Check } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import Loader from "../components/Loader";
import { formatCurrency, formatDate } from "../utils/format";

const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"];

export default function Recurring() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const currency = user?.currency || "USD";

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [type, setType] = useState("expense");
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    frequency: "monthly",
    startDate: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/recurring");
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const loadCategories = async () => {
      const { data } = await api.get(`/categories?type=${type}`);
      setCategories(data);
      setForm((f) => ({ ...f, category: data[0]?._id || "" }));
    };
    if (modalOpen) loadCategories();
  }, [type, modalOpen]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.amount || !form.category) {
      setError("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      await api.post("/recurring", { ...form, amount: Number(form.amount), type });
      setModalOpen(false);
      setForm({ title: "", amount: "", category: "", frequency: "monthly", startDate: new Date().toISOString().slice(0, 10) });
      showToast("Recurring item added", "success");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleProcess = async (id) => {
    await api.post(`/recurring/${id}/process`);
    showToast("Logged as a transaction", "success");
    load();
  };

  const handleDelete = async () => {
    await api.delete(`/recurring/${deleteTarget._id}`);
    setDeleteTarget(null);
    showToast("Recurring item deleted", "success");
    load();
  };

  const isDue = (date) => new Date(date) <= new Date();

  return (
    <div>
      <PageHeader
        title="Recurring Expenses"
        subtitle="Subscriptions, bills, and income that repeat automatically"
        action={
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Add Recurring Item
          </button>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader />
        </div>
      ) : items.length === 0 ? (
        <div className="card flex h-64 flex-col items-center justify-center text-center">
          <Repeat size={28} className="mb-2 text-mist-500" />
          <p className="text-mist-300">No recurring items yet</p>
          <p className="mt-1 text-sm text-mist-500">
            Add rent, subscriptions, or salary to track them automatically.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-500/60 text-left text-xs uppercase tracking-wider text-mist-500">
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Frequency</th>
                <th className="px-5 py-3 font-medium">Next Due</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id} className="border-b border-ink-500/30 last:border-0 hover:bg-ink-600/30">
                  <td className="px-5 py-3.5 font-medium text-mist-100">{r.title}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="chip border-transparent"
                      style={{ backgroundColor: `${r.category?.color}22`, color: r.category?.color }}
                    >
                      {r.category?.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 capitalize text-mist-400">{r.frequency}</td>
                  <td className="px-5 py-3.5">
                    <span className={isDue(r.nextDueDate) ? "font-medium text-gold-400" : "text-mist-400"}>
                      {formatDate(r.nextDueDate)}
                    </span>
                  </td>
                  <td
                    className={`px-5 py-3.5 text-right font-tabular font-semibold ${
                      r.type === "income" ? "text-mint-400" : "text-coral-400"
                    }`}
                  >
                    {r.type === "income" ? "+" : "-"}
                    {formatCurrency(r.amount, currency)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleProcess(r._id)}
                        title="Log this as a transaction"
                        className="rounded-lg p-1.5 text-mist-500 hover:bg-mint-500/10 hover:text-mint-400"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="rounded-lg p-1.5 text-mist-500 hover:bg-coral-500/10 hover:text-coral-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Recurring Item">
        <form onSubmit={handleCreate} className="space-y-4">
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
            <label className="label-text">Title</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Netflix Subscription, Rent, Salary"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label-text">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Frequency</label>
              <select
                className="input-field"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f} className="capitalize">
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Start Date</label>
              <input
                type="date"
                className="input-field"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving..." : "Add Item"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Recurring Item" maxWidth="max-w-sm">
        <p className="text-sm text-mist-300">Are you sure you want to delete this recurring item?</p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 rounded-xl bg-coral-500 px-4 py-2.5 font-semibold text-ink-950 transition hover:bg-coral-400"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

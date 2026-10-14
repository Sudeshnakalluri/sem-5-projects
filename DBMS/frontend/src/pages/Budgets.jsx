import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import Loader from "../components/Loader";
import { formatCurrency, MONTH_NAMES } from "../utils/format";

export default function Budgets() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const currency = user?.currency || "USD";
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ category: "", limit: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        api.get(`/budgets?month=${month}&year=${year}`),
        api.get(`/categories?type=expense`),
      ]);
      setBudgets(budgetsRes.data);
      setCategories(categoriesRes.data);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const availableCategories = categories.filter(
    (c) => !budgets.find((b) => b.category._id === c._id)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.category || !form.limit) {
      setError("Please select a category and enter a limit");
      return;
    }
    setSaving(true);
    try {
      await api.post("/budgets", { category: form.category, month, year, limit: Number(form.limit) });
      setModalOpen(false);
      setForm({ category: "", limit: "" });
      showToast("Budget set", "success");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/budgets/${id}`);
    showToast("Budget removed", "success");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Budgets"
        subtitle={`Monthly limits for ${MONTH_NAMES[month - 1]} ${year}`}
        action={
          <button onClick={() => setModalOpen(true)} className="btn-primary" disabled={availableCategories.length === 0}>
            <Plus size={16} /> Set Budget
          </button>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader />
        </div>
      ) : budgets.length === 0 ? (
        <div className="card flex h-64 flex-col items-center justify-center text-center">
          <p className="text-mist-300">No budgets set for this month</p>
          <p className="mt-1 text-sm text-mist-500">Set a spending limit per category to stay on track.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {budgets.map((b) => {
            const pct = Math.min(b.percentUsed, 100);
            const barColor = b.isOverBudget ? "#F4623A" : pct > (b.notifyAtPercent || 80) ? "#E8C766" : "#2FBF9F";
            return (
              <div key={b._id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold"
                      style={{ backgroundColor: `${b.category.color}22`, color: b.category.color }}
                    >
                      {b.category.name[0]}
                    </span>
                    <div>
                      <p className="font-semibold text-mist-100">{b.category.name}</p>
                      <p className="text-xs text-mist-500">
                        {formatCurrency(b.spent, currency)} of {formatCurrency(b.limit, currency)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(b._id)}
                    className="rounded-lg p-1.5 text-mist-500 hover:bg-coral-500/10 hover:text-coral-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-mist-500">{b.percentUsed}% used</span>
                  {b.isOverBudget && (
                    <span className="flex items-center gap-1 font-medium text-coral-400">
                      <AlertTriangle size={12} /> Over budget
                    </span>
                  )}
                  {!b.isOverBudget && (
                    <span className="font-medium text-mist-400">
                      {formatCurrency(b.remaining, currency)} left
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Set Monthly Budget">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-2.5 text-sm text-coral-400">
              {error}
            </div>
          )}
          <div>
            <label className="label-text">Category</label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Select a category</option>
              {availableCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Monthly Limit</label>
            <input
              type="number"
              min="1"
              step="0.01"
              className="input-field"
              placeholder="0.00"
              value={form.limit}
              onChange={(e) => setForm({ ...form, limit: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving..." : "Set Budget"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Lock } from "lucide-react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import Loader from "../components/Loader";

const COLORS = [
  "#2FBF9F", "#D4AF37", "#4C6FFF", "#F4623A", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F4A623", "#EF4444", "#5B8DEF",
];

export default function Categories() {
  const { showToast } = useToast();
  const [income, setIncome] = useState([]);
  const [expense, setExpense] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", type: "expense", color: COLORS[0] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [incomeRes, expenseRes] = await Promise.all([
        api.get("/categories?type=income"),
        api.get("/categories?type=expense"),
      ]);
      setIncome(incomeRes.data);
      setExpense(expenseRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name) {
      setError("Please enter a category name");
      return;
    }
    setSaving(true);
    try {
      await api.post("/categories", form);
      setModalOpen(false);
      setForm({ name: "", type: "expense", color: COLORS[0] });
      showToast("Category created", "success");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/categories/${deleteTarget._id}`);
      setDeleteTarget(null);
      showToast("Category deleted", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Cannot delete this category", "error");
      setDeleteTarget(null);
    }
  };

  const renderGrid = (list) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((c) => (
        <div key={c._id} className="card flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold"
              style={{ backgroundColor: `${c.color}22`, color: c.color }}
            >
              {c.name[0]}
            </span>
            <span className="font-medium text-mist-100">{c.name}</span>
          </div>
          {c.isDefault ? (
            <span title="Default category" className="p-1.5 text-mist-600">
              <Lock size={14} />
            </span>
          ) : (
            <button
              onClick={() => setDeleteTarget(c)}
              className="rounded-lg p-1.5 text-mist-500 hover:bg-coral-500/10 hover:text-coral-400"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organize how your income and expenses are grouped"
        action={
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New Category
          </button>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="mb-3 font-display font-semibold text-mist-100">Income Categories</h3>
            {renderGrid(income)}
          </div>
          <div>
            <h3 className="mb-3 font-display font-semibold text-mist-100">Expense Categories</h3>
            {renderGrid(expense)}
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Category">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-2.5 text-sm text-coral-400">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-ink-800 p-1">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "expense" })}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                form.type === "expense" ? "bg-coral-500 text-ink-950" : "text-mist-400 hover:text-mist-100"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "income" })}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                form.type === "income" ? "bg-mint-500 text-ink-950" : "text-mist-400 hover:text-mist-100"
              }`}
            >
              Income
            </button>
          </div>
          <div>
            <label className="label-text">Category Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Pet Care, Side Hustle"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label-text">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className="h-8 w-8 rounded-full transition"
                  style={{
                    backgroundColor: color,
                    boxShadow: form.color === color ? `0 0 0 2px #0B1220, 0 0 0 4px ${color}` : "none",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Category" maxWidth="max-w-sm">
        <p className="text-sm text-mist-300">
          Are you sure you want to delete "{deleteTarget?.name}"? Categories with existing
          transactions can't be deleted.
        </p>
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

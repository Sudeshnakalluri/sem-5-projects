import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Target, CheckCircle2, PlusCircle } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import Loader from "../components/Loader";
import { formatCurrency, formatDate } from "../utils/format";

const GOAL_COLORS = ["#2FBF9F", "#D4AF37", "#4C6FFF", "#F4623A", "#8B5CF6", "#EC4899"];

export default function Goals() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const currency = user?.currency || "USD";

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [contributeTarget, setContributeTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ title: "", targetAmount: "", targetDate: "" });
  const [contributeAmount, setContributeAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/goals");
      setGoals(data);
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
    if (!form.title || !form.targetAmount) {
      setError("Please enter a title and target amount");
      return;
    }
    setSaving(true);
    try {
      const color = GOAL_COLORS[goals.length % GOAL_COLORS.length];
      await api.post("/goals", {
        title: form.title,
        targetAmount: Number(form.targetAmount),
        targetDate: form.targetDate || undefined,
        color,
      });
      setModalOpen(false);
      setForm({ title: "", targetAmount: "", targetDate: "" });
      showToast("Goal created", "success");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contributeAmount || Number(contributeAmount) <= 0) return;
    setSaving(true);
    try {
      await api.post(`/goals/${contributeTarget._id}/contribute`, { amount: Number(contributeAmount) });
      setContributeTarget(null);
      setContributeAmount("");
      showToast("Contribution added", "success");
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await api.delete(`/goals/${deleteTarget._id}`);
    setDeleteTarget(null);
    showToast("Goal deleted", "success");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Savings Goals"
        subtitle="Track progress toward what matters"
        action={
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New Goal
          </button>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader />
        </div>
      ) : goals.length === 0 ? (
        <div className="card flex h-64 flex-col items-center justify-center text-center">
          <Target size={28} className="mb-2 text-mist-500" />
          <p className="text-mist-300">No savings goals yet</p>
          <p className="mt-1 text-sm text-mist-500">Create one to start building toward something big.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => {
            const pct = Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100);
            return (
              <div key={g._id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${g.color}22`, color: g.color }}
                    >
                      {g.status === "completed" ? <CheckCircle2 size={18} /> : <Target size={18} />}
                    </span>
                    <div>
                      <p className="font-semibold text-mist-100">{g.title}</p>
                      {g.targetDate && (
                        <p className="text-xs text-mist-500">By {formatDate(g.targetDate)}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(g)}
                    className="rounded-lg p-1.5 text-mist-500 hover:bg-coral-500/10 hover:text-coral-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="font-tabular text-xl font-bold text-mist-100">
                    {formatCurrency(g.savedAmount, currency)}
                  </span>
                  <span className="text-xs text-mist-500">
                    of {formatCurrency(g.targetAmount, currency)}
                  </span>
                </div>

                <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: g.color }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-mist-500">
                  <span>{pct}% complete</span>
                  {g.status === "completed" && <span className="font-medium text-mint-400">Goal reached 🎉</span>}
                </div>

                {g.status !== "completed" && (
                  <button
                    onClick={() => setContributeTarget(g)}
                    className="btn-secondary mt-4 w-full text-sm"
                  >
                    <PlusCircle size={14} /> Add Contribution
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Savings Goal">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-2.5 text-sm text-coral-400">
              {error}
            </div>
          )}
          <div>
            <label className="label-text">Goal Title</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Emergency Fund, New Laptop, Vacation"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label-text">Target Amount</label>
            <input
              type="number"
              min="1"
              step="0.01"
              className="input-field"
              placeholder="0.00"
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
            />
          </div>
          <div>
            <label className="label-text">Target Date (optional)</label>
            <input
              type="date"
              className="input-field"
              value={form.targetDate}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!contributeTarget} onClose={() => setContributeTarget(null)} title="Add Contribution" maxWidth="max-w-sm">
        <form onSubmit={handleContribute} className="space-y-4">
          <div>
            <label className="label-text">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              autoFocus
              className="input-field"
              placeholder="0.00"
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setContributeTarget(null)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Goal" maxWidth="max-w-sm">
        <p className="text-sm text-mist-300">Are you sure you want to delete this savings goal?</p>
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

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import TransactionForm from "../components/TransactionForm";
import Loader from "../components/Loader";
import { formatCurrency, formatDate } from "../utils/format";

export default function Transactions() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const currency = user?.currency || "USD";

  const [data, setData] = useState({ transactions: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (typeFilter) params.append("type", typeFilter);
      if (search) params.append("search", search);
      const { data } = await api.get(`/transactions?${params.toString()}`);
      setData(data);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (payload) => {
    await api.post("/transactions", payload);
    setModalOpen(false);
    showToast("Transaction added", "success");
    load();
  };

  const handleUpdate = async (payload) => {
    await api.put(`/transactions/${editing._id}`, payload);
    setEditing(null);
    showToast("Transaction updated", "success");
    load();
  };

  const handleDelete = async () => {
    await api.delete(`/transactions/${deleteTarget._id}`);
    setDeleteTarget(null);
    showToast("Transaction deleted", "success");
    load();
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Every income and expense, in one place"
        action={
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Add Transaction
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist-500" />
          <input
            type="text"
            placeholder="Search description..."
            className="input-field pl-9"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <div className="flex gap-2 rounded-xl bg-ink-800 p-1">
          {[
            { value: "", label: "All" },
            { value: "income", label: "Income" },
            { value: "expense", label: "Expense" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setPage(1);
                setTypeFilter(f.value);
              }}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                typeFilter === f.value ? "bg-gold-500 text-ink-950" : "text-mist-400 hover:text-mist-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader />
          </div>
        ) : data.transactions.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <p className="text-mist-300">No transactions found</p>
            <p className="mt-1 text-sm text-mist-500">Add your first transaction to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-500/60 text-left text-xs uppercase tracking-wider text-mist-500">
                <th className="px-5 py-3 font-medium">Transaction</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((t) => (
                <tr key={t._id} className="border-b border-ink-500/30 last:border-0 hover:bg-ink-600/30">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          t.type === "income"
                            ? "bg-mint-500/10 text-mint-400"
                            : "bg-coral-500/10 text-coral-400"
                        }`}
                      >
                        {t.type === "income" ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                      </span>
                      <span className="font-medium text-mist-100">
                        {t.description || t.category?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="chip border-transparent"
                      style={{ backgroundColor: `${t.category?.color}22`, color: t.category?.color }}
                    >
                      {t.category?.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-mist-400">{formatDate(t.date)}</td>
                  <td className="px-5 py-3.5 capitalize text-mist-400">
                    {t.paymentMethod?.replace("_", " ")}
                  </td>
                  <td
                    className={`px-5 py-3.5 text-right font-tabular font-semibold ${
                      t.type === "income" ? "text-mint-400" : "text-coral-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount, currency)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditing(t)}
                        className="rounded-lg p-1.5 text-mist-500 hover:bg-ink-600 hover:text-mist-100"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
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
        )}
      </div>

      {data.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-lg text-sm font-medium transition ${
                page === p ? "bg-gold-500 text-ink-950" : "text-mist-400 hover:bg-ink-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Transaction">
        <TransactionForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} submitLabel="Add" />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Transaction">
        {editing && (
          <TransactionForm
            initial={editing}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Transaction" maxWidth="max-w-sm">
        <p className="text-sm text-mist-300">
          Are you sure you want to delete this transaction? This action cannot be undone.
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

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Loader from "../components/Loader";
import { formatCurrency, formatDate, MONTH_NAMES } from "../utils/format";

const TOOLTIP_STYLE = {
  backgroundColor: "#131B2C",
  border: "1px solid #232E45",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#F5F7FB",
};

export default function Dashboard() {
  const { user } = useAuth();
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [summaryRes, breakdownRes, trendRes] = await Promise.all([
          api.get(`/dashboard/summary?month=${month}&year=${year}`),
          api.get(`/dashboard/category-breakdown?type=expense&month=${month}&year=${year}`),
          api.get(`/dashboard/trend?months=6`),
        ]);
        setSummary(summaryRes.data);
        setBreakdown(breakdownRes.data);
        setTrend(
          trendRes.data.map((t) => ({
            ...t,
            label: MONTH_NAMES[parseInt(t.period.split("-")[1], 10) - 1].slice(0, 3),
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month, year]);

  if (loading || !summary) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader />
      </div>
    );
  }

  const currency = user?.currency || "USD";

  return (
    <div>
      <PageHeader
        title={`Good to see you, ${user?.name?.split(" ")[0] || ""}`}
        subtitle={`${MONTH_NAMES[month - 1]} ${year} overview`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Income"
          value={formatCurrency(summary.totalIncome, currency)}
          sub={`${summary.incomeCount} transactions`}
          icon={TrendingUp}
          accent="mint"
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(summary.totalExpense, currency)}
          sub={`${summary.expenseCount} transactions`}
          icon={TrendingDown}
          accent="coral"
        />
        <StatCard
          label="Remaining Balance"
          value={formatCurrency(summary.remainingBalance, currency)}
          sub={`${summary.savingsRate}% savings rate`}
          icon={Wallet}
          accent="gold"
        />
        <StatCard
          label="Goals Progress"
          value={formatCurrency(summary.goalsSummary.saved, currency)}
          sub={`of ${formatCurrency(summary.goalsSummary.target, currency)} target`}
          icon={PiggyBank}
          accent="mint"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="card p-5 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold text-mist-100">Income vs Expenses</h3>
            <span className="text-xs text-mist-500">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trend} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2540" vertical={false} />
              <XAxis dataKey="label" stroke="#6B7488" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7488" fontSize={12} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8B95A8" }} />
              <Bar dataKey="income" name="Income" fill="#2FBF9F" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#F4623A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold text-mist-100">Spending by Category</h3>
          </div>
          {breakdown.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-center text-sm text-mist-500">
              No expenses recorded this month yet.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {breakdown.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) => formatCurrency(value, currency)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 max-h-32 space-y-1.5 overflow-y-auto pr-1">
                {breakdown.map((b, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-mist-300">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                      {b.name}
                    </span>
                    <span className="font-tabular font-medium text-mist-100">
                      {formatCurrency(b.total, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="card p-5 xl:col-span-3">
          <h3 className="mb-4 font-display font-semibold text-mist-100">Balance Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1B2540" vertical={false} />
              <XAxis dataKey="label" stroke="#6B7488" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7488" fontSize={12} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#2FBF9F"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Expense"
                stroke="#F4623A"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display font-semibold text-mist-100">Recent Transactions</h3>
          </div>
          {summary.highestSpendingCategory && (
            <div className="mb-3 rounded-xl border border-gold-500/20 bg-gold-500/5 px-3.5 py-2.5 text-xs text-mist-300">
              Highest spending:{" "}
              <span className="font-semibold text-gold-400">
                {summary.highestSpendingCategory.category?.name}
              </span>{" "}
              — {formatCurrency(summary.highestSpendingCategory.total, currency)}
            </div>
          )}
          <div className="space-y-1">
            {summary.recentTransactions.length === 0 && (
              <p className="py-6 text-center text-sm text-mist-500">No transactions yet.</p>
            )}
            {summary.recentTransactions.map((t) => (
              <div
                key={t._id}
                className="flex items-center justify-between rounded-xl px-2.5 py-2.5 transition hover:bg-ink-600/50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      t.type === "income" ? "bg-mint-500/10 text-mint-400" : "bg-coral-500/10 text-coral-400"
                    }`}
                  >
                    {t.type === "income" ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-mist-100">
                      {t.description || t.category?.name}
                    </p>
                    <p className="text-xs text-mist-500">{formatDate(t.date)}</p>
                  </div>
                </div>
                <span
                  className={`font-tabular text-sm font-semibold ${
                    t.type === "income" ? "text-mint-400" : "text-coral-400"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

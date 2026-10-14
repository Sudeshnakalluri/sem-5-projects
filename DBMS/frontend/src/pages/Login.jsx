import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet, Eye, EyeOff, TrendingUp, ShieldCheck, PieChart } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-ink-900 bg-app-grid">
      <div className="hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-ink-800 p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-glow">
            <Wallet size={18} className="text-ink-950" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold text-mist-100">Ledgerly</span>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight text-mist-100">
            Every rupee, dollar, and euro — <span className="text-gold-400">accounted for.</span>
          </h1>
          <p className="mt-4 text-mist-400">
            Track income and expenses, set monthly budgets, and watch your savings goals grow with
            clear, real-time dashboards.
          </p>

          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3 text-sm text-mist-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500/10 text-mint-400">
                <TrendingUp size={16} />
              </span>
              Visual insights into spending habits
            </div>
            <div className="flex items-center gap-3 text-sm text-mist-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
                <PieChart size={16} />
              </span>
              Category budgets that keep you on track
            </div>
            <div className="flex items-center gap-3 text-sm text-mist-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral-500/10 text-coral-400">
                <ShieldCheck size={16} />
              </span>
              Your data is private, secured, and yours alone
            </div>
          </div>
        </div>

        <p className="text-xs text-mist-500">Smart Personal Finance Management System</p>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600">
                <Wallet size={18} className="text-ink-950" strokeWidth={2.5} />
              </div>
              <span className="font-display text-xl font-bold text-mist-100">Ledgerly</span>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-mist-100">Welcome back</h2>
          <p className="mt-1 mb-8 text-sm text-mist-400">Log in to continue managing your money.</p>

          {error && (
            <div className="mb-4 rounded-xl border border-coral-500/30 bg-coral-500/10 px-4 py-2.5 text-sm text-coral-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-text">Email</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label-text">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-500 hover:text-mist-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-mist-400">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-gold-400 hover:text-gold-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

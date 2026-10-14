import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  Tags,
  Repeat,
  LogOut,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/goals", label: "Savings Goals", icon: Target },
  { to: "/recurring", label: "Recurring", icon: Repeat },
  { to: "/categories", label: "Categories", icon: Tags },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-ink-900 bg-app-grid text-mist-100">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-ink-500/50 bg-ink-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-glow">
            <Wallet size={18} className="text-ink-950" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-mist-100">
            Ledgerly
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-gold-500/10 text-gold-400 shadow-[inset_0_0_0_1px_rgba(212,175,55,0.25)]"
                    : "text-mist-400 hover:bg-ink-700 hover:text-mist-100"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-500/50 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-ink-950"
              style={{ backgroundColor: user?.avatarColor || "#D4AF37" }}
            >
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-mist-100">{user?.name}</p>
              <p className="truncate text-xs text-mist-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="rounded-lg p-2 text-mist-500 transition hover:bg-coral-500/10 hover:text-coral-400"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1 px-8 py-7">
        <Outlet />
      </main>
    </div>
  );
}

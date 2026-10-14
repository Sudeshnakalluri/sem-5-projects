export default function StatCard({ label, value, sub, icon: Icon, accent = "gold", trend }) {
  const accentClasses = {
    gold: "text-gold-400 bg-gold-500/10",
    mint: "text-mint-400 bg-mint-500/10",
    coral: "text-coral-400 bg-coral-500/10",
  };

  return (
    <div className="card relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-mist-400">{label}</p>
          <p className="mt-2 font-display font-tabular text-2xl font-bold text-mist-100">{value}</p>
          {sub && <p className="mt-1 text-xs text-mist-500">{sub}</p>}
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClasses[accent]}`}>
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trend >= 0 ? "text-mint-400" : "text-coral-400"}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
          <span className="text-mist-500">vs last month</span>
        </div>
      )}
    </div>
  );
}

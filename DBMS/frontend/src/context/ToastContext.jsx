import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const ICONS = {
  success: <CheckCircle2 size={18} className="text-mint-400" />,
  error: <XCircle size={18} className="text-coral-400" />,
  info: <Info size={18} className="text-gold-400" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card flex items-center gap-2.5 px-4 py-3 text-sm text-mist-100 shadow-glow animate-[slideIn_0.2s_ease-out]"
          >
            {ICONS[t.type]}
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: translateX(0) } }
      `}</style>
    </ToastContext.Provider>
  );
}

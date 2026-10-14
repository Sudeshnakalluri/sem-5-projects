import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} card animate-[slideUp_0.2s_ease-out] max-h-[85vh] overflow-y-auto`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-ink-500/60 bg-ink-700/95 px-5 py-4 backdrop-blur">
          <h3 className="font-display text-lg font-semibold text-mist-100">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-mist-400 transition hover:bg-ink-600 hover:text-mist-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
}

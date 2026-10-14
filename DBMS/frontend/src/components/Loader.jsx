export default function Loader({ size = 28 }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-ink-500 border-t-gold-500"
      style={{ width: size, height: size }}
    />
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--color-surface)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "var(--color-accent)" }}
            >
              B
            </div>
            <span
              className="text-xl font-semibold tracking-tight"
              style={{ color: "var(--color-ink)" }}
            >
              Subtrack
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Simple, focused finance tracking
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

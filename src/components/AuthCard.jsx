export function AuthCard({ title, subtitle, children }) {
  return (
    <section className="auth-layout">
      <div className="auth-content">
        <p className="eyebrow">Saha Food Access</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="auth-highlight-row">
          <span>OTP Recovery</span>
          <span>Fast Checkout</span>
          <span>Order Tracking</span>
        </div>
      </div>
      <div className="auth-card">{children}</div>
    </section>
  );
}

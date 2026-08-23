import LoginForm from "./LoginForm";

export default function PrivateLoginPage() {
  return (
    <main className="private-login-page">
      <div className="private-login-card">
        <p className="section-label">YOLO / PRIVATE AREA</p>
        <h1>进入交易库</h1>
        <p>持仓、盈亏、成交记录和作战计划是私有内容。</p>
        <LoginForm />
      </div>
    </main>
  );
}

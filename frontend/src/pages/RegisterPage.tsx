import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAxiosError } from "axios";

export function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setAccountCreated(false);
    setIsSubmitting(true);

    try {
      await register({ name, email, password });
      try {
        await login({ email, password });
        navigate("/dashboard");
      } catch {
        setAccountCreated(true);
      }
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 400) {
        setError("Já existe uma conta com esse email.");
      } else if (isAxiosError(err) && err.response?.status === 422) {
        setError("Verifique os dados informados. A senha precisa ter no mínimo 8 caracteres.");
      } else {
        setError("Não foi possível criar a conta. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Criar conta no WorkZen</h1>
        <p className="auth-subtitle">Comece a organizar seu negócio em poucos minutos.</p>

        {error && <div className="auth-error" role="alert">{error}</div>}
        {accountCreated && <div className="auth-success" role="status">Conta criada. Não foi possível entrar automaticamente; faça login para continuar.</div>}

        <label className="auth-label" htmlFor="name">
          Nome
        </label>
        <input
          id="name"
          type="text"
          className="auth-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />

        <label className="auth-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <label className="auth-label" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />

        <button type="submit" className="auth-button" disabled={isSubmitting || accountCreated}>
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="auth-footer-text">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}

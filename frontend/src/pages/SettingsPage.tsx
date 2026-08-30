import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme, type Theme } from "../context/ThemeContext";

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 120;

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalizedName = name.trim().replace(/\s+/g, " ");

    if (normalizedName.length < NAME_MIN_LENGTH || normalizedName.length > NAME_MAX_LENGTH) {
      setError(`Informe um nome entre ${NAME_MIN_LENGTH} e ${NAME_MAX_LENGTH} caracteres.`);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await updateProfile({ name: normalizedName });
      setName(normalizedName);
      showToast("Perfil atualizado com sucesso.", "success");
    } catch (requestError) {
      const message = isAxiosError(requestError) && requestError.response?.status === 422
        ? "Verifique o nome informado e tente novamente."
        : "Não foi possível salvar suas alterações. Tente novamente.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <p className="dashboard-eyebrow">Conta</p>
        <h1 className="page-title">Configurações</h1>
        <p className="settings-intro">Gerencie as informações que identificam sua conta no WorkZen.</p>
      </header>

      <section className="settings-section" aria-labelledby="profile-heading">
        <div className="settings-section-heading">
          <h2 id="profile-heading">Perfil</h2>
          <p>Informações pessoais e identificação da conta.</p>
        </div>

        <form className="settings-card" onSubmit={handleSubmit}>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <div className="settings-profile-identity">
            <span className="settings-profile-avatar" aria-hidden="true">{getInitials(user?.name)}</span>
            <div>
              <strong>{user?.name || "Sua conta"}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <div className="settings-field">
            <label className="form-label" htmlFor="profile-name">Nome</label>
            <input
              id="profile-name"
              className="form-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={NAME_MIN_LENGTH}
              maxLength={NAME_MAX_LENGTH}
              autoComplete="name"
              required
            />
            <p className="settings-help">Este nome será exibido na sua sidebar e no dashboard.</p>
          </div>

          <div className="settings-field">
            <label className="form-label" htmlFor="profile-email">E-mail</label>
            <input
              id="profile-email"
              className="form-input settings-readonly-input"
              value={user?.email ?? ""}
              type="email"
              readOnly
              aria-describedby="email-help"
            />
            <p id="email-help" className="settings-help">O e-mail da conta não pode ser alterado nesta versão.</p>
          </div>

          <div className="settings-actions">
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || name.trim() === (user?.name ?? "")}>Salvar alterações</Button>
          </div>
        </form>
      </section>

      <section className="settings-section" aria-labelledby="account-heading">
        <div className="settings-section-heading">
          <h2 id="account-heading">Conta</h2>
          <p>Informações da conta.</p>
        </div>
        <div className="settings-card settings-account-card">
          <div><span className="settings-account-label">E-mail da conta</span><strong>{user?.email}</strong></div>
          <div><span className="settings-account-label">Status da conta</span><strong className="settings-status">Ativa</strong></div>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="preferences-heading">
        <div className="settings-section-heading">
          <h2 id="preferences-heading">Preferências</h2>
          <p>Escolhas que personalizam sua experiência no WorkZen.</p>
        </div>
        <div className="settings-card settings-future-card">
          <ThemePreference theme={theme} onThemeChange={setTheme} />
          <FuturePreference title="Notificações" description="Controle de lembretes e avisos em breve." />
        </div>
      </section>
    </div>
  );
}

function ThemePreference({ theme, onThemeChange }: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  return (
    <div className="settings-future-item settings-theme-item">
      <div>
        <strong>Tema</strong>
        <span>Escolha como o WorkZen aparece para você.</span>
      </div>
      <div className="theme-selector" role="group" aria-label="Tema">
        <ThemeOption label="Escuro" theme="dark" selectedTheme={theme} onThemeChange={onThemeChange} />
        <ThemeOption label="Claro" theme="light" selectedTheme={theme} onThemeChange={onThemeChange} />
      </div>
    </div>
  );
}

function ThemeOption({ label, theme, selectedTheme, onThemeChange }: { label: string; theme: Theme; selectedTheme: Theme; onThemeChange: (theme: Theme) => void }) {
  const isSelected = selectedTheme === theme;
  return (
    <button
      type="button"
      className={`theme-option${isSelected ? " is-selected" : ""}`}
      aria-pressed={isSelected}
      onClick={() => onThemeChange(theme)}
    >
      <span className="theme-option-indicator" aria-hidden="true">{isSelected ? "✓" : ""}</span>
      {label}
      {isSelected && <span className="sr-only"> selecionado</span>}
    </button>
  );
}

function FuturePreference({ title, description }: { title: string; description: string }) {
  return (
    <div className="settings-future-item" aria-disabled="true">
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <span className="settings-future-label">Em breve</span>
    </div>
  );
}

function getInitials(name?: string): string {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return `${words[0].charAt(0)}${words.at(-1)?.charAt(0) ?? ""}`.toUpperCase();
}

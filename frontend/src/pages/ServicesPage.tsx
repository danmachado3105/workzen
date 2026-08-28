import { useEffect, useState, type FormEvent } from "react";
import {
  listServices,
  createService,
  updateService,
  deleteService,
} from "../api/services";
import type { Service } from "../types";
import { isAxiosError } from "axios";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

const emptyForm = { name: "", price: "", duration_minutes: "" };

export function ServicesPage() {
  const { showToast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingDeactivate, setPendingDeactivate] = useState<Service | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  async function loadServices() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listServices();
      setServices(data);
    } catch {
      setError("Não foi possível carregar os serviços.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      price: service.price,
      duration_minutes: String(service.duration_minutes),
    });
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      name: form.name,
      price: form.price,
      duration_minutes: Number(form.duration_minutes),
    };

    try {
      if (editingId !== null) {
        await updateService(editingId, payload);
        showToast("Serviço atualizado com sucesso.", "success");
      } else {
        await createService(payload);
        showToast("Serviço criado com sucesso.", "success");
      }
      closeForm();
      await loadServices();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        setFormError(
          "Verifique os dados: nome não pode ser vazio, preço e duração devem ser maiores que zero."
        );
      } else {
        setFormError("Não foi possível salvar o serviço. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDeactivate() {
    if (!pendingDeactivate) return;
    setIsDeactivating(true);
    try {
      await deleteService(pendingDeactivate.id);
      showToast("Serviço desativado com sucesso.", "success");
      setPendingDeactivate(null);
      await loadServices();
    } catch {
      showToast("Não foi possível desativar o serviço.", "error");
    } finally {
      setIsDeactivating(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Serviços</h1>
        <Button onClick={openCreateForm}>Novo serviço</Button>
      </div>

      {isFormOpen && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <h2 className="inline-form-title">
            {editingId !== null ? "Editar serviço" : "Novo serviço"}
          </h2>

          {formError && <div className="auth-error">{formError}</div>}

          <div className="form-row">
            <label className="form-label" htmlFor="name">
              Nome
            </label>
            <input
              id="name"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row-group">
            <div className="form-row">
              <label className="form-label" htmlFor="price">
                Preço (R$)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="duration">
                Duração (minutos)
              </label>
              <input
                id="duration"
                type="number"
                min="1"
                className="form-input"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <Button variant="secondary" type="button" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
      )}

      {isLoading && <Spinner label="Carregando serviços..." />}

      {error && <p className="dashboard-status dashboard-status-error">{error}</p>}

      {!isLoading && !error && services.length === 0 && (
        <EmptyState
          title="Nenhum serviço cadastrado ainda"
          description="Cadastre os serviços que você oferece para começar a criar agendamentos."
          action={<Button onClick={openCreateForm}>Criar primeiro serviço</Button>}
        />
      )}

      {!isLoading && !error && services.length > 0 && (
        <div className="data-table">
          {services.map((service) => (
            <div className="data-row" key={service.id}>
              <div className="data-row-main">
                <span className="data-row-title">{service.name}</span>
                <span className="data-row-subtitle">
                  {formatCurrency(service.price)} · {service.duration_minutes} min
                </span>
              </div>
              <div className="data-row-actions">
                <Button variant="secondary" onClick={() => openEditForm(service)}>
                  Editar
                </Button>
                <Button variant="danger" onClick={() => setPendingDeactivate(service)}>
                  Desativar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDeactivate !== null}
        title="Desativar serviço"
        description={
          pendingDeactivate
            ? `Tem certeza que deseja desativar "${pendingDeactivate.name}"? Ele deixará de aparecer na sua lista de serviços ativos.`
            : ""
        }
        confirmLabel="Desativar"
        isConfirming={isDeactivating}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}

function formatCurrency(value: string): string {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
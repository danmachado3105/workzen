import { useEffect, useState, type FormEvent } from "react";
import {
  listServices,
  createService,
  updateService,
  deleteService,
} from "../api/services";
import type { Service } from "../types";
import { isAxiosError } from "axios";

const emptyForm = { name: "", price: "", duration_minutes: "" };

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      } else {
        await createService(payload);
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

  async function handleDelete(service: Service) {
    const confirmed = window.confirm(
      `Desativar o serviço "${service.name}"?`
    );
    if (!confirmed) return;

    try {
      await deleteService(service.id);
      await loadServices();
    } catch {
      setError("Não foi possível desativar o serviço.");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Serviços</h1>
        <button className="primary-button" onClick={openCreateForm}>
          Novo serviço
        </button>
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
            <button type="button" className="secondary-button" onClick={closeForm}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      )}

      {isLoading && <p className="dashboard-status">Carregando serviços...</p>}

      {error && <p className="dashboard-status dashboard-status-error">{error}</p>}

      {!isLoading && !error && services.length === 0 && (
        <p className="dashboard-empty">Nenhum serviço cadastrado ainda.</p>
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
                <button className="secondary-button" onClick={() => openEditForm(service)}>
                  Editar
                </button>
                <button className="danger-button" onClick={() => handleDelete(service)}>
                  Desativar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: string): string {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
import { useEffect, useState, type FormEvent } from "react";
import { listClients, createClient, updateClient, deleteClient } from "../api/clients";
import type { Client } from "../types";
import { isAxiosError } from "axios";

const emptyForm = { name: "", phone: "", email: "", notes: "" };

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadClients() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listClients();
      setClients(data);
    } catch {
      setError("Não foi possível carregar os clientes.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(client: Client) {
    setEditingId(client.id);
    setForm({
      name: client.name,
      phone: client.phone,
      email: client.email ?? "",
      notes: client.notes ?? "",
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
      phone: form.phone,
      email: form.email.trim() === "" ? null : form.email,
      notes: form.notes.trim() === "" ? null : form.notes,
    };

    try {
      if (editingId !== null) {
        await updateClient(editingId, payload);
      } else {
        await createClient(payload);
      }
      closeForm();
      await loadClients();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        setFormError("Verifique os dados informados (nome, telefone e email).");
      } else {
        setFormError("Não foi possível salvar o cliente. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(client: Client) {
    const confirmed = window.confirm(
      `Remover ${client.name} da lista de clientes ativos?`
    );
    if (!confirmed) return;

    try {
      await deleteClient(client.id);
      await loadClients();
    } catch {
      setError("Não foi possível remover o cliente.");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <button className="primary-button" onClick={openCreateForm}>
          Novo cliente
        </button>
      </div>

      {isFormOpen && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <h2 className="inline-form-title">
            {editingId !== null ? "Editar cliente" : "Novo cliente"}
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

          <div className="form-row">
            <label className="form-label" htmlFor="phone">
              Telefone
            </label>
            <input
              id="phone"
              className="form-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="email">
              Email (opcional)
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="notes">
              Observações (opcional)
            </label>
            <textarea
              id="notes"
              className="form-input"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
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

      {isLoading && <p className="dashboard-status">Carregando clientes...</p>}

      {error && <p className="dashboard-status dashboard-status-error">{error}</p>}

      {!isLoading && !error && clients.length === 0 && (
        <p className="dashboard-empty">Nenhum cliente cadastrado ainda.</p>
      )}

      {!isLoading && !error && clients.length > 0 && (
        <div className="data-table">
          {clients.map((client) => (
            <div className="data-row" key={client.id}>
              <div className="data-row-main">
                <span className="data-row-title">{client.name}</span>
                <span className="data-row-subtitle">{client.phone}</span>
                {client.email && (
                  <span className="data-row-subtitle">{client.email}</span>
                )}
              </div>
              <div className="data-row-actions">
                <button className="secondary-button" onClick={() => openEditForm(client)}>
                  Editar
                </button>
                <button
                  className="danger-button"
                  onClick={() => handleDelete(client)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
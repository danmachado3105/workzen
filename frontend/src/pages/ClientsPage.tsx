import { useEffect, useMemo, useState, type FormEvent } from "react";
import { listClients, createClient, updateClient, deleteClient } from "../api/clients";
import type { Client } from "../types";
import { isAxiosError } from "axios";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

const emptyForm = { name: "", phone: "", email: "", notes: "" };

export function ClientsPage() {
  const { showToast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");

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

  const filteredClients = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase("pt-BR");
    if (!searchTerm) return clients;
    return clients.filter((client) => [client.name, client.phone, client.email ?? ""].some((value) => value.toLocaleLowerCase("pt-BR").includes(searchTerm)));
  }, [clients, search]);

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
        showToast("Cliente atualizado com sucesso.", "success");
      } else {
        await createClient(payload);
        showToast("Cliente criado com sucesso.", "success");
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

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteClient(pendingDelete.id);
      showToast("Cliente removido com sucesso.", "success");
      setPendingDelete(null);
      await loadClients();
    } catch {
      showToast("Não foi possível remover o cliente.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header management-page-header">
        <div><p className="dashboard-eyebrow">Base de clientes</p><h1 className="page-title">Clientes</h1><p className="management-header-description">{clients.length} cliente{clients.length === 1 ? " ativo" : "s ativos"} na sua operação.</p></div>
        <Button onClick={openCreateForm}>Novo cliente</Button>
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
            <Button variant="secondary" type="button" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
      )}

      {isLoading && <Spinner label="Carregando clientes..." />}

      {error && <p className="dashboard-status dashboard-status-error">{error}</p>}

      {!isLoading && !error && clients.length === 0 && (
        <EmptyState
          title="Nenhum cliente cadastrado ainda"
          description="Cadastre seu primeiro cliente para começar a organizar sua base."
          action={<Button onClick={openCreateForm}>Criar primeiro cliente</Button>}
        />
      )}

      {!isLoading && !error && clients.length > 0 && (
        <>
          <div className="management-toolbar">
            <label className="management-search"><span className="sr-only">Buscar clientes</span><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, telefone ou e-mail" /></label>
            <span className="management-result-count">{filteredClients.length} de {clients.length}</span>
          </div>
          {filteredClients.length === 0 ? <div className="management-no-results"><strong>Nenhum cliente encontrado</strong><span>Experimente buscar por outro nome, telefone ou e-mail.</span><Button variant="ghost" onClick={() => setSearch("")}>Limpar busca</Button></div> : <div className="data-table management-list">
          {filteredClients.map((client) => (
            <div className="data-row management-row" key={client.id}>
              <div className="data-row-main">
                <span className="entity-avatar" aria-hidden="true">{getInitials(client.name)}</span>
                <span className="entity-content"><span className="data-row-title">{client.name}</span><span className="data-row-subtitle">{client.phone}{client.email ? ` · ${client.email}` : ""}</span></span>
              </div>
              <div className="data-row-actions">
                <Button variant="secondary" onClick={() => openEditForm(client)}>
                  Editar
                </Button>
                <Button variant="danger" onClick={() => setPendingDelete(client)}>
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>}
        </>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Remover cliente"
        description={
          pendingDelete
            ? `Tem certeza que deseja remover "${pendingDelete.name}"? Ele deixará de aparecer na sua lista de clientes ativos.`
            : ""
        }
        confirmLabel="Remover"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length > 1 ? `${words[0][0]}${words.at(-1)?.[0] ?? ""}`.toUpperCase() : words[0]?.[0]?.toUpperCase() ?? "?";
}

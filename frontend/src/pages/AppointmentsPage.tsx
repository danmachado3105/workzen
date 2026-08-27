import { useEffect, useState, type FormEvent } from "react";
import {
  listAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} from "../api/appointments";
import { listClients } from "../api/clients";
import { listServices } from "../api/services";
import type { Appointment, Client, Service, PaymentStatus } from "../types";
import { isAxiosError } from "axios";

const emptyForm = {
  client_id: "",
  service_id: "",
  scheduled_at: "",
  amount_charged: "",
  payment_status: "pending" as PaymentStatus,
};

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadAll() {
    setIsLoading(true);
    setError(null);
    try {
      const [appointmentsData, clientsData, servicesData] = await Promise.all([
        listAppointments(),
        listClients(),
        listServices(),
      ]);
      setAppointments(appointmentsData);
      setClients(clientsData);
      setServices(servicesData);
    } catch {
      setError("Não foi possível carregar os agendamentos.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function findClientName(id: number): string {
    return clients.find((c) => c.id === id)?.name ?? "Cliente removido";
  }

  function findServiceName(id: number): string {
    return services.find((s) => s.id === id)?.name ?? "Serviço removido";
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(appointment: Appointment) {
    setEditingId(appointment.id);
    setForm({
      client_id: String(appointment.client_id),
      service_id: String(appointment.service_id),
      scheduled_at: toDatetimeLocalValue(appointment.scheduled_at),
      amount_charged: appointment.amount_charged,
      payment_status: appointment.payment_status,
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

  function handleServiceChange(serviceId: string) {
    const service = services.find((s) => s.id === Number(serviceId));
    setForm({
      ...form,
      service_id: serviceId,
      amount_charged: service ? service.price : form.amount_charged,
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingId !== null) {
        await updateAppointment(editingId, {
          scheduled_at: toIsoString(form.scheduled_at),
          amount_charged: form.amount_charged,
          payment_status: form.payment_status,
        });
      } else {
        await createAppointment({
          client_id: Number(form.client_id),
          service_id: Number(form.service_id),
          scheduled_at: toIsoString(form.scheduled_at),
          amount_charged: form.amount_charged || undefined,
        });
      }
      closeForm();
      await loadAll();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setFormError("Cliente ou serviço inválido.");
      } else if (isAxiosError(err) && err.response?.status === 422) {
        setFormError("Verifique os dados: todos os campos obrigatórios e o valor cobrado maior que zero.");
      } else {
        setFormError("Não foi possível salvar o agendamento. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(appointment: Appointment) {
    const confirmed = window.confirm(
      `Cancelar o agendamento de ${formatDateTime(appointment.scheduled_at)}?`
    );
    if (!confirmed) return;

    try {
      await cancelAppointment(appointment.id);
      await loadAll();
    } catch {
      setError("Não foi possível cancelar o agendamento.");
    }
  }

  const hasClientsAndServices = clients.length > 0 && services.length > 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Agendamentos</h1>
        <button
          className="primary-button"
          onClick={openCreateForm}
          disabled={!hasClientsAndServices}
          title={!hasClientsAndServices ? "Cadastre ao menos um cliente e um serviço primeiro" : undefined}
        >
          Novo agendamento
        </button>
      </div>

      {!hasClientsAndServices && !isLoading && (
        <p className="dashboard-empty">
          Cadastre pelo menos um cliente e um serviço antes de criar agendamentos.
        </p>
      )}

      {isFormOpen && (
        <form className="inline-form" onSubmit={handleSubmit}>
          <h2 className="inline-form-title">
            {editingId !== null ? "Editar agendamento" : "Novo agendamento"}
          </h2>

          {formError && <div className="auth-error">{formError}</div>}

          {editingId === null && (
            <>
              <div className="form-row">
                <label className="form-label" htmlFor="client">
                  Cliente
                </label>
                <select
                  id="client"
                  className="form-input"
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                  required
                >
                  <option value="" disabled>
                    Selecione um cliente
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="service">
                  Serviço
                </label>
                <select
                  id="service"
                  className="form-input"
                  value={form.service_id}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Selecione um serviço
                  </option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="form-row-group">
            <div className="form-row">
              <label className="form-label" htmlFor="scheduled_at">
                Data e horário
              </label>
              <input
                id="scheduled_at"
                type="datetime-local"
                className="form-input"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="amount_charged">
                Valor cobrado (R$)
              </label>
              <input
                id="amount_charged"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                value={form.amount_charged}
                onChange={(e) => setForm({ ...form, amount_charged: e.target.value })}
              />
            </div>
          </div>

          {editingId !== null && (
            <div className="form-row">
              <label className="form-label" htmlFor="payment_status">
                Status do pagamento
              </label>
              <select
                id="payment_status"
                className="form-input"
                value={form.payment_status}
                onChange={(e) =>
                  setForm({ ...form, payment_status: e.target.value as PaymentStatus })
                }
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
              </select>
            </div>
          )}

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

      {isLoading && <p className="dashboard-status">Carregando agendamentos...</p>}

      {error && <p className="dashboard-status dashboard-status-error">{error}</p>}

      {!isLoading && !error && appointments.length === 0 && (
        <p className="dashboard-empty">Nenhum agendamento cadastrado ainda.</p>
      )}

      {!isLoading && !error && appointments.length > 0 && (
        <div className="data-table">
          {appointments.map((appointment) => (
            <div className="data-row" key={appointment.id}>
              <div className="data-row-main">
                <span className="data-row-title">
                  {findClientName(appointment.client_id)} · {findServiceName(appointment.service_id)}
                </span>
                <span className="data-row-subtitle">
                  {formatDateTime(appointment.scheduled_at)} · {formatCurrency(appointment.amount_charged)}
                </span>
                <div className="badge-group">
                  <StatusBadge status={appointment.status} />
                  <PaymentBadge status={appointment.payment_status} />
                </div>
              </div>
              <div className="data-row-actions">
                {appointment.status === "scheduled" && (
                  <>
                    <button
                      className="secondary-button"
                      onClick={() => openEditForm(appointment)}
                    >
                      Editar
                    </button>
                    <button
                      className="danger-button"
                      onClick={() => handleCancel(appointment)}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const labels: Record<Appointment["status"], string> = {
    scheduled: "Agendado",
    completed: "Concluído",
    canceled: "Cancelado",
  };
  return <span className={`badge badge-status-${status}`}>{labels[status]}</span>;
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const labels: Record<PaymentStatus, string> = {
    pending: "Pendente",
    paid: "Pago",
  };
  return <span className={`badge badge-payment-${status}`}>{labels[status]}</span>;
}

function formatCurrency(value: string): string {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocalValue(isoString: string): string {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoString(datetimeLocalValue: string): string {
  return new Date(datetimeLocalValue).toISOString();
}
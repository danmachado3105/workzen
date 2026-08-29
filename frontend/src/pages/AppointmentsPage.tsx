import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  listAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} from "../api/appointments";
import { listClients } from "../api/clients";
import { listServices } from "../api/services";
import type { Appointment, AppointmentStatus, Client, Service, PaymentStatus } from "../types";
import { isAxiosError } from "axios";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

const emptyForm = {
  client_id: "",
  service_id: "",
  scheduled_at: "",
  amount_charged: "",
  payment_status: "pending" as PaymentStatus,
};

type AgendaScope = "day" | "upcoming" | "all";
type StatusFilter = "all" | AppointmentStatus;

export function AppointmentsPage() {
  const { showToast } = useToast();

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

  const [pendingCancel, setPendingCancel] = useState<Appointment | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [scope, setScope] = useState<AgendaScope>("day");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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
        showToast("Agendamento atualizado com sucesso.", "success");
      } else {
        await createAppointment({
          client_id: Number(form.client_id),
          service_id: Number(form.service_id),
          scheduled_at: toIsoString(form.scheduled_at),
          amount_charged: form.amount_charged || undefined,
        });
        showToast("Agendamento criado com sucesso.", "success");
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

  async function handleConfirmCancel() {
    if (!pendingCancel) return;
    setIsCanceling(true);
    try {
      await cancelAppointment(pendingCancel.id);
      showToast("Agendamento cancelado com sucesso.", "success");
      setPendingCancel(null);
      setSelectedAppointment(null);
      await loadAll();
    } catch {
      showToast("Não foi possível cancelar o agendamento.", "error");
    } finally {
      setIsCanceling(false);
    }
  }

  const hasClientsAndServices = clients.length > 0 && services.length > 0;
  const visibleAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((appointment) => {
        const date = new Date(appointment.scheduled_at);
        const matchesScope = scope === "all"
          || (scope === "upcoming" && date >= now)
          || (scope === "day" && isSameDay(date, selectedDate));
        const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
        return matchesScope && matchesStatus;
      })
      .sort((first, second) => new Date(first.scheduled_at).getTime() - new Date(second.scheduled_at).getTime());
  }, [appointments, scope, selectedDate, statusFilter]);
  const appointmentGroups = useMemo(() => groupAppointmentsByDate(visibleAppointments), [visibleAppointments]);

  function showToday() {
    setScope("day");
    setSelectedDate(startOfDay(new Date()));
  }

  function moveDay(amount: number) {
    setScope("day");
    setSelectedDate((current) => addDays(current, amount));
  }

  return (
    <div className="page">
      <div className="page-header agenda-page-header">
        <div>
          <p className="dashboard-eyebrow">Agenda</p>
          <h1 className="page-title">Agendamentos</h1>
          <p className="agenda-header-description">Organize seus atendimentos, pagamentos e próximos horários.</p>
        </div>
        <Button
          onClick={openCreateForm}
          disabled={!hasClientsAndServices}
          title={!hasClientsAndServices ? "Cadastre ao menos um cliente e um serviço primeiro" : undefined}
        >
          Novo agendamento
        </Button>
      </div>

      {!hasClientsAndServices && !isLoading && <div className="agenda-setup-hint">Cadastre pelo menos um cliente e um serviço antes de criar agendamentos.</div>}

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
            <Button variant="secondary" type="button" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
      )}

      {isLoading && <Spinner label="Organizando sua agenda..." />}

      {error && <p className="dashboard-status dashboard-status-error">{error}</p>}

      {!isLoading && !error && appointments.length === 0 && hasClientsAndServices && (
        <EmptyState
          title="Sua agenda está pronta para começar"
          description="Crie o primeiro horário para acompanhar clientes, serviços e pagamentos por aqui."
          action={<Button onClick={openCreateForm}>Criar primeiro agendamento</Button>}
        />
      )}

      {!isLoading && !error && appointments.length > 0 && (
        <div className="agenda-workspace">
          <div className="agenda-toolbar" aria-label="Controles da agenda">
            <div className="agenda-scope-control" role="group" aria-label="Período exibido">
              <button type="button" className={scope === "day" ? "agenda-scope-button active" : "agenda-scope-button"} onClick={showToday}>Hoje</button>
              <button type="button" className={scope === "upcoming" ? "agenda-scope-button active" : "agenda-scope-button"} onClick={() => setScope("upcoming")}>Próximos</button>
              <button type="button" className={scope === "all" ? "agenda-scope-button active" : "agenda-scope-button"} onClick={() => setScope("all")}>Todos</button>
            </div>
            <label className="agenda-filter">
              <span>Estado</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                <option value="all">Todos</option>
                <option value="scheduled">Agendados</option>
                <option value="completed">Concluídos</option>
                <option value="canceled">Cancelados</option>
              </select>
            </label>
          </div>

          {scope === "day" && (
            <div className="agenda-day-navigation">
              <button type="button" className="agenda-day-button" onClick={() => moveDay(-1)} aria-label="Ver dia anterior">←</button>
              <div><strong>{formatAgendaDate(selectedDate)}</strong><span>{isSameDay(selectedDate, new Date()) ? "Hoje" : `${visibleAppointments.length} horário${visibleAppointments.length === 1 ? "" : "s"}`}</span></div>
              <button type="button" className="agenda-day-button" onClick={() => moveDay(1)} aria-label="Ver próximo dia">→</button>
            </div>
          )}

          {visibleAppointments.length === 0 ? (
            <div className="agenda-filter-empty">
              <strong>Nenhum agendamento encontrado</strong>
              <span>{scope === "day" ? "Escolha outro dia ou crie um novo horário." : "Ajuste os filtros para visualizar outros atendimentos."}</span>
              {scope === "day" && <Button variant="secondary" onClick={() => setScope("upcoming")}>Ver próximos horários</Button>}
            </div>
          ) : (
            <div className="agenda-groups">
              {appointmentGroups.map(([dateKey, group]) => (
                <section className="agenda-group" key={dateKey} aria-labelledby={`agenda-date-${dateKey}`}>
                  <div className="agenda-group-heading"><h2 id={`agenda-date-${dateKey}`}>{formatGroupDate(group[0].scheduled_at)}</h2><span>{group.length} atendimento{group.length === 1 ? "" : "s"}</span></div>
                  <div className="agenda-list">
                    {group.map((appointment) => (
                      <article className={`agenda-appointment agenda-appointment-${appointment.status}`} key={appointment.id}>
                        <button type="button" className="agenda-appointment-summary" onClick={() => setSelectedAppointment(appointment)} aria-label={`Ver detalhes do agendamento de ${findClientName(appointment.client_id)}`}>
                          <time dateTime={appointment.scheduled_at}>{formatTime(appointment.scheduled_at)}</time>
                          <span className="agenda-appointment-divider" aria-hidden="true" />
                          <span className="agenda-appointment-main"><strong>{findClientName(appointment.client_id)}</strong><span>{findServiceName(appointment.service_id)} · {formatCurrency(appointment.amount_charged)}</span></span>
                          <span className="badge-group"><StatusBadge status={appointment.status} /><PaymentBadge status={appointment.payment_status} /></span>
                        </button>
                        {appointment.status === "scheduled" && <div className="agenda-appointment-actions"><Button variant="ghost" onClick={() => openEditForm(appointment)}>Editar</Button><Button variant="ghost" onClick={() => setPendingCancel(appointment)}>Cancelar</Button></div>}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingCancel !== null}
        title="Cancelar agendamento"
        description={
          pendingCancel
            ? `Tem certeza que deseja cancelar o agendamento de ${formatDateTime(pendingCancel.scheduled_at)}? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Cancelar agendamento"
        isConfirming={isCanceling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setPendingCancel(null)}
      />

      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        clientName={selectedAppointment ? findClientName(selectedAppointment.client_id) : ""}
        serviceName={selectedAppointment ? findServiceName(selectedAppointment.service_id) : ""}
        onClose={() => setSelectedAppointment(null)}
        onEdit={() => { if (selectedAppointment) { setSelectedAppointment(null); openEditForm(selectedAppointment); } }}
        onCancel={() => { if (selectedAppointment) { setSelectedAppointment(null); setPendingCancel(selectedAppointment); } }}
      />
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

function AppointmentDetailsDialog({ appointment, clientName, serviceName, onClose, onEdit, onCancel }: { appointment: Appointment | null; clientName: string; serviceName: string; onClose: () => void; onEdit: () => void; onCancel: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!appointment) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusableElements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []);
      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [appointment, onClose]);

  if (!appointment) return null;
  return <div className="dialog-overlay" role="presentation" onClick={onClose}><div ref={dialogRef} className="dialog-card agenda-details-dialog" role="dialog" aria-modal="true" aria-labelledby="appointment-details-title" aria-describedby="appointment-details-summary" onClick={(event) => event.stopPropagation()}><div className="agenda-details-heading"><div><p className="dashboard-eyebrow">Agendamento</p><h2 id="appointment-details-title">{clientName}</h2></div><button ref={closeButtonRef} type="button" className="agenda-details-close" onClick={onClose} aria-label="Fechar detalhes">×</button></div><p id="appointment-details-summary" className="sr-only">Detalhes do agendamento de {clientName}.</p><div className="agenda-details-list"><div><span>Quando</span><strong>{formatDateTime(appointment.scheduled_at)}</strong></div><div><span>Serviço</span><strong>{serviceName}</strong></div><div><span>Valor</span><strong>{formatCurrency(appointment.amount_charged)}</strong></div><div><span>Status</span><span className="badge-group"><StatusBadge status={appointment.status} /><PaymentBadge status={appointment.payment_status} /></span></div></div>{appointment.status === "scheduled" && <div className="dialog-actions"><Button variant="secondary" onClick={onEdit}>Editar</Button><Button variant="danger" onClick={onCancel}>Cancelar agendamento</Button></div>}</div></div>;
}

function startOfDay(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function addDays(date: Date, amount: number): Date { const next = new Date(date); next.setDate(next.getDate() + amount); return next; }
function isSameDay(first: Date, second: Date): boolean { return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate(); }
function groupAppointmentsByDate(appointments: Appointment[]): [string, Appointment[]][] { return Object.entries(appointments.reduce<Record<string, Appointment[]>>((groups, appointment) => { const key = startOfDay(new Date(appointment.scheduled_at)).toISOString(); (groups[key] ??= []).push(appointment); return groups; }, {})); }
function formatTime(isoString: string): string { return new Date(isoString).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
function formatAgendaDate(date: Date): string { return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }); }
function formatGroupDate(isoString: string): string { const date = new Date(isoString); return isSameDay(date, new Date()) ? "Hoje" : date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }); }

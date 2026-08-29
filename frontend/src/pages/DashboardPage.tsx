import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cancelAppointment, listAppointments, updateAppointment } from "../api/appointments";
import { listClients } from "../api/clients";
import { listServices } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { Appointment, AppointmentStatus, Client, PaymentStatus, Service } from "../types";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";

type PeriodKey = "today" | "week" | "month" | "30days";

const periods: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "week", label: "7 dias" },
  { key: "month", label: "Este mês" },
  { key: "30days", label: "30 dias" },
];

interface ChartPoint {
  label: string;
  revenue: number;
  appointments: number;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<Appointment | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(null);

  async function loadDashboard() {
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
      setError("Não foi possível carregar os dados do dashboard.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const appointmentsInPeriod = useMemo(
    () =>
      appointments.filter((appointment) => {
        const date = new Date(appointment.scheduled_at);
        return date >= range.start && date < range.end;
      }),
    [appointments, range]
  );
  const upcoming = useMemo(
    () =>
      appointmentsInPeriod
        .filter(
          (appointment) =>
            appointment.status === "scheduled" &&
            new Date(appointment.scheduled_at) >= new Date()
        )
        .sort(
          (first, second) =>
            new Date(first.scheduled_at).getTime() - new Date(second.scheduled_at).getTime()
        )
        .slice(0, 5),
    [appointmentsInPeriod]
  );
  const chartData = useMemo(
    () => makeChartData(appointmentsInPeriod, range.start, range.end),
    [appointmentsInPeriod, range]
  );

  const paidAppointments = appointmentsInPeriod.filter(
    (appointment) => appointment.payment_status === "paid"
  );
  const revenue = paidAppointments.reduce(
    (total, appointment) => total + Number(appointment.amount_charged),
    0
  );
  const statusCounts = countStatuses(appointmentsInPeriod);
  const completionRate =
    appointmentsInPeriod.length === 0
      ? null
      : Math.round((statusCounts.completed / appointmentsInPeriod.length) * 100);

  async function handleMarkAsPaid(appointment: Appointment) {
    setProcessingPaymentId(appointment.id);
    try {
      await updateAppointment(appointment.id, { payment_status: "paid" });
      showToast("Pagamento marcado como pago.", "success");
      await loadDashboard();
    } catch {
      showToast("Não foi possível atualizar o pagamento.", "error");
    } finally {
      setProcessingPaymentId(null);
    }
  }

  async function handleCancel() {
    if (!pendingCancel) return;
    setIsCanceling(true);
    try {
      await cancelAppointment(pendingCancel.id);
      showToast("Agendamento cancelado.", "success");
      setPendingCancel(null);
      await loadDashboard();
    } catch {
      showToast("Não foi possível cancelar o agendamento.", "error");
    } finally {
      setIsCanceling(false);
    }
  }

  if (isLoading) return <Spinner label="Organizando a visão do seu negócio..." />;
  if (error) return <div className="dashboard-status dashboard-status-error">{error}</div>;

  return (
    <div className="dashboard dashboard-command-center">
      <header className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Visão geral</p>
          <h1 className="dashboard-title">{getGreeting(user?.email)}</h1>
          <p className="dashboard-subtitle">Acompanhe agenda, pagamentos e operação em um só lugar.</p>
        </div>
        <div className="dashboard-hero-actions">
          <div className="period-control" aria-label="Período do dashboard">
            {periods.map((option) => (
              <button key={option.key} type="button" className={period === option.key ? "period-button active" : "period-button"} onClick={() => setPeriod(option.key)}>
                {option.label}
              </button>
            ))}
          </div>
          <Button onClick={() => navigate("/appointments")}>Novo agendamento</Button>
        </div>
      </header>

      <section className="dashboard-overview-grid" aria-label="Resumo do período">
        <article className="revenue-overview-card">
          <div className="metric-card-topline">
            <span>Receita recebida</span>
            <span className="metric-period-label">{getPeriodLabel(period)}</span>
          </div>
          <strong className="revenue-overview-value">{formatCurrency(revenue)}</strong>
          <p className="metric-supporting-text">
            {paidAppointments.length === 0
              ? "Nenhum pagamento registrado neste período."
              : `${paidAppointments.length} pagamento${paidAppointments.length === 1 ? "" : "s"} confirmado${paidAppointments.length === 1 ? "" : "s"}.`}
          </p>
          <div className="revenue-overview-footer">
            <span className="live-indicator">Dados atualizados</span>
            <span>{appointmentsInPeriod.length} agendamento{appointmentsInPeriod.length === 1 ? "" : "s"}</span>
          </div>
        </article>
        <MetricCard label="Agendados" value={statusCounts.scheduled} detail={`${upcoming.length} próximo${upcoming.length === 1 ? "" : "s"}`} tone="info" />
        <MetricCard label="Concluídos" value={statusCounts.completed} detail={completionRate === null ? "Sem registros" : `${completionRate}% do período`} tone="success" />
        <MetricCard label="Cancelados" value={statusCounts.canceled} detail={appointmentsInPeriod.length === 0 ? "Sem registros" : "No período"} tone="error" />
      </section>

      <section className="dashboard-insights-grid">
        <article className="insight-panel chart-panel">
          <div className="panel-heading">
            <div><p className="panel-kicker">Fluxo financeiro</p><h2>Receita por dia</h2></div>
            <span className="panel-note">Pagamentos confirmados</span>
          </div>
          <RevenueChart data={chartData} />
        </article>
        <article className="insight-panel status-panel">
          <div className="panel-heading"><div><p className="panel-kicker">Agenda</p><h2>Status no período</h2></div></div>
          <StatusDistribution counts={statusCounts} total={appointmentsInPeriod.length} />
          <div className="business-inventory">
            <div><span className="inventory-value">{clients.length}</span><span>clientes ativos</span></div>
            <div><span className="inventory-value">{services.length}</span><span>serviços ativos</span></div>
          </div>
        </article>
      </section>

      <section className="dashboard-lower-grid">
        <article className="insight-panel upcoming-panel">
          <div className="panel-heading">
            <div><p className="panel-kicker">Agenda</p><h2>Próximos agendamentos</h2></div>
            <Button variant="ghost" onClick={() => navigate("/appointments")}>Ver agenda</Button>
          </div>
          {upcoming.length === 0 ? (
            <div className="compact-empty">Nenhum agendamento futuro em {getPeriodLabel(period).toLowerCase()}.</div>
          ) : (
            <div className="upcoming-list">
              {upcoming.map((appointment) => (
                <UpcomingAppointment
                  key={appointment.id}
                  appointment={appointment}
                  clientName={findClientName(clients, appointment.client_id)}
                  serviceName={findServiceName(services, appointment.service_id)}
                  isPaying={processingPaymentId === appointment.id}
                  onMarkAsPaid={() => handleMarkAsPaid(appointment)}
                  onCancel={() => setPendingCancel(appointment)}
                />
              ))}
            </div>
          )}
        </article>
        <aside className="quick-actions-panel">
          <p className="panel-kicker">Atalhos</p>
          <h2>Comece uma nova ação</h2>
          <p>Cadastre informações sem precisar navegar pela barra lateral.</p>
          <div className="quick-actions">
            <Button onClick={() => navigate("/appointments")}>Novo agendamento</Button>
            <Button variant="secondary" onClick={() => navigate("/clients")}>Novo cliente</Button>
            <Button variant="secondary" onClick={() => navigate("/services")}>Novo serviço</Button>
          </div>
        </aside>
      </section>

      {appointments.length === 0 && (
        <div className="dashboard-first-run">
          <EmptyState title="Sua operação começa por aqui" description="Cadastre clientes e serviços para criar seu primeiro agendamento." action={<Button onClick={() => navigate("/clients")}>Cadastrar cliente</Button>} />
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingCancel !== null}
        title="Cancelar agendamento"
        description={pendingCancel ? `Cancelar o horário de ${findClientName(clients, pendingCancel.client_id)} em ${formatDateTime(pendingCancel.scheduled_at)}?` : ""}
        confirmLabel="Cancelar agendamento"
        isConfirming={isCanceling}
        onConfirm={handleCancel}
        onCancel={() => setPendingCancel(null)}
      />
    </div>
  );
}

function MetricCard({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: "info" | "success" | "error" }) {
  return <article className={`metric-card metric-card-${tone}`}><span className="metric-card-label">{label}</span><strong>{value}</strong><span className="metric-card-detail">{detail}</span></article>;
}

function RevenueChart({ data }: { data: ChartPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  if (!data.some((point) => point.revenue > 0)) return <div className="chart-empty">Nenhum pagamento confirmado neste período.</div>;

  const width = 640;
  const height = 196;
  const padding = { top: 20, right: 14, bottom: 32, left: 14 };
  const maxValue = Math.max(...data.map((point) => point.revenue), 1);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const points = data.map((point, index) => {
    const x = data.length === 1 ? width / 2 : padding.left + (index / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (point.revenue / maxValue) * chartHeight;
    return { ...point, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${path} L ${points.at(-1)?.x ?? 0} ${height - padding.bottom} L ${points[0]?.x ?? 0} ${height - padding.bottom} Z`;
  const activePoint = activeIndex === null ? null : points[activeIndex];

  return (
    <div className="revenue-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Receita recebida por dia">
        <defs><linearGradient id="revenue-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.24" /><stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" /></linearGradient></defs>
        {[0.25, 0.5, 0.75].map((line) => <line key={line} className="chart-grid-line" x1={padding.left} x2={width - padding.right} y1={padding.top + chartHeight * line} y2={padding.top + chartHeight * line} />)}
        <path className="chart-area" d={areaPath} />
        <path className="chart-line" d={path} />
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle className={activeIndex === index ? "chart-point active" : "chart-point"} cx={point.x} cy={point.y} r={activeIndex === index ? 5 : 3.5} tabIndex={0} role="button" aria-label={`${point.label}: ${formatCurrency(point.revenue)}, ${point.appointments} agendamentos`} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} onBlur={() => setActiveIndex(null)} />
            {(index === 0 || index === points.length - 1 || points.length <= 8) && <text className="chart-axis-label" x={point.x} y={height - 9} textAnchor="middle">{point.label}</text>}
          </g>
        ))}
      </svg>
      {activePoint && <div className="chart-tooltip" style={{ left: `${(activePoint.x / width) * 100}%` }} role="status"><strong>{formatCurrency(activePoint.revenue)}</strong><span>{activePoint.label} · {activePoint.appointments} agendamento{activePoint.appointments === 1 ? "" : "s"}</span></div>}
    </div>
  );
}

function StatusDistribution({ counts, total }: { counts: Record<AppointmentStatus, number>; total: number }) {
  const items: { key: AppointmentStatus; label: string }[] = [{ key: "scheduled", label: "Agendados" }, { key: "completed", label: "Concluídos" }, { key: "canceled", label: "Cancelados" }];
  if (total === 0) return <div className="chart-empty">Ainda não há agendamentos neste período.</div>;
  return <><div className="status-bar" aria-label="Distribuição de status">{items.map((item) => counts[item.key] > 0 ? <span key={item.key} className={`status-bar-segment status-bar-${item.key}`} style={{ width: `${(counts[item.key] / total) * 100}%` }} title={`${item.label}: ${counts[item.key]}`} /> : null)}</div><div className="status-legend">{items.map((item) => <div key={item.key}><span className={`legend-dot legend-dot-${item.key}`} /><span>{item.label}</span><strong>{counts[item.key]}</strong></div>)}</div></>;
}

function UpcomingAppointment({ appointment, clientName, serviceName, isPaying, onMarkAsPaid, onCancel }: { appointment: Appointment; clientName: string; serviceName: string; isPaying: boolean; onMarkAsPaid: () => void; onCancel: () => void }) {
  return <article className="dashboard-appointment"><div className="appointment-time-block"><strong>{formatTime(appointment.scheduled_at)}</strong><span>{formatShortDate(appointment.scheduled_at)}</span></div><div className="dashboard-appointment-main"><strong>{clientName}</strong><span>{serviceName} · {formatCurrency(appointment.amount_charged)}</span></div><div className="dashboard-appointment-status"><StatusBadge status={appointment.status} /><PaymentBadge status={appointment.payment_status} /></div><div className="dashboard-appointment-actions">{appointment.payment_status === "pending" && <Button variant="secondary" isLoading={isPaying} onClick={onMarkAsPaid}>Marcar pago</Button>}<Button variant="ghost" onClick={onCancel}>Cancelar</Button></div></article>;
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const labels: Record<AppointmentStatus, string> = { scheduled: "Agendado", completed: "Concluído", canceled: "Cancelado" };
  return <span className={`badge badge-status-${status}`}>{labels[status]}</span>;
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={`badge badge-payment-${status}`}>{status === "paid" ? "Pago" : "Pendente"}</span>;
}

function getPeriodRange(period: PeriodKey): { start: Date; end: Date } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(startOfToday);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (period === "today") return { start: startOfToday, end: tomorrow };
  if (period === "week") { const end = new Date(startOfToday); end.setDate(end.getDate() + 7); return { start: startOfToday, end }; }
  if (period === "30days") { const start = new Date(startOfToday); start.setDate(start.getDate() - 29); return { start, end: tomorrow }; }
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
}

function makeChartData(appointments: Appointment[], start: Date, end: Date): ChartPoint[] {
  const data: ChartPoint[] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const key = toDateKey(cursor);
    const dayAppointments = appointments.filter((appointment) => toDateKey(new Date(appointment.scheduled_at)) === key);
    data.push({ label: cursor.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), revenue: dayAppointments.filter((appointment) => appointment.payment_status === "paid").reduce((total, appointment) => total + Number(appointment.amount_charged), 0), appointments: dayAppointments.length });
    cursor.setDate(cursor.getDate() + 1);
  }
  return data;
}

function countStatuses(appointments: Appointment[]): Record<AppointmentStatus, number> {
  return appointments.reduce<Record<AppointmentStatus, number>>((counts, appointment) => { counts[appointment.status] += 1; return counts; }, { scheduled: 0, completed: 0, canceled: 0 });
}
function toDateKey(date: Date): string { return [date.getFullYear(), date.getMonth(), date.getDate()].join("-"); }
function findClientName(clients: Client[], id: number): string { return clients.find((client) => client.id === id)?.name ?? "Cliente removido"; }
function findServiceName(services: Service[], id: number): string { return services.find((service) => service.id === id)?.name ?? "Serviço removido"; }
function getGreeting(email?: string): string { const hour = new Date().getHours(); const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"; const name = email?.split("@")[0]; return name ? `${greeting}, ${name}` : greeting; }
function getPeriodLabel(period: PeriodKey): string { return periods.find((item) => item.key === period)?.label ?? "Este mês"; }
function formatCurrency(value: number | string): string { return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function formatDateTime(value: string): string { return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
function formatTime(value: string): string { return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
function formatShortDate(value: string): string { return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }); }

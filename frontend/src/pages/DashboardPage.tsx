import { useEffect, useState } from "react";
import { getSummary, getUpcomingAppointments } from "../api/dashboard";
import type { DashboardSummary, Appointment } from "../types";

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryData, upcomingData] = await Promise.all([
          getSummary(),
          getUpcomingAppointments(),
        ]);
        setSummary(summaryData);
        setUpcoming(upcomingData);
      } catch {
        setError("Não foi possível carregar os dados do dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (isLoading) {
    return <p className="dashboard-status">Carregando dashboard...</p>;
  }

  if (error || !summary) {
    return <p className="dashboard-status dashboard-status-error">{error}</p>;
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Visão geral</h1>

      <div className="dashboard-grid">
        <DashboardCard label="Clientes ativos" value={summary.active_clients} />
        <DashboardCard label="Serviços ativos" value={summary.active_services} />
        <DashboardCard label="Agendamentos hoje" value={summary.appointments_today} />
        <DashboardCard label="Próximos agendamentos" value={summary.appointments_upcoming} />
        <DashboardCard label="Concluídos" value={summary.appointments_completed} />
        <DashboardCard label="Cancelados" value={summary.appointments_canceled} />
      </div>

      <div className="dashboard-revenue">
        <DashboardCard
          label="Faturamento total"
          value={formatCurrency(summary.revenue_total)}
        />
        <DashboardCard
          label="Faturamento no mês"
          value={formatCurrency(summary.revenue_current_month)}
        />
      </div>

      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Próximos agendamentos</h2>
        {upcoming.length === 0 ? (
          <p className="dashboard-empty">Nenhum agendamento futuro no momento.</p>
        ) : (
          <ul className="appointment-list">
            {upcoming.map((appointment) => (
              <li key={appointment.id} className="appointment-item">
                <span>{formatDateTime(appointment.scheduled_at)}</span>
                <span className="appointment-amount">
                  {formatCurrency(appointment.amount_charged)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DashboardCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="dashboard-card">
      <span className="dashboard-card-value">{value}</span>
      <span className="dashboard-card-label">{label}</span>
    </div>
  );
}

function formatCurrency(value: string): string {
  const numericValue = Number(value);
  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
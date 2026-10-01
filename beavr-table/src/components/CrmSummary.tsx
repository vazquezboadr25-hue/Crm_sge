"use client";

import Link from "next/link";
import { CrmOutcomeChart, CrmPipelineDoughnut, CrmStageBars } from "@/components/CrmCharts";
import { formatPrice } from "@/lib/crm/money";
import { STAGE_COLORS, STAGE_LABELS, STAGE_ORDER, type Stage } from "@/lib/crm/stages";

type SummaryOpportunity = {
  id: string;
  nombre: string;
  empresa: string;
  email: string;
  proyecto: string;
  detalles: string;
  precio: number | null;
  estado: Stage;
  creado_en: string;
};

const RECENT_LIMIT = 5;

export function CrmSummary({
  opportunities,
  loading,
  companyCount,
  employeeCount,
}: {
  opportunities: SummaryOpportunity[];
  loading: boolean;
  companyCount: number;
  employeeCount: number;
}) {
  const total = opportunities.length;
  const counts = STAGE_ORDER.reduce(
    (acc, stage) => {
      acc[stage] = opportunities.filter((opp) => opp.estado === stage).length;
      return acc;
    },
    {} as Record<Stage, number>,
  );

  const ganadas = counts.won;
  const perdidas = counts.lost;
  const cerradas = ganadas + perdidas;
  const abiertas = total - cerradas;
  const winRate = cerradas ? Math.round((ganadas / cerradas) * 100) : 0;

  const sumPrice = (items: SummaryOpportunity[]) =>
    items.reduce((acc, opp) => acc + (Number(opp.precio) || 0), 0);
  const openValue = sumPrice(opportunities.filter((opp) => opp.estado !== "won" && opp.estado !== "lost"));
  const wonValue = sumPrice(opportunities.filter((opp) => opp.estado === "won"));

  return (
    <section className="summary-page crm-summary" aria-label="Resumen general">
      <div className="crm-kpi-grid">
        <article className="crm-kpi">
          <span className="crm-kpi-label">Negociaciones</span>
          <strong>{total}</strong>
          <small>
            {abiertas} abiertas · {cerradas} cerradas
          </small>
        </article>
        <article className="crm-kpi crm-kpi-won">
          <span className="crm-kpi-label">Ganadas</span>
          <strong>{ganadas}</strong>
          <small>Tasa de éxito {winRate}%</small>
        </article>
        <article className="crm-kpi crm-kpi-lost">
          <span className="crm-kpi-label">Perdidas</span>
          <strong>{perdidas}</strong>
          <small>De {cerradas || 0} cerradas</small>
        </article>
        <article className="crm-kpi">
          <span className="crm-kpi-label">Cartera</span>
          <strong>{companyCount}</strong>
          <small>{employeeCount} empleados</small>
        </article>
      </div>

      <div className="crm-charts-grid">
        <article className="detail-card crm-card">
          <div className="crm-card-header">
            <h3>Embudo por estado</h3>
          </div>
          {loading ? (
            <div className="empty-column">Cargando...</div>
          ) : total === 0 ? (
            <div className="empty-column">Todavía no hay negociaciones</div>
          ) : (
            <CrmStageBars counts={counts} />
          )}
        </article>

        <article className="detail-card crm-card">
          <div className="crm-card-header">
            <h3>Distribución por estado</h3>
          </div>
          {loading ? (
            <div className="empty-column">Cargando...</div>
          ) : total === 0 ? (
            <div className="empty-column">Sin datos para mostrar</div>
          ) : (
            <CrmPipelineDoughnut
              values={counts}
              centerLabel={`${total}`}
              centerCaption="oportunidades"
            />
          )}
        </article>
      </div>

      <div className="crm-charts-grid">
        <article className="detail-card crm-card crm-outcome-card">
          <div className="crm-card-header">
            <h3>Resultado de negociaciones</h3>
          </div>
          <div className="crm-outcome">
            {loading ? (
              <div className="empty-column">Cargando...</div>
            ) : (
              <CrmOutcomeChart ganadas={ganadas} perdidas={perdidas} winRate={winRate} />
            )}
            <dl className="crm-value-grid">
              <div>
                <dt>En negociación</dt>
                <dd>{formatPrice(openValue)}</dd>
              </div>
              <div>
                <dt>Valor ganado</dt>
                <dd style={{ color: STAGE_COLORS.won.bar }}>{formatPrice(wonValue)}</dd>
              </div>
            </dl>
          </div>
        </article>

        <article className="detail-card crm-card crm-recent-card">
          <div className="crm-card-header">
            <h3>Últimas negociaciones</h3>
            <Link href="/?vista=oportunidades" className="back-link">
              Ver todas →
            </Link>
          </div>

          {loading ? (
            <div className="empty-column">Cargando...</div>
          ) : opportunities.length ? (
            <div className="crm-recent-list">
              {opportunities.slice(0, RECENT_LIMIT).map((opp) => (
                <Link key={opp.id} href={`/oportunidades/${opp.id}`} className="crm-recent-item">
                  <div className="crm-recent-main">
                    <strong>{opp.nombre}</strong>
                    <span>{opp.empresa || opp.proyecto || opp.email}</span>
                  </div>
                  <span className="crm-recent-price">{formatPrice(opp.precio) ?? "Sin precio"}</span>
                  <span
                    className="status-pill"
                    style={{
                      background: STAGE_COLORS[opp.estado].background,
                      color: STAGE_COLORS[opp.estado].color,
                    }}
                  >
                    {STAGE_LABELS[opp.estado]}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-column">No hay oportunidades todavía</div>
          )}
        </article>
      </div>
    </section>
  );
}

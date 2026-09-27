"use client";

import Link from "next/link";
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
  const maxCount = Math.max(...STAGE_ORDER.map((stage) => counts[stage]), 1);

  const sumPrice = (items: SummaryOpportunity[]) =>
    items.reduce((acc, opp) => acc + (Number(opp.precio) || 0), 0);
  const priced = opportunities.filter((opp) => opp.precio !== null && Number.isFinite(Number(opp.precio)));
  const openValue = sumPrice(opportunities.filter((opp) => opp.estado !== "won" && opp.estado !== "lost"));
  const wonValue = sumPrice(opportunities.filter((opp) => opp.estado === "won"));
  const averageTicket = priced.length ? sumPrice(priced) / priced.length : null;

  const donutSegments = STAGE_ORDER.map((stage) => ({
    stage,
    count: counts[stage],
    color: STAGE_COLORS[stage].bar,
  })).filter((segment) => segment.count > 0);

  let donutOffset = 0;
  const circumference = 2 * Math.PI * 42;

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
            <div className="crm-bar-chart" role="img" aria-label="Gráfico de barras por estado">
              {STAGE_ORDER.map((stage) => {
                const value = counts[stage];
                const height = Math.max(3, Math.round((value / maxCount) * 100));
                return (
                  <div key={stage} className="crm-bar-item">
                    <div className="crm-bar-track">
                      <div
                        className="crm-bar"
                        style={{ height: `${height}%`, background: STAGE_COLORS[stage].bar }}
                        title={`${STAGE_LABELS[stage]}: ${value}`}
                      >
                        <span className="crm-bar-value">{value}</span>
                      </div>
                    </div>
                    <div className="crm-bar-label">{STAGE_LABELS[stage]}</div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="detail-card crm-card">
          <div className="crm-card-header">
            <h3>Distribución</h3>
          </div>
          {loading ? (
            <div className="empty-column">Cargando...</div>
          ) : total === 0 ? (
            <div className="empty-column">Sin datos para mostrar</div>
          ) : (
            <div className="crm-donut-wrap">
              <svg viewBox="0 0 120 120" className="crm-donut" aria-hidden="true">
                <circle cx="60" cy="60" r="42" fill="none" stroke="#e5e7eb" strokeWidth="16" />
                {donutSegments.map((segment) => {
                  const length = (segment.count / total) * circumference;
                  const circle = (
                    <circle
                      key={segment.stage}
                      cx="60"
                      cy="60"
                      r="42"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="16"
                      strokeDasharray={`${length} ${circumference - length}`}
                      strokeDashoffset={-donutOffset}
                      transform="rotate(-90 60 60)"
                    />
                  );
                  donutOffset += length;
                  return circle;
                })}
                <text x="60" y="56" textAnchor="middle" className="crm-donut-total">
                  {total}
                </text>
                <text x="60" y="72" textAnchor="middle" className="crm-donut-caption">
                  total
                </text>
              </svg>
              <ul className="crm-legend">
                {STAGE_ORDER.map((stage) => (
                  <li key={stage}>
                    <span className="crm-legend-dot" style={{ background: STAGE_COLORS[stage].bar }} />
                    <span>{STAGE_LABELS[stage]}</span>
                    <strong>{counts[stage]}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </div>

      <div className="crm-charts-grid">
        <article className="detail-card crm-card crm-outcome-card">
          <div className="crm-card-header">
            <h3>Resultado de negociaciones</h3>
          </div>
          <div className="crm-outcome">
            <div className="crm-outcome-hero">
              <strong>{cerradas ? `${winRate}%` : "—"}</strong>
              <span>{cerradas ? "Tasa de éxito en negociaciones cerradas" : "Sin cierres aún"}</span>
            </div>
            <div className="crm-outcome-track" aria-hidden="true">
              <div
                className="crm-outcome-won"
                style={{ width: cerradas ? `${(ganadas / cerradas) * 100}%` : "0%" }}
              />
              <div
                className="crm-outcome-lost"
                style={{ width: cerradas ? `${(perdidas / cerradas) * 100}%` : "0%" }}
              />
            </div>
            <div className="crm-outcome-labels">
              <span>
                <strong style={{ color: STAGE_COLORS.won.bar }}>{ganadas}</strong> ganadas
              </span>
              <span>
                <strong style={{ color: STAGE_COLORS.lost.bar }}>{perdidas}</strong> perdidas
              </span>
              <span>
                <strong>{abiertas}</strong> abiertas
              </span>
            </div>
            <dl className="crm-value-grid">
              <div>
                <dt>En negociación</dt>
                <dd>{formatPrice(openValue)}</dd>
              </div>
              <div>
                <dt>Valor ganado</dt>
                <dd style={{ color: STAGE_COLORS.won.bar }}>{formatPrice(wonValue)}</dd>
              </div>
              <div>
                <dt>Ticket medio</dt>
                <dd>{formatPrice(averageTicket !== null ? Math.round(averageTicket) : null) ?? "—"}</dd>
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

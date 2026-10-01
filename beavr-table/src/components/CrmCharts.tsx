"use client";

import { useEffect, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { useTheme } from "@/components/ThemeProvider";
import { STAGE_COLORS, STAGE_LABELS, STAGE_ORDER, type Stage } from "@/lib/crm/stages";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

type StageMap = Record<Stage, number>;

type ChartPalette = {
  text: string;
  muted: string;
  grid: string;
  surface: string;
};

const FALLBACK_LIGHT: ChartPalette = {
  text: "#18181b",
  muted: "#71717a",
  grid: "#e4e4e7",
  surface: "#ffffff",
};

const FALLBACK_DARK: ChartPalette = {
  text: "#fafafa",
  muted: "#a1a1aa",
  grid: "#2a2a2a",
  surface: "#141414",
};

/** Animación suave al cargar / actualizar (no exagerada). */
const CHART_ANIMATION = {
  duration: 800,
  easing: "easeOutQuart" as const,
};

function readPalette(theme: "light" | "dark"): ChartPalette {
  const fallback = theme === "dark" ? FALLBACK_DARK : FALLBACK_LIGHT;
  if (typeof window === "undefined") return fallback;
  const style = getComputedStyle(document.documentElement);
  const pick = (name: string, fb: string) => style.getPropertyValue(name).trim() || fb;
  return {
    text: pick("--beavr-blue-deep", fallback.text),
    muted: pick("--beavr-muted", fallback.muted),
    grid: pick("--beavr-line", fallback.grid),
    surface: pick("--beavr-surface", fallback.surface),
  };
}

function useChartPalette() {
  const { theme } = useTheme();
  const [palette, setPalette] = useState<ChartPalette>(() =>
    theme === "dark" ? FALLBACK_DARK : FALLBACK_LIGHT,
  );

  useEffect(() => {
    setPalette(readPalette(theme));
  }, [theme]);

  return palette;
}

function tooltipDefaults(palette: ChartPalette) {
  return {
    backgroundColor: palette.surface,
    titleColor: palette.text,
    bodyColor: palette.text,
    borderColor: palette.grid,
    borderWidth: 1,
  };
}

export function CrmStageBars({ counts }: { counts: StageMap }) {
  const palette = useChartPalette();
  const labels = STAGE_ORDER.map((s) => STAGE_LABELS[s]);
  const values = STAGE_ORDER.map((s) => counts[s]);
  const colors = STAGE_ORDER.map((s) => STAGE_COLORS[s].bar);

  const data = {
    labels,
    datasets: [
      {
        label: "Oportunidades",
        data: values,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false as const,
        maxBarThickness: 48,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: CHART_ANIMATION.duration,
      easing: CHART_ANIMATION.easing,
    },
    // Barras crecen desde la línea base (abajo → arriba) al montar Resumen.
    animations: {
      y: {
        type: "number",
        easing: CHART_ANIMATION.easing,
        duration: CHART_ANIMATION.duration,
        from: (ctx) => {
          if (ctx.type !== "data" || !ctx.chart?.scales?.y) return;
          return ctx.chart.scales.y.getPixelForValue(0);
        },
      },
      base: {
        type: "number",
        easing: CHART_ANIMATION.easing,
        duration: CHART_ANIMATION.duration,
        from: (ctx) => {
          if (ctx.type !== "data" || !ctx.chart?.scales?.y) return;
          return ctx.chart.scales.y.getPixelForValue(0);
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipDefaults(palette),
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y} oportunidades`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: palette.muted,
          font: { size: 11, weight: 500 },
          maxRotation: 0,
          autoSkip: false,
        },
        grid: { display: false },
        border: { color: palette.grid },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: palette.muted,
          font: { size: 11 },
          precision: 0,
          stepSize: 1,
        },
        grid: { color: palette.grid },
        border: { display: false },
      },
    },
  };

  return (
    <div className="crm-chart-bars">
      <div className="crm-chart-canvas" role="img" aria-label="Oportunidades por etapa">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export function CrmPipelineDoughnut({
  values,
  centerLabel,
  centerCaption,
}: {
  values: StageMap;
  centerLabel: string;
  centerCaption: string;
}) {
  const palette = useChartPalette();
  const total = STAGE_ORDER.reduce((acc, s) => acc + values[s], 0);
  const labels = STAGE_ORDER.map((s) => STAGE_LABELS[s]);
  const dataValues = STAGE_ORDER.map((s) => values[s]);
  const colors = STAGE_ORDER.map((s) => STAGE_COLORS[s].bar);

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: colors,
        borderColor: palette.surface,
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    animation: {
      duration: CHART_ANIMATION.duration,
      easing: CHART_ANIMATION.easing,
      animateRotate: true,
      animateScale: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipDefaults(palette),
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed;
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return ` ${value} · ${pct}%`;
          },
        },
      },
    },
  };

  return (
    <div className="crm-chart-doughnut-wrap">
      <div className="crm-chart-doughnut">
        <div className="crm-chart-canvas crm-chart-doughnut-canvas" role="img" aria-label="Distribución por etapa">
          <Doughnut data={data} options={options} />
        </div>
        <div className="crm-chart-doughnut-center" aria-hidden="true">
          <strong>{centerLabel}</strong>
          <span>{centerCaption}</span>
        </div>
      </div>
      <ul className="crm-legend">
        {STAGE_ORDER.map((stage) => {
          const value = values[stage];
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <li key={stage}>
              <span className="crm-legend-dot" style={{ background: STAGE_COLORS[stage].bar }} />
              <span>{STAGE_LABELS[stage]}</span>
              <strong>{pct}%</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CrmOutcomeChart({
  ganadas,
  perdidas,
  winRate,
}: {
  ganadas: number;
  perdidas: number;
  winRate: number;
}) {
  const palette = useChartPalette();
  const cerradas = ganadas + perdidas;
  const wonOnly = ganadas > 0 && perdidas === 0;
  const lostOnly = perdidas > 0 && ganadas === 0;

  const data = {
    labels: [""],
    datasets: [
      {
        label: "Ganadas",
        data: [ganadas],
        backgroundColor: STAGE_COLORS.won.bar,
        borderSkipped: false as const,
        borderRadius: {
          topLeft: 9,
          bottomLeft: 9,
          topRight: wonOnly ? 9 : 0,
          bottomRight: wonOnly ? 9 : 0,
        },
        barThickness: 18,
        stack: "resultado",
      },
      {
        label: "Perdidas",
        data: [perdidas],
        backgroundColor: STAGE_COLORS.lost.bar,
        borderSkipped: false as const,
        borderRadius: {
          topLeft: lostOnly ? 9 : 0,
          bottomLeft: lostOnly ? 9 : 0,
          topRight: 9,
          bottomRight: 9,
        },
        barThickness: 18,
        stack: "resultado",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: CHART_ANIMATION.duration,
      easing: CHART_ANIMATION.easing,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: cerradas > 0,
        ...tooltipDefaults(palette),
        callbacks: {
          title: () => "Resultado",
          label: (ctx) => {
            const value = ctx.parsed.x ?? 0;
            const pct = cerradas > 0 ? Math.round((value / cerradas) * 100) : 0;
            return ` ${ctx.dataset.label}: ${value} · ${pct}%`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        display: false,
        beginAtZero: true,
        max: Math.max(cerradas, 1),
        grid: { display: false },
        border: { display: false },
      },
      y: {
        stacked: true,
        display: false,
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  return (
    <div className="crm-chart-outcome">
      <div className="crm-outcome-hero">
        <strong>{cerradas > 0 ? `${winRate}%` : "—"}</strong>
        <span>
          {cerradas > 0 ? "Tasa de éxito en negociaciones cerradas" : "Sin cierres aún"}
        </span>
      </div>
      <div
        className="crm-chart-outcome-track"
        role="img"
        aria-label="Barra de ganadas frente a perdidas"
      >
        {cerradas > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="crm-chart-outcome-empty" aria-hidden="true" />
        )}
      </div>
      <div className="crm-outcome-labels">
        <span>
          <strong style={{ color: STAGE_COLORS.won.bar }}>{ganadas}</strong> ganadas
        </span>
        <span>
          <strong style={{ color: STAGE_COLORS.lost.bar }}>{perdidas}</strong> perdidas
        </span>
      </div>
    </div>
  );
}

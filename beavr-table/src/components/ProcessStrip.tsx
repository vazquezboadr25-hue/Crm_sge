/** Proceso comercial del ERP (skill erp): del lead al cobro. */
const STEPS = [
  { id: "lead", label: "Lead" },
  { id: "oportunidad", label: "Oportunidad" },
  { id: "presupuesto", label: "Presupuesto" },
  { id: "entrega", label: "Entrega" },
  { id: "factura", label: "Factura" },
  { id: "cobro", label: "Cobro" },
] as const;

export function ProcessStrip({ activeId = "oportunidad" }: { activeId?: (typeof STEPS)[number]["id"] }) {
  return (
    <ol className="process-strip" aria-label="Proceso comercial">
      {STEPS.map((step, index) => (
        <li key={step.id} className={step.id === activeId ? "is-active" : undefined}>
          <span className="process-strip-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="process-strip-label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

export type Stage = "new" | "contacted" | "proposal" | "won" | "lost";

export const STAGE_LABELS: Record<Stage, string> = {
  new: "Nueva",
  contacted: "Contactada",
  proposal: "Propuesta",
  won: "Ganada",
  lost: "Perdida",
};

/** Colores primarios/básicos por estado de negociación */
export const STAGE_COLORS: Record<Stage, { background: string; color: string; bar: string }> = {
  new: { background: "#dbeafe", color: "#1d4ed8", bar: "#2563eb" },
  contacted: { background: "#e5e7eb", color: "#374151", bar: "#6b7280" },
  proposal: { background: "#fef3c7", color: "#b45309", bar: "#f59e0b" },
  won: { background: "#dcfce7", color: "#15803d", bar: "#22c55e" },
  lost: { background: "#fee2e2", color: "#b91c1c", bar: "#ef4444" },
};

export const STAGE_ORDER: Stage[] = ["new", "contacted", "proposal", "won", "lost"];

export function normalizeStage(value: string | null | undefined): Stage {
  const normalized = (value ?? "new").toLowerCase();

  switch (normalized) {
    case "nueva":
    case "new":
      return "new";
    case "contactada":
    case "contacted":
      return "contacted";
    case "propuesta":
    case "proposal":
      return "proposal";
    case "ganada":
    case "won":
      return "won";
    case "perdida":
    case "lost":
      return "lost";
    default:
      return "new";
  }
}

export function websiteHref(value: string | null | undefined) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

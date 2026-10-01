export type Stage = "new" | "contacted" | "proposal" | "won" | "lost";

export const STAGE_LABELS: Record<Stage, string> = {
  new: "Nueva",
  contacted: "Propuesta",
  proposal: "Negociación",
  won: "Ganada",
  lost: "Perdida",
};

export const STAGE_COLORS: Record<Stage, { background: string; color: string; bar: string }> = {
  new: { background: "#3b82f6", color: "#ffffff", bar: "#3b82f6" },
  contacted: { background: "#8b5cf6", color: "#ffffff", bar: "#8b5cf6" },
  proposal: { background: "#f97316", color: "#ffffff", bar: "#f97316" },
  won: { background: "#16a34a", color: "#ffffff", bar: "#22c55e" },
  lost: { background: "#dc2626", color: "#ffffff", bar: "#ef4444" },
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
    case "negociacion":
    case "negociación":
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

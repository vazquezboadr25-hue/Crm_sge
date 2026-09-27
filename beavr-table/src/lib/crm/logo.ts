const LOGO_PALETTES = [
  { background: "#1a4a5e", color: "#eaf2f0" },
  { background: "#e07a4f", color: "#fff7f2" },
  { background: "#2f6b45", color: "#eef7f0" },
  { background: "#8c5f1e", color: "#fff8ec" },
  { background: "#5a6b47", color: "#f3f6ef" },
  { background: "#2a5f75", color: "#eaf4f8" },
];

function hashName(name: string) {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function getEntityInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function getEntityLogoStyle(name: string) {
  return LOGO_PALETTES[hashName(name) % LOGO_PALETTES.length];
}

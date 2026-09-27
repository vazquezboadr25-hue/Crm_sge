import { getEntityInitials, getEntityLogoStyle } from "@/lib/crm/logo";

export function EntityLogo({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const style = getEntityLogoStyle(name);

  return (
    <span
      className={`entity-logo entity-logo-${size}`}
      style={{ background: style.background, color: style.color }}
      aria-hidden="true"
    >
      {getEntityInitials(name)}
    </span>
  );
}

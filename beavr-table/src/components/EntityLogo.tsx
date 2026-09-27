"use client";

import { useState } from "react";
import { getEntityInitials, getEntityLogoStyle } from "@/lib/crm/logo";

export function EntityLogo({
  name,
  size = "md",
  logoUrl,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  logoUrl?: string | null;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const style = getEntityLogoStyle(name);

  if (logoUrl && failedUrl !== logoUrl) {
    return (
      <span className={`entity-logo entity-logo-${size} entity-logo-image`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={`Logo de ${name}`} loading="lazy" onError={() => setFailedUrl(logoUrl)} />
      </span>
    );
  }

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

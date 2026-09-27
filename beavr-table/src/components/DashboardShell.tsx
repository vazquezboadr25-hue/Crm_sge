"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type NavKey = "summary" | "opportunities" | "people" | "companies";

const NAV_ITEMS: Array<{ key: NavKey; label: string; href: string }> = [
  { key: "summary", label: "Resumen", href: "/" },
  { key: "opportunities", label: "Oportunidades", href: "/?vista=oportunidades" },
  { key: "people", label: "Empleados", href: "/?vista=empleados" },
  { key: "companies", label: "Empresas", href: "/?vista=empresas" },
];

function resolveActive(pathname: string, vista: string | null): NavKey {
  if (pathname.startsWith("/empresas")) return "companies";
  if (pathname.startsWith("/empleados")) return "people";
  if (pathname.startsWith("/oportunidades")) return "opportunities";

  switch (vista) {
    case "oportunidades":
      return "opportunities";
    case "empleados":
      return "people";
    case "empresas":
      return "companies";
    default:
      return "summary";
  }
}

function DashboardShellInner({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const active = ready ? resolveActive(pathname, searchParams.get("vista")) : null;

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <Link href="/" aria-label="Ir al inicio">
            <img src="/logo-full.png" alt="beavr" className="brand-logo" />
          </Link>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`nav-item ${active === item.key ? "active" : ""}`}
            >
              <span className="nav-dot" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div>beavr</div>
          <div>CRM de oportunidades</div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

export function DashboardShell(props: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="dashboard-shell">
          <main className="main-panel">
            <div className="empty-column">Cargando...</div>
          </main>
        </div>
      }
    >
      <DashboardShellInner {...props} />
    </Suspense>
  );
}

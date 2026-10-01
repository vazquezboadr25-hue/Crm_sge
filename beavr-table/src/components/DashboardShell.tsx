"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";

type NavKey = "summary" | "opportunities" | "people" | "companies";

const SIDEBAR_KEY = "beavr-crm-sidebar-collapsed";

const NAV_ITEMS: Array<{
  key: NavKey;
  label: string;
  href: string;
  icon: ReactNode;
}> = [
  {
    key: "summary",
    label: "Resumen",
    href: "/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 19V5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M4 19h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M8 15v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M12 15V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M16 15v-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "opportunities",
    label: "Oportunidades",
    href: "/?vista=oportunidades",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="5" width="6" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
        <rect x="14" y="5" width="6" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
  {
    key: "people",
    label: "Empleados",
    href: "/?vista=empleados",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M5.5 19c1.2-3 3.4-4.5 6.5-4.5S17.8 16 19 19"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "companies",
    label: "Empresas",
    href: "/?vista=empresas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 20V7.5L12 4l8 3.5V20" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M9 20v-5h6v5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path
          d="M9 10h.01M12 10h.01M15 10h.01M9 13h.01M12 13h.01M15 13h.01"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
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

function HeaderControls() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="workspace-header-actions">
      <button
        type="button"
        className="icon-btn"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
        title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
      >
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18.5 14.5A7 7 0 0 1 9.5 5.5 7.2 7.2 0 1 0 18.5 14.5Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="settings-menu" ref={menuRef}>
        <button
          type="button"
          className="icon-btn"
          aria-label="Ajustes"
          aria-haspopup="menu"
          aria-expanded={open}
          title="Ajustes"
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.2.6.7 1 1.5 1.1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open ? (
          <div className="settings-dropdown" role="menu">
            <div className="settings-user">
              <strong>Sesión</strong>
              <span>{user?.email ?? "Sin correo"}</span>
            </div>
            <div className="settings-divider" />
            <button
              type="button"
              className="settings-item settings-item-danger"
              role="menuitem"
              onClick={async () => {
                setOpen(false);
                await signOut();
              }}
            >
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DashboardShellInner({
  title,
  subtitle,
  counts,
  children,
}: {
  title: string;
  subtitle?: string;
  counts?: Partial<Record<NavKey, number>>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setReady(true);
    setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  };

  const active = ready ? resolveActive(pathname, searchParams.get("vista")) : null;

  return (
    <div className={`dashboard-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar" aria-label="Menú lateral">
        <div className="sidebar-top">
          <div className="brand-wrap">
            <Link href="/" aria-label="Ir al inicio" className="brand-link">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-full.png" alt="beavr" className="brand-logo brand-logo-full" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt="beavr" className="brand-logo brand-logo-mark" />
            </Link>
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir menú" : "Replegar menú"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expandir menú" : "Replegar menú"}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {collapsed ? (
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        <div className="sidebar-section-label">Principal</div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => {
            const count = counts?.[item.key];
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`nav-item ${active === item.key ? "active" : ""}`}
                title={item.label}
                aria-current={active === item.key ? "page" : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {typeof count === "number" ? <span className="nav-count">{count}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-foot-copy">
            <div>beavr CRM</div>
            <div>Equipo y cartera</div>
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="workspace-header">
          <div className="workspace-title-block">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <HeaderControls />
        </header>
        <main className="main-panel">{children}</main>
      </div>
    </div>
  );
}

export function DashboardShell(props: {
  title: string;
  subtitle?: string;
  counts?: Partial<Record<NavKey, number>>;
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="dashboard-shell">
          <div className="workspace">
            <main className="main-panel">
              <div className="empty-column">Cargando...</div>
            </main>
          </div>
        </div>
      }
    >
      <DashboardShellInner {...props} />
    </Suspense>
  );
}

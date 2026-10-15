"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { CompanyEditor, type Company, type CompanyFormValues } from "@/components/CompanyDialogs";
import { CrmSummary } from "@/components/CrmSummary";
import { DashboardShell } from "@/components/DashboardShell";
import { EmployeeEditor, type Employee, type EmployeeFormValues } from "@/components/EmployeeDialogs";
import { EntityLogo } from "@/components/EntityLogo";
import { ProcessStrip } from "@/components/ProcessStrip";
import { RrhhPanel } from "@/components/rrhh/RrhhPanel";
import { uploadCompanyLogo } from "@/lib/crm/companyLogo";
import {
  mapCompanyRow,
  mapExternalContacts,
  mapInternalStaff,
  mapOpportunityRow,
  type MappedOpportunity,
} from "@/lib/crm/mapRows";
import { formatPrice } from "@/lib/crm/money";
import { mapAdmisionRow, type Admision, type StaffMember } from "@/lib/crm/rrhh";
import {
  STAGE_COLORS,
  STAGE_LABELS,
  STAGE_ORDER,
  type Stage,
} from "@/lib/crm/stages";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Opportunity = MappedOpportunity;

type SortMode = "default" | "az" | "za";
type EmployeeSortMode = SortMode | "company";

const supabase = createSupabaseBrowserClient();

const STAGE_COLUMNS = STAGE_ORDER.map((stage) => ({
  key: stage,
  label: STAGE_LABELS[stage],
}));

function formatRelative(dateIso: string) {
  const date = new Date(dateIso);
  const diffMs = Date.now() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffHours < 24) {
    const hours = Math.max(1, Math.round(diffHours));
    return `${hours} h`;
  }

  if (diffDays < 7) {
    const days = Math.round(diffDays);
    return `${days} d`;
  }

  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function resolveView(
  vista: string | null,
): "summary" | "opportunities" | "people" | "companies" | "rrhh" {
  switch (vista) {
    case "oportunidades":
      return "opportunities";
    case "empleados":
    case "contactos":
      return "people";
    case "empresas":
    case "clientes":
      return "companies";
    case "rrhh":
      return "rrhh";
    default:
      return "summary";
  }
}

function SortControls<T extends string = SortMode>({
  value,
  onChange,
  label,
  extraOptions = [],
}: {
  value: T;
  onChange: (value: T) => void;
  label: string;
  extraOptions?: { value: T; label: string }[];
}) {
  return (
    <div className="sort-controls" role="group" aria-label={label}>
      <span className="sort-label">Orden:</span>
      <button
        type="button"
        className={`sort-chip ${value === "default" ? "active" : ""}`}
        onClick={() => onChange("default" as T)}
      >
        Por defecto
      </button>
      <button
        type="button"
        className={`sort-chip ${value === "az" ? "active" : ""}`}
        onClick={() => onChange("az" as T)}
      >
        A → Z
      </button>
      <button
        type="button"
        className={`sort-chip ${value === "za" ? "active" : ""}`}
        onClick={() => onChange("za" as T)}
      >
        Z → A
      </button>
      {extraOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`sort-chip ${value === option.value ? "active" : ""}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const activeView = resolveView(searchParams.get("vista"));

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [empresaRecords, setEmpresaRecords] = useState<Company[]>([]);
  const [employeeRecords, setEmployeeRecords] = useState<Employee[]>([]);
  const [staffRecords, setStaffRecords] = useState<StaffMember[]>([]);
  const [admisionRecords, setAdmisionRecords] = useState<Admision[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [employeesSearch, setEmployeesSearch] = useState("");
  const [companiesSearch, setCompaniesSearch] = useState("");
  const [employeesSort, setEmployeesSort] = useState<EmployeeSortMode>("default");
  const [companiesSort, setCompaniesSort] = useState<SortMode>("default");
  const [companyEditorOpen, setCompanyEditorOpen] = useState(false);
  const [employeeEditorOpen, setEmployeeEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const skipRealtimeRefresh = useRef(0);

  const fetchData = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);

    const [companiesResult, peopleResult, opportunitiesResult, admisionesResult] = await Promise.all([
      supabase.from("empresas").select("*").order("created_at", { ascending: true }),
      supabase.from("personas").select("*").order("created_at", { ascending: true }),
      supabase.from("oportunidades").select("*").order("creado_en", { ascending: false }),
      supabase.from("rrhh_admisiones").select("*").order("created_at", { ascending: false }),
    ]);

    if (opportunitiesResult.error) {
      setOpportunities([]);
      setEmpresaRecords([]);
      setEmployeeRecords([]);
      setStaffRecords([]);
      setAdmisionRecords([]);
      if (!silent) setLoading(false);
      return;
    }

    const companies = (companiesResult.data ?? []) as Record<string, unknown>[];
    const people = (peopleResult.data ?? []) as Record<string, unknown>[];
    const companyById = new Map(
      companies.map((company) => [String(company.id), String(company.nombre ?? "Sin nombre")]),
    );
    const personById = new Map(
      people.map((person) => {
        const empresaId = typeof person.empresa_id === "string" ? person.empresa_id : null;
        return [
          String(person.id),
          {
            nombre: String(person.nombre ?? "Sin nombre"),
            email: String(person.email ?? "Sin email"),
            empresa: (empresaId && companyById.get(empresaId)) || "Sin empresa",
          },
        ];
      }),
    );

    setEmpresaRecords(companies.map(mapCompanyRow));
    setEmployeeRecords(mapExternalContacts(people));
    setStaffRecords(mapInternalStaff(people));
    setAdmisionRecords((admisionesResult.data ?? []).map((row) => mapAdmisionRow(row as Record<string, unknown>)));
    setOpportunities(
      ((opportunitiesResult.data ?? []) as Record<string, unknown>[]).map((row) =>
        mapOpportunityRow(row, personById, companyById),
      ),
    );
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("oportunidades-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "oportunidades" },
        () => {
          if (skipRealtimeRefresh.current > 0) {
            skipRealtimeRefresh.current -= 1;
            return;
          }
          fetchData({ silent: true });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredOpportunities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return opportunities.filter((opp) => {
      if (!query) return true;
      return [opp.nombre, opp.empresa, opp.email, opp.proyecto, opp.detalles].join(" ").toLowerCase().includes(query);
    });
  }, [opportunities, searchTerm]);

  const total = opportunities.length;
  const nuevas = opportunities.filter((o) => o.estado === "new").length;
  const empresas = new Set(opportunities.map((o) => o.empresa)).size;
  const ultima = opportunities[0] ? formatRelative(opportunities[0].creado_en) : "—";

  const grouped = useMemo(() => {
    return STAGE_ORDER.reduce(
      (acc, stage) => {
        acc[stage] = filteredOpportunities.filter((opp) => opp.estado === stage);
        return acc;
      },
      {} as Record<Stage, Opportunity[]>,
    );
  }, [filteredOpportunities]);

  const filteredEmployees = useMemo(() => {
    const query = employeesSearch.trim().toLowerCase();
    const list = employeeRecords
      .map((employee) => ({
        ...employee,
        empresa: empresaRecords.find((company) => company.id === employee.empresa_id)?.nombre ?? null,
      }))
      .filter((employee) => {
        if (!query) return true;
        return [employee.nombre, employee.email, employee.empresa, employee.cargo, employee.telefono]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });

    if (employeesSort === "az") {
      return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
    if (employeesSort === "za") {
      return [...list].sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
    }
    if (employeesSort === "company") {
      return [...list].sort((a, b) => {
        if (a.empresa && !b.empresa) return -1;
        if (!a.empresa && b.empresa) return 1;
        const byCompany = (a.empresa ?? "").localeCompare(b.empresa ?? "", "es", { sensitivity: "base" });
        return byCompany || a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
      });
    }
    return list;
  }, [employeeRecords, empresaRecords, employeesSearch, employeesSort]);

  const filteredCompanies = useMemo(() => {
    const query = companiesSearch.trim().toLowerCase();
    const list = empresaRecords.filter((company) => {
      if (!query) return true;
      const employeesText = employeeRecords
        .filter((employee) => employee.empresa_id === company.id)
        .map((employee) => `${employee.nombre} ${employee.email ?? ""}`)
        .join(" ");
      return `${company.nombre} ${company.nif ?? ""} ${company.sector ?? ""} ${employeesText}`
        .toLowerCase()
        .includes(query);
    });

    if (companiesSort === "az") {
      return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
    if (companiesSort === "za") {
      return [...list].sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
    }
    return list;
  }, [empresaRecords, employeeRecords, companiesSearch, companiesSort]);

  const stageValues = useMemo(() => {
    return STAGE_ORDER.reduce(
      (acc, stage) => {
        acc[stage] = (grouped[stage] ?? []).reduce((sum, opp) => sum + (Number(opp.precio) || 0), 0);
        return acc;
      },
      {} as Record<Stage, number>,
    );
  }, [grouped]);

  const employeeCountByCompany = useMemo(() => {
    const map = new Map<string, number>();
    for (const employee of employeeRecords) {
      if (!employee.empresa_id) continue;
      map.set(employee.empresa_id, (map.get(employee.empresa_id) ?? 0) + 1);
    }
    return map;
  }, [employeeRecords]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleSaveCompany = async (values: CompanyFormValues) => {
    setSaving(true);
    const { data, error } = await supabase
      .from("empresas")
      .insert({
        nombre: values.nombre,
        nif: values.nif || null,
        sector: values.sector || null,
        sitio_web: values.sitio_web || null,
        notas: values.notas || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      setSaving(false);
      setNotice({ type: "error", text: "No se ha podido guardar el cliente. Inténtalo de nuevo." });
      return;
    }

    let logoFailed = false;
    if (values.logoFile) {
      try {
        const logoUrl = await uploadCompanyLogo(supabase, data.id, values.logoFile);
        const { error: logoError } = await supabase.from("empresas").update({ logo_url: logoUrl }).eq("id", data.id);
        if (logoError) throw logoError;
      } catch {
        logoFailed = true;
      }
    }
    setSaving(false);

    setCompanyEditorOpen(false);
    setNotice(
      logoFailed
        ? { type: "error", text: `Cliente «${values.nombre}» añadido, pero no se ha podido subir el logo.` }
        : { type: "success", text: `Cliente «${values.nombre}» añadido.` },
    );
    fetchData();
  };

  const handleSaveEmployee = async (values: EmployeeFormValues) => {
    setSaving(true);
    const { error } = await supabase.from("personas").insert({
      nombre: values.nombre,
      email: values.email || null,
      empresa_id: values.empresa_id || null,
      cargo: values.cargo || null,
      telefono: values.telefono || null,
      notas: values.notas || null,
      es_interno: false,
    });
    setSaving(false);

    if (error) {
      setNotice({ type: "error", text: "No se ha podido guardar el contacto. Inténtalo de nuevo." });
      return;
    }

    setEmployeeEditorOpen(false);
    setNotice({ type: "success", text: `Contacto «${values.nombre}» añadido.` });
    fetchData();
  };

  const noticeBanner = notice && (
    <div className={`notice notice-${notice.type}`} role="status">
      <span>{notice.text}</span>
      <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  );

  const handleDrop = async (nextStage: Stage) => {
    if (!draggedId) return;

    const movedId = draggedId;
    const previous = opportunities;
    const nextOpportunities = opportunities.map((opp) =>
      opp.id === movedId ? { ...opp, estado: nextStage } : opp,
    );
    setOpportunities(nextOpportunities);
    setDraggedId(null);

    skipRealtimeRefresh.current += 1;
    const { error } = await supabase.from("oportunidades").update({ estado: nextStage }).eq("id", movedId);

    if (error) {
      skipRealtimeRefresh.current = Math.max(0, skipRealtimeRefresh.current - 1);
      setOpportunities(previous);
    }
  };

  const titles = {
    summary: { title: "Resumen", subtitle: "Cuadro de mando del módulo CRM" },
    opportunities: { title: "Oportunidades", subtitle: "Pipeline comercial · del lead a la venta" },
    people: { title: "Contactos", subtitle: "Personas de contacto en clientes" },
    companies: { title: "Clientes", subtitle: "Empresas y cuentas de la cartera" },
    rrhh: { title: "Plantilla", subtitle: "Equipo interno, admisiones y fichas RRHH" },
  } as const;

  const navCounts = {
    summary: opportunities.length,
    opportunities: opportunities.length,
    people: employeeRecords.length,
    companies: empresaRecords.length,
    rrhh: staffRecords.length,
  };

  return (
    <DashboardShell
      title={titles[activeView].title}
      subtitle={titles[activeView].subtitle}
      counts={navCounts}
    >
      {activeView === "summary" && (
        <CrmSummary
          opportunities={opportunities}
          loading={loading}
          companyCount={empresaRecords.length}
          employeeCount={employeeRecords.length}
        />
      )}

      {activeView === "opportunities" && (
        <>
          <ProcessStrip activeId="oportunidad" />

          <section className="stats-grid" aria-label="Estadísticas principales">
            <article className="stat-card">
              <div className="stat-number">{total}</div>
              <div className="stat-label">Total</div>
            </article>
            <article className="stat-card">
              <div className="stat-number">{nuevas}</div>
              <div className="stat-label">Nuevas</div>
            </article>
            <article className="stat-card">
              <div className="stat-number">{empresas}</div>
              <div className="stat-label">Clientes en pipeline</div>
            </article>
            <article className="stat-card">
              <div className="stat-number">{ultima}</div>
              <div className="stat-label">Última actividad</div>
            </article>
          </section>

          <section className="crm-toolbar" aria-label="Herramientas del tablero">
            <div className="crm-toolbar-left">
              <div className="search-box">
                <span className="search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M16.2 16.2L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar proyecto, persona o empresa..."
                  aria-label="Buscar oportunidad"
                />
              </div>
            </div>
          </section>

          <section className="board-wrapper">
            {STAGE_COLUMNS.map((column) => (
              <div
                key={column.key}
                className="board-column"
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(column.key)}
              >
                <div className="board-header">
                  <h3>{column.label}</h3>
                  <span>{grouped[column.key]?.length ?? 0}</span>
                </div>
                <span className="board-column-value">{formatPrice(stageValues[column.key]) ?? "—"}</span>

                {loading ? (
                  <div className="empty-column">Cargando...</div>
                ) : grouped[column.key]?.length ? (
                  grouped[column.key].map((opp) => (
                    <Link
                      key={opp.id}
                      href={`/oportunidades/${opp.id}`}
                      className="kanban-card kanban-card-compact"
                      draggable
                      onDragStart={(event) => {
                        setDraggedId(opp.id);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", opp.id);
                      }}
                      onDragEnd={() => setDraggedId(null)}
                    >
                      <div className="card-name">{opp.nombre}</div>
                      <div className="card-project">{opp.proyecto}</div>
                      <div className="card-price">{formatPrice(opp.precio) ?? "Sin precio"}</div>
                      <div className="card-meta-row">
                        <span className="card-company">{opp.empresa}</span>
                        <span
                          className="status-pill card-status"
                          style={{
                            background: STAGE_COLORS[opp.estado].background,
                            color: STAGE_COLORS[opp.estado].color,
                          }}
                        >
                          {STAGE_LABELS[opp.estado]}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="empty-column">Sin registros</div>
                )}
              </div>
            ))}
          </section>
        </>
      )}

      {activeView === "rrhh" && (
        <RrhhPanel
          staff={staffRecords}
          admisiones={admisionRecords}
          loading={loading}
          onRefresh={() => fetchData({ silent: true })}
        />
      )}

      {activeView === "people" && (
        <section aria-label="Contactos">
          {noticeBanner}

          <div className="crm-toolbar">
            <div className="crm-toolbar-left">
              <div className="directory-search-box search-box">
                <span className="search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M16.2 16.2L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={employeesSearch}
                  onChange={(event) => setEmployeesSearch(event.target.value)}
                  placeholder="Buscar contacto, cargo, correo o cliente..."
                  aria-label="Buscar contactos"
                />
              </div>
              <SortControls
                value={employeesSort}
                onChange={setEmployeesSort}
                label="Orden de contactos"
                extraOptions={[{ value: "company", label: "Por cliente" }]}
              />
            </div>
            <div className="crm-toolbar-actions">
              <button type="button" className="btn btn-primary" onClick={() => setEmployeeEditorOpen(true)}>
                + Nuevo contacto
              </button>
            </div>
          </div>

          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Contacto</th>
                  <th>Cliente</th>
                  <th>Cargo</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="crm-table-empty">
                      Cargando…
                    </td>
                  </tr>
                ) : filteredEmployees.length ? (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <Link href={`/empleados/${employee.id}`} className="crm-table-link">
                          <EntityLogo name={employee.nombre} size="sm" />
                          <span>{employee.nombre}</span>
                        </Link>
                      </td>
                      <td className="crm-table-muted">
                        {employee.empresa_id ? (
                          <Link href={`/empresas/${employee.empresa_id}`} className="crm-table-link">
                            {employee.empresa || "—"}
                          </Link>
                        ) : (
                          employee.empresa || "—"
                        )}
                      </td>
                      <td className="crm-table-muted">{employee.cargo || "—"}</td>
                      <td className="crm-table-muted">{employee.email || "—"}</td>
                      <td className="crm-table-muted">{employee.telefono || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="crm-table-empty">
                      {employeesSearch.trim() ? (
                        "Ningún contacto coincide con la búsqueda"
                      ) : (
                        <div className="empty-state-inline">
                          <strong>Todavía no tienes contactos</strong>
                          <p>Los contactos que crees aparecerán aquí, vinculados a un cliente.</p>
                          <button type="button" className="btn btn-primary" onClick={() => setEmployeeEditorOpen(true)}>
                            Crear contacto
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeView === "companies" && (
        <section aria-label="Clientes">
          {noticeBanner}

          <div className="crm-toolbar">
            <div className="crm-toolbar-left">
              <div className="directory-search-box search-box">
                <span className="search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M16.2 16.2L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={companiesSearch}
                  onChange={(event) => setCompaniesSearch(event.target.value)}
                  placeholder="Buscar cliente, NIF, sector o contacto..."
                  aria-label="Buscar clientes"
                />
              </div>
              <SortControls value={companiesSort} onChange={setCompaniesSort} label="Orden de clientes" />
            </div>
            <div className="crm-toolbar-actions">
              <button type="button" className="btn btn-primary" onClick={() => setCompanyEditorOpen(true)}>
                + Nuevo cliente
              </button>
            </div>
          </div>

          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Sector</th>
                  <th>NIF</th>
                  <th>Contactos</th>
                  <th>Sitio web</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="crm-table-empty">
                      Cargando…
                    </td>
                  </tr>
                ) : filteredCompanies.length ? (
                  filteredCompanies.map((company) => (
                    <tr key={company.id}>
                      <td>
                        <Link href={`/empresas/${company.id}`} className="crm-table-link">
                          <EntityLogo name={company.nombre} logoUrl={company.logo_url} size="sm" />
                          <span>{company.nombre}</span>
                        </Link>
                      </td>
                      <td>
                        {company.sector ? (
                          <span className="company-sector">{company.sector}</span>
                        ) : (
                          <span className="crm-table-muted">—</span>
                        )}
                      </td>
                      <td className="crm-table-muted">{company.nif || "—"}</td>
                      <td className="crm-table-muted">{employeeCountByCompany.get(company.id) ?? 0}</td>
                      <td className="crm-table-muted">
                        {company.sitio_web ? (
                          <a
                            href={
                              company.sitio_web.startsWith("http")
                                ? company.sitio_web
                                : `https://${company.sitio_web}`
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            {company.sitio_web.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="crm-table-empty">
                      {companiesSearch.trim() ? (
                        "Ningún cliente coincide con la búsqueda"
                      ) : (
                        <div className="empty-state-inline">
                          <strong>Todavía no tienes clientes</strong>
                          <p>Las empresas que crees aparecerán aquí con sus contactos y oportunidades.</p>
                          <button type="button" className="btn btn-primary" onClick={() => setCompanyEditorOpen(true)}>
                            Crear cliente
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {companyEditorOpen && (
        <CompanyEditor
          company={null}
          existingNames={empresaRecords.map((company) => company.nombre)}
          saving={saving}
          onSave={handleSaveCompany}
          onClose={() => setCompanyEditorOpen(false)}
        />
      )}

      {employeeEditorOpen && (
        <EmployeeEditor
          employee={null}
          mode="contact"
          companies={empresaRecords.map((company) => ({ id: company.id, nombre: company.nombre }))}
          existingEmails={employeeRecords
            .filter((employee) => employee.email)
            .map((employee) => employee.email as string)}
          saving={saving}
          onSave={handleSaveEmployee}
          onClose={() => setEmployeeEditorOpen(false)}
        />
      )}
    </DashboardShell>
  );
}

export default function Home() {
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
      <HomeContent />
    </Suspense>
  );
}
